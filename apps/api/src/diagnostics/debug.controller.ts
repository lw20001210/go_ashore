import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ErrorLogService } from './error-log.service';

@Controller('debug')
export class DebugController {
  constructor(private readonly errorLog: ErrorLogService) {}

  @Get('errors')
  listErrors() {
    this.assertDev();
    return {
      items: this.errorLog.listRecent(),
      lookupHint: 'GET /api/debug/errors/:requestId',
    };
  }

  @Get('errors/:requestId')
  getError(@Param('requestId') requestId: string) {
    this.assertDev();
    const record = this.errorLog.get(requestId);
    if (!record) {
      throw new NotFoundException(`未找到任务 ID：${requestId}`);
    }
    return record;
  }

  private assertDev() {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
  }
}
