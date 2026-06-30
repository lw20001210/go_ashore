import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from './auth.types';
import type {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(dto.password, 10),
      },
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokens(user);
  }

  refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const secret = this.config.getOrThrow<string>('JWT_SECRET');

    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret,
      });
      // 只保留业务字段，丢弃 iat/exp，避免 signTokens 再次设置 expiresIn 时冲突
      return this.signTokens({ sub: payload.sub, email: payload.email });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      const code = String(randomInt(100000, 1000000));
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await this.prisma.passwordResetToken.create({
        data: { userId: user.id, token: code, expiresAt },
      });

      await this.mail.sendPasswordReset(email, code);
    }

    return { ok: true, message: '若该邮箱已注册，验证码已发送到邮箱，请查收（含垃圾箱）' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('验证码错误或已过期，请重新获取');
    }

    const record = await this.prisma.passwordResetToken.findFirst({
      where: { userId: user.id, token: dto.code, expiresAt: { gt: new Date() } },
    });

    if (!record) {
      throw new BadRequestException('验证码错误或已过期，请重新获取');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(dto.password, 10) },
    });
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    return { ok: true, message: '密码已重置，请使用新密码登录' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('当前密码不正确');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 10) },
    });

    return { ok: true, message: '密码已修改' };
  }

  isPasswordResetAvailable() {
    return this.mail.isConfigured();
  }

  private issueTokens(user: User) {
    return this.signTokens({ sub: user.id, email: user.email });
  }

  private signTokens(payload: JwtPayload) {
    const secret = this.config.getOrThrow<string>('JWT_SECRET');
    const accessExpiresIn = (this.config.get<string>('JWT_ACCESS_EXPIRES') ??
      '15m') as '15m';
    const refreshExpiresIn = (this.config.get<string>('JWT_REFRESH_EXPIRES') ??
      '7d') as '7d';

    return {
      user: { id: payload.sub, email: payload.email },
      accessToken: this.jwtService.sign(payload, {
        secret,
        expiresIn: accessExpiresIn,
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret,
        expiresIn: refreshExpiresIn,
      }),
    };
  }
}
