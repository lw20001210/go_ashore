import { Subject, subjects } from '@shangan/shared';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateTaskDto {
  @IsIn(subjects)
  subject!: Subject;

  @IsString()
  title!: string;

  @IsInt()
  @Min(5)
  estimatedMinutes!: number;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsIn(subjects)
  subject?: Subject;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  estimatedMinutes?: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
