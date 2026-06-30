import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AI_DAILY_PLAN_LIMIT } from '@shangan/shared';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ACCESS_TOKEN_COOKIE } from '../src/auth/auth-cookies';
import { PrismaService } from '../src/prisma/prisma.service';

describe('API e2e', () => {
  let app: INestApplication<App>;
  let httpServer: App;
  let prisma: PrismaService;
  const testEmails: string[] = [];

  function uniqueEmail() {
    const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
    testEmails.push(email);
    return email;
  }

  async function registerAndGetAgent(email: string, password = 'testpass123') {
    const agent = request.agent(httpServer);
    await agent
      .post('/api/auth/register')
      .send({ email, password })
      .expect(201);
    return agent;
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    httpServer = app.getHttpServer();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    for (const email of testEmails) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) continue;
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await prisma.aiDailyUsage.deleteMany({ where: { userId: user.id } });
      await prisma.dailyPlan.deleteMany({ where: { userId: user.id } });
      await prisma.dailyReview.deleteMany({ where: { userId: user.id } });
      await prisma.profile.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await app.close();
  });

  it('POST /api/auth/login 登录成功并写入 Cookie', async () => {
    const email = uniqueEmail();
    const password = 'testpass123';
    await request(httpServer).post('/api/auth/register').send({ email, password }).expect(201);

    const res = await request(httpServer).post('/api/auth/login').send({ email, password }).expect(201);

    expect(res.body.user.email).toBe(email);
    const raw = res.headers['set-cookie'];
    const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
    expect(cookies.some((c) => c.startsWith(`${ACCESS_TOKEN_COOKIE}=`))).toBe(true);
  });

  it('POST /api/auth/forgot-password 未注册邮箱也返回统一提示', async () => {
    const res = await request(httpServer)
      .post('/api/auth/forgot-password')
      .send({ email: `ghost-${Date.now()}@test.local` })
      .expect(201);

    expect(res.body.ok).toBe(true);
    expect(res.body.message).toContain('若该邮箱已注册');
  });

  it('GET /api/ai/quota 登录用户返回每日限额', async () => {
    const agent = await registerAndGetAgent(uniqueEmail());

    const res = await agent.get('/api/ai/quota').expect(200);

    expect(res.body.requiresLogin).toBe(false);
    expect(res.body.limit).toBe(AI_DAILY_PLAN_LIMIT);
    expect(res.body.used).toBe(0);
    expect(res.body.remaining).toBe(AI_DAILY_PLAN_LIMIT);
  });

  it('POST /api/sync/merge 同步计划与资料', async () => {
    const email = uniqueEmail();
    const agent = await registerAndGetAgent(email);
    const planDate = '2026-06-30';

    const res = await agent
      .post('/api/sync/merge')
      .send({
        profile: {
          examDate: '2026-12-01',
          examType: 'guokao',
          weekdayMinutes: 120,
          weekendMinutes: 240,
          focusSubjects: ['言语', '数量'],
          phase: 'written',
        },
        plans: [
          {
            date: planDate,
            tasks: [
              {
                id: 't1',
                subject: '言语',
                title: '片段阅读 20 题',
                estimatedMinutes: 30,
                completed: false,
              },
            ],
            aiGenerated: false,
            totalMinutes: 30,
          },
        ],
        reviews: [],
      })
      .expect(201);

    expect(res.body.ok).toBe(true);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const saved = await prisma.dailyPlan.findFirst({
      where: { userId: user.id, date: new Date(planDate) },
    });
    expect(saved?.totalMinutes).toBe(30);
  });
});
