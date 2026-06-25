import { Injectable, NotFoundException } from '@nestjs/common';
import { DailyReview } from '@shangan/shared';
import { todayDateOnly, toDateKey } from '../common/date';
import { PrismaService } from '../prisma/prisma.service';
import { SaveReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async getToday(userId: string): Promise<DailyReview> {
    const review = await this.prisma.dailyReview.findUnique({
      where: { userId_date: { userId, date: todayDateOnly() } },
    });
    if (!review) {
      throw new NotFoundException('Today review not found');
    }
    return {
      date: toDateKey(review.date),
      completedTaskIds: review.completedTaskIds,
      userNote: review.userNote,
      aiSummary: review.aiSummary,
      tomorrowSuggestion: review.tomorrowSuggestion,
    };
  }

  async saveToday(userId: string, dto: SaveReviewDto): Promise<DailyReview> {
    const review = await this.prisma.dailyReview.upsert({
      where: { userId_date: { userId, date: todayDateOnly() } },
      create: { userId, date: todayDateOnly(), ...dto },
      update: dto,
    });
    return {
      date: toDateKey(review.date),
      completedTaskIds: review.completedTaskIds,
      userNote: review.userNote,
      aiSummary: review.aiSummary,
      tomorrowSuggestion: review.tomorrowSuggestion,
    };
  }
}
