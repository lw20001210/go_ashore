import { DailyPlan, Task, UserProfile } from '@shangan/shared';
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class GenerateDailyPlanDto {
  @IsObject()
  profile!: UserProfile;

  @IsOptional()
  @IsObject()
  yesterdayPlan?: DailyPlan;
}

export class ReviewDto {
  @IsArray()
  completedTasks!: Task[];

  @IsString()
  userNote!: string;
}
