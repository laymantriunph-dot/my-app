import { colors } from './theme';
import {
  TASK_CATEGORIES,
  type Task,
  type TaskCategory,
  type TaskPriority,
  type TaskRow,
} from './types';

export const CATEGORY_META = {
  today: {
    label: '朝计',
    hint: '今天要完成',
    color: colors.today,
    softColor: colors.todaySoft,
    icon: 'sunny-outline' as const,
  },
  longTerm: {
    label: '遐筹',
    hint: '持续推进，不急着今天完成',
    color: colors.longTerm,
    softColor: colors.longTermSoft,
    icon: 'leaf-outline' as const,
  },
  secondary: {
    label: '次重要',
    hint: '有空再做',
    color: colors.secondary,
    softColor: colors.secondarySoft,
    icon: 'bookmark-outline' as const,
  },
} satisfies Record<
  TaskCategory,
  {
    label: string;
    hint: string;
    color: string;
    softColor: string;
    icon: 'sunny-outline' | 'leaf-outline' | 'bookmark-outline';
  }
>;

export const PRIORITY_META = {
  primary: {
    label: '主要',
    hint: '今天最重要的推进',
    color: colors.today,
    softColor: colors.todaySoft,
  },
  secondary: {
    label: '次要',
    hint: '完成主要事项后再处理',
    color: colors.secondary,
    softColor: colors.secondarySoft,
  },
} satisfies Record<
  TaskPriority,
  {
    label: string;
    hint: string;
    color: string;
    softColor: string;
  }
>;

export function isTaskCategory(value: unknown): value is TaskCategory {
  return (
    typeof value === 'string' &&
    (TASK_CATEGORIES as readonly string[]).includes(value)
  );
}

export function taskFromRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    priority: row.priority,
    isCompleted: row.is_completed,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  };
}

export function createLocalTask(
  title: string,
  category: TaskCategory,
  priority: TaskPriority = 'primary',
): Task {
  const now = new Date().toISOString();

  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    title: title.trim(),
    category,
    priority,
    isCompleted: false,
    createdAt: now,
    completedAt: null,
    updatedAt: now,
  };
}

export function normalizeTask(task: Task): Task {
  return {
    ...task,
    category: task.category === 'secondary' ? 'today' : task.category,
    priority:
      task.priority ??
      (task.category === 'secondary' ? 'secondary' : 'primary'),
  };
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((left, right) => {
    if (left.isCompleted !== right.isCompleted) {
      return left.isCompleted ? 1 : -1;
    }

    return (
      new Date(right.createdAt).getTime() -
      new Date(left.createdAt).getTime()
    );
  });
}

export function getTaskStats(tasks: Task[]) {
  const completed = tasks.filter((task) => task.isCompleted).length;
  const total = tasks.length;

  return {
    total,
    completed,
    remaining: total - completed,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function getTodayLabel(date = new Date()): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date);
}

export function getLocalDateKey(value: string | Date = new Date()): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSameLocalDay(
  value: string | Date,
  reference: Date = new Date(),
): boolean {
  return getLocalDateKey(value) === getLocalDateKey(reference);
}

export function getGreeting(date = new Date()): string {
  const hour = date.getHours();

  if (hour < 6) return '夜深了';
  if (hour < 11) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

export function getDisplayName(email: string | undefined): string {
  if (!email) return '我的清单';
  return email.split('@')[0];
}
