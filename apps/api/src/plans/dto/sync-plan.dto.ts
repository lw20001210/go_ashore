import { Subject, subjects } from '@shangan/shared';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsString, Min, ValidateNested } from 'class-validator';

class SyncTaskDto {
  @IsString()
  id!: string;

  @IsIn(subjects)
  subject!: Subject;

  @IsString()
  title!: string;

  @IsInt()
  @Min(5)
  estimatedMinutes!: number;

  @IsBoolean()
  completed!: boolean;
}

export class SyncTodayPlanDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncTaskDto)
  tasks!: SyncTaskDto[];
}
