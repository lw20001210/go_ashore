import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AI_DAILY_PLAN_LIMIT } from '@shangan/shared';
import { todayDateOnly } from '../common/date';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiUsageService {
  constructor(private readonly prisma: PrismaService) {}

  async getQuota(userId: string) {
    const row = await this.prisma.aiDailyUsage.findUnique({
      where: { userId_date: { userId, date: todayDateOnly() } },
    });
    const used = row?.planGenerations ?? 0;
    return {
      limit: AI_DAILY_PLAN_LIMIT,
      used,
      remaining: Math.max(0, AI_DAILY_PLAN_LIMIT - used),
    };
  }

  async assertCanGenerate(userId: string) {
    const { remaining } = await this.getQuota(userId);
    if (remaining <= 0) {
      throw new HttpException(
        `今日 AI 生成次数已用完（${AI_DAILY_PLAN_LIMIT} 次/天，东八区零点重置）`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async recordGeneration(userId: string) {
    await this.prisma.aiDailyUsage.upsert({
      where: { userId_date: { userId, date: todayDateOnly() } },
      create: { userId, date: todayDateOnly(), planGenerations: 1 },
      update: { planGenerations: { increment: 1 } },
    });
  }
}
