import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MergeSyncDto } from './dto/sync.dto';

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async merge(userId: string, dto: MergeSyncDto) {
    if (dto.profile) {
      await this.prisma.profile.upsert({
        where: { userId },
        create: {
          userId,
          examDate: new Date(dto.profile.examDate),
          examType: dto.profile.examType,
          weekdayMinutes: dto.profile.weekdayMinutes,
          weekendMinutes: dto.profile.weekendMinutes,
          focusSubjects: dto.profile.focusSubjects,
          phase: 'written',
        },
        update: {},
      });
    }

    for (const plan of dto.plans) {
      await this.prisma.dailyPlan.upsert({
        where: { userId_date: { userId, date: new Date(plan.date) } },
        create: {
          userId,
          date: new Date(plan.date),
          tasks: plan.tasks as unknown as Prisma.InputJsonValue,
          aiGenerated: plan.aiGenerated,
          totalMinutes: plan.totalMinutes,
        },
        update: {
          tasks: plan.tasks as unknown as Prisma.InputJsonValue,
          aiGenerated: plan.aiGenerated,
          totalMinutes: plan.totalMinutes,
        },
      });
    }

    for (const review of dto.reviews) {
      await this.prisma.dailyReview.upsert({
        where: { userId_date: { userId, date: new Date(review.date) } },
        create: {
          userId,
          date: new Date(review.date),
          completedTaskIds: review.completedTaskIds,
          userNote: review.userNote,
          aiSummary: review.aiSummary,
          tomorrowSuggestion: review.tomorrowSuggestion,
        },
        update: {
          completedTaskIds: review.completedTaskIds,
          userNote: review.userNote,
          aiSummary: review.aiSummary,
          tomorrowSuggestion: review.tomorrowSuggestion,
        },
      });
    }

    return { ok: true };
  }
}
