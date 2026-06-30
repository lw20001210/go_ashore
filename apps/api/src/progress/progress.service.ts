import { Injectable } from '@nestjs/common';
import { ProgressSummary, Subject, Task, subjects } from '@shangan/shared';
import { daysUntilExam, streakDaysFromDateKeys, toDateKey } from '../common/date';
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
      daysUntilExam: profile ? daysUntilExam(toDateKey(profile.examDate)) : 0,
      streakDays: streakDaysFromDateKeys(reviews.map((review) => toDateKey(review.date))),
      subjectCounts,
    };
  }
}
