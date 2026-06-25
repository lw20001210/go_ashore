import type { examTypes, subjects } from '../constants';

export type Subject = (typeof subjects)[number];
export type ExamType = (typeof examTypes)[number];

export interface Task {
  id: string;
  subject: Subject;
  title: string;
  estimatedMinutes: number;
  completed: boolean;
}

export interface DailyPlan {
  date: string;
  tasks: Task[];
  aiGenerated: boolean;
  totalMinutes: number;
}

export interface UserProfile {
  examDate: string;
  examType: ExamType;
  weekdayMinutes: number;
  weekendMinutes: number;
  focusSubjects: Subject[];
  phase: 'written';
}

export interface DailyReview {
  date: string;
  completedTaskIds: string[];
  userNote: string;
  aiSummary: string;
  tomorrowSuggestion: string;
}

export interface ProgressSummary {
  daysUntilExam: number;
  streakDays: number;
  subjectCounts: Record<Subject, number>;
}
