import type { AuthUser } from './lib/supabase';

export const TASK_CATEGORIES = ['today', 'longTerm', 'secondary'] as const;
export const ACTIVE_TASK_CATEGORIES = ['today', 'longTerm'] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];
export type ActiveTaskCategory = (typeof ACTIVE_TASK_CATEGORIES)[number];
export type TaskPriority = 'primary' | 'secondary';

export type Task = {
  id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  scheduledDate: string;
  isCompleted: boolean;
  createdAt: string;
  completedAt: string | null;
  updatedAt: string;
};

export type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  scheduled_date: string;
  is_completed: boolean;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
};

export type TaskArchive = {
  id: string;
  title: string;
  category: TaskCategory;
  kind: 'manual' | 'completed';
  recordDate: string;
  tasks: Task[];
  taskCount: number;
  completedCount: number;
  archivedAt: string;
};

export type TaskArchiveRow = {
  id: string;
  user_id: string;
  title: string;
  category: TaskCategory;
  record_type: 'manual' | 'completed';
  record_date: string;
  tasks: Task[];
  task_count: number;
  completed_count: number;
  archived_at: string;
};

export type TimerMode = 'countdown' | 'stopwatch';

export type FocusSession = {
  id: string;
  mode: TimerMode;
  note: string;
  plannedSeconds: number;
  elapsedSeconds: number;
  startedAt: string;
  endedAt: string;
};

export type FocusSessionRow = {
  id: string;
  user_id: string;
  mode: TimerMode;
  note: string;
  planned_seconds: number;
  elapsed_seconds: number;
  started_at: string;
  ended_at: string;
  created_at: string;
};

export type AuthProfile = {
  user: AuthUser | null;
  isLocal: boolean;
};
