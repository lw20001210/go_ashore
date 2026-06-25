import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MergeSyncDto } from './dto/sync.dto';
import { SyncService } from './sync.service';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('merge')
  merge(@Req() request: AuthRequest, @Body() dto: MergeSyncDto) {
    return this.syncService.merge(request.user.sub, dto);
  }
}
