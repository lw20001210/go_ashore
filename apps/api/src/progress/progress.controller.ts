import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProgressService } from './progress.service';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  getProgress(@Req() request: AuthRequest) {
    return this.progressService.getProgress(request.user.sub);
  }
}
