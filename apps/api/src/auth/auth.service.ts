import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from './auth.types';
import type { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
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
