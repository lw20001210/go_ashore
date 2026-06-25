import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SaveReviewDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('today')
  getToday(@Req() request: AuthRequest) {
    return this.reviewsService.getToday(request.user.sub);
  }

  @Post('today')
  saveToday(@Req() request: AuthRequest, @Body() dto: SaveReviewDto) {
    return this.reviewsService.saveToday(request.user.sub, dto);
  }
}
