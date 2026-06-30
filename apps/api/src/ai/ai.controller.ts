import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { OptionalAuthRequest } from '../auth/auth.types';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { todayDateKey } from '../common/date';
import { PlansService } from '../plans/plans.service';
import { AiUsageService } from './ai-usage.service';
import { AiService } from './ai.service';
import { GenerateDailyPlanDto, ReviewDto } from './dto/ai.dto';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly plansService: PlansService,
    private readonly aiUsage: AiUsageService,
  ) {}

  @Get('status')
  status() {
    return this.aiService.getStatus();
  }

  @Get('quota')
  @UseGuards(OptionalJwtAuthGuard)
  async quota(@Req() request: OptionalAuthRequest) {
    if (!request.user?.sub) {
      return { limit: 0, used: 0, remaining: 0, requiresLogin: true };
    }
    return { ...(await this.aiUsage.getQuota(request.user.sub)), requiresLogin: false };
  }

  @Post('daily-plan')
  @UseGuards(OptionalJwtAuthGuard)
  async generateDailyPlan(@Body() dto: GenerateDailyPlanDto, @Req() request: OptionalAuthRequest) {
    const userId = request.user?.sub;
    const useRemoteAi = Boolean(userId) && this.aiService.isDeepSeekConfigured();

    if (useRemoteAi && userId) {
      await this.aiUsage.assertCanGenerate(userId);
    }

    const { tasks, aiGenerated } = await this.aiService.generateDailyPlan(dto.profile, {
      useRemoteAi,
    });

    if (userId && aiGenerated) {
      await this.aiUsage.recordGeneration(userId);
    }

    if (userId) {
      return this.plansService.upsertToday(userId, tasks, aiGenerated);
    }
    return {
      date: todayDateKey(),
      tasks,
      aiGenerated,
      totalMinutes: tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0),
    };
  }

  @Post('review')
  @UseGuards(OptionalJwtAuthGuard)
  async streamReview(
    @Body() dto: ReviewDto,
    @Req() request: OptionalAuthRequest,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');

    for await (const chunk of this.aiService.streamReview(dto.completedTasks, dto.userNote, {
      useRemoteAi: Boolean(request.user?.sub),
    })) {
      response.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    response.write('data: [DONE]\n\n');
    response.end();
  }
}
