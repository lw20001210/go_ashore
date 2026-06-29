import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { HealthController } from './health.controller';
import { HistoryModule } from './history/history.module';
import { PlansModule } from './plans/plans.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgressModule } from './progress/progress.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SyncModule } from './sync/sync.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DiagnosticsModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    PlansModule,
    ReviewsModule,
    ProgressModule,
    HistoryModule,
    SyncModule,
    AiModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
