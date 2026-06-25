import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { DebugController } from './debug.controller';
import { ErrorLogService } from './error-log.service';
import { RequestIdMiddleware } from './request-id.middleware';

@Global()
@Module({
  controllers: [DebugController],
  providers: [ErrorLogService, AllExceptionsFilter, RequestIdMiddleware],
  exports: [ErrorLogService, AllExceptionsFilter],
})
export class DiagnosticsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
