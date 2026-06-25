import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { AuthRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpsertProfileDto } from './dto/profile.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Req() request: AuthRequest) {
    return this.usersService.getProfile(request.user.sub);
  }

  @Put('profile')
  upsertProfile(@Req() request: AuthRequest, @Body() dto: UpsertProfileDto) {
    return this.usersService.upsertProfile(request.user.sub, dto);
  }
}
