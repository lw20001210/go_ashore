import { ExamType, Subject, subjects } from '@shangan/shared';
import { IsArray, IsDateString, IsIn, IsInt, Min } from 'class-validator';

export class UpsertProfileDto {
  @IsDateString()
  examDate!: string;

  @IsIn(['guokao', 'shengkao'])
  examType!: ExamType;

  @IsInt()
  @Min(15)
  weekdayMinutes!: number;

  @IsInt()
  @Min(30)
  weekendMinutes!: number;

  @IsArray()
  @IsIn(subjects, { each: true })
  focusSubjects!: Subject[];
}
