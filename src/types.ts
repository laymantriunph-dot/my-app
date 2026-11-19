import type { AuthUser } from './lib/supabase';

export const TASK_CATEGORIES = ['today', 'longTerm', 'secondary'] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export type Task = {
  id: string;
  title: string;
  category: TaskCategory;
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
  is_completed: boolean;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
};

export type AuthProfile = {
  user: AuthUser | null;
  isLocal: boolean;
};
