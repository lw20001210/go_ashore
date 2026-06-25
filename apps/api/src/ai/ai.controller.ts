import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { OptionalAuthRequest } from '../auth/auth.types';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { todayDateKey } from '../common/date';
import { PlansService } from '../plans/plans.service';
import { AiService } from './ai.service';
import { GenerateDailyPlanDto, ReviewDto } from './dto/ai.dto';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly plansService: PlansService,
  ) {}

  @Get('status')
  status() {
    return this.aiService.getStatus();
  }

  @Post('daily-plan')
  @UseGuards(OptionalJwtAuthGuard)
  async generateDailyPlan(@Body() dto: GenerateDailyPlanDto, @Req() request: OptionalAuthRequest) {
    const tasks = await this.aiService.generateDailyPlan(dto.profile);
    const userId = request.user?.sub;
    if (userId) {
      return this.plansService.upsertToday(userId, tasks, true);
    }
    return {
      date: todayDateKey(),
      tasks,
      aiGenerated: true,
      totalMinutes: tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0),
    };
  }

  @Post('review')
  async streamReview(@Body() dto: ReviewDto, @Res() response: Response) {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');

    for await (const chunk of this.aiService.streamReview(dto.completedTasks, dto.userNote)) {
      response.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    response.write('data: [DONE]\n\n');
    response.end();
  }
}
