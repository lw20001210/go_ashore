import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  readRefreshToken,
} from './auth-cookies';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import type { AuthRequest } from './auth.types';
import { LoginDto, RegisterDto } from './dto/auth.dto';

const isProduction = () => process.env.NODE_ENV === 'production';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setAuthCookies(response, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setAuthCookies(response, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post('refresh')
  refresh(
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = this.authService.refresh(
      readRefreshToken(request.cookies ?? {}),
    );
    this.setAuthCookies(response, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    clearAuthCookies(response);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthRequest) {
    return { user: { id: request.user.sub, email: request.user.email } };
  }

  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    clearAuthCookies(response);
    response.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
      path: '/',
      sameSite: 'lax',
      secure: isProduction(),
    });
    response.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      sameSite: 'lax',
      secure: isProduction(),
    });
  }
}
