import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlansModule } from '../plans/plans.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiUsageService } from './ai-usage.service';

@Module({
  imports: [AuthModule, PlansModule],
  controllers: [AiController],
  providers: [AiService, AiUsageService],
  exports: [AiService],
})
export class AiModule {}
