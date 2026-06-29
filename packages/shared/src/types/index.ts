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

/** 某一天的计划与复盘快照，用于历史记录页 */
export interface HistoryDay {
  date: string;
  plan: DailyPlan | null;
  review: DailyReview | null;
}
