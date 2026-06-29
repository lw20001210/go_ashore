import { Injectable } from '@nestjs/common';
import { HistoryDay, Task } from '@shangan/shared';
import { toDateKey } from '../common/date';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<{ items: HistoryDay[] }> {
    const [plans, reviews] = await Promise.all([
      this.prisma.dailyPlan.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
      this.prisma.dailyReview.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
    ]);

    const byDate = new Map<string, HistoryDay>();

    for (const plan of plans) {
      const date = toDateKey(plan.date);
      const entry = byDate.get(date) ?? { date, plan: null, review: null };
      entry.plan = {
        date,
        tasks: plan.tasks as unknown as Task[],
        aiGenerated: plan.aiGenerated,
        totalMinutes: plan.totalMinutes,
      };
      byDate.set(date, entry);
    }

    for (const review of reviews) {
      const date = toDateKey(review.date);
      const entry = byDate.get(date) ?? { date, plan: null, review: null };
      entry.review = {
        date,
        completedTaskIds: review.completedTaskIds,
        userNote: review.userNote,
        aiSummary: review.aiSummary,
        tomorrowSuggestion: review.tomorrowSuggestion,
      };
      byDate.set(date, entry);
    }

    const items = [...byDate.values()]
      .filter((item) => this.hasContent(item))
      .sort((a, b) => b.date.localeCompare(a.date));

    return { items };
  }

  private hasContent(item: HistoryDay) {
    const hasPlan = (item.plan?.tasks.length ?? 0) > 0;
    const hasReview = Boolean(
      item.review?.aiSummary?.trim() || item.review?.userNote?.trim(),
    );
    return hasPlan || hasReview;
  }
}
