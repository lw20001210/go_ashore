import { Injectable } from '@nestjs/common';
import { ProgressSummary, Subject, Task, subjects } from '@shangan/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(userId: string): Promise<ProgressSummary> {
    const [profile, plans, reviews] = await Promise.all([
      this.prisma.profile.findUnique({ where: { userId } }),
      this.prisma.dailyPlan.findMany({ where: { userId } }),
      this.prisma.dailyReview.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    ]);

    const subjectCounts = Object.fromEntries(subjects.map((subject) => [subject, 0])) as Record<
      Subject,
      number
    >;

    for (const plan of plans) {
      for (const task of plan.tasks as unknown as Task[]) {
        if (task.completed) {
          subjectCounts[task.subject] += 1;
        }
      }
    }

    return {
      daysUntilExam: profile ? this.daysUntil(profile.examDate) : 0,
      streakDays: this.streakDays(reviews.map((review) => review.date)),
      subjectCounts,
    };
  }

  private daysUntil(examDate: Date) {
    const today = new Date();
    const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const end = Date.UTC(examDate.getFullYear(), examDate.getMonth(), examDate.getDate());
    return Math.max(0, Math.ceil((end - start) / 86400000));
  }

  private streakDays(dates: Date[]) {
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    const keys = new Set(dates.map((date) => date.toISOString().slice(0, 10)));
    while (keys.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }
}
