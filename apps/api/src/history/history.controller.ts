import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { HistoryDay } from '@shangan/shared';
import { AuthRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HistoryService } from './history.service';

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  list(@Req() request: AuthRequest): Promise<{ items: HistoryDay[] }> {
    return this.historyService.list(request.user.sub);
  }
}
