import { DailyPlan, DailyReview, UserProfile } from '@shangan/shared';
import { IsArray, IsObject, IsOptional } from 'class-validator';

export class MergeSyncDto {
  @IsOptional()
  @IsObject()
  profile?: UserProfile;

  @IsArray()
  plans!: DailyPlan[];

  @IsArray()
  reviews!: DailyReview[];
}
