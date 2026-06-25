import { IsArray, IsString } from 'class-validator';

export class SaveReviewDto {
  @IsArray()
  completedTaskIds!: string[];

  @IsString()
  userNote!: string;

  @IsString()
  aiSummary!: string;

  @IsString()
  tomorrowSuggestion!: string;
}
