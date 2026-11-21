import { useCallback, useEffect, useState } from 'react';

import {
  deleteRemoteTask,
  fetchRemoteTasks,
  insertRemoteTask,
  migrateGuestTasks,
  readTaskCache,
  updateRemoteTask,
  writeTaskCache,
} from '../lib/taskRepository';
import {
  createLocalTask,
  normalizeLongTermCategory,
} from '../taskUtils';
import type { Task, TaskCategory, TaskPriority } from '../types';

export type TaskState = {
  tasks: Task[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  addTask: (
    title: string,
    category: TaskCategory,
    priority: TaskPriority,
    scheduledDate: string,
    customCategory: string | null,
  ) => Promise<boolean>;
  toggleTask: (task: Task) => Promise<boolean>;
  removeTask: (task: Task) => Promise<boolean>;
  updateTaskCategory: (
    task: Task,
    customCategory: string | null,
  ) => Promise<boolean>;
  refresh: () => Promise<void>;
  clearError: () => void;
};

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return '操作没有完成，请稍后再试。';
}

export function useTasks(userId?: string): TaskState {
  const scope = userId ?? 'guest';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commit = useCallback(
    (producer: (current: Task[]) => Task[]) => {
      setTasks((current) => {
        const next = producer(current);
        void writeTaskCache(scope, next);
        return next;
      });
    },
    [scope],
  );

  const load = useCallback(
    async (showLoader = true) => {
      if (showLoader) setIsLoading(true);
      setError(null);

      try {
        const cached = await readTaskCache(scope);
        setTasks(cached);

        if (!userId) return;

        let remote = await fetchRemoteTasks(userId);
        const guestTasks = await readTaskCache('guest');

        if (remote.length === 0 && guestTasks.length > 0) {
          remote = await migrateGuestTasks(userId);
        }

        setTasks(remote);
        await writeTaskCache(scope, remote);
      } catch (loadError) {
        setError(errorMessage(loadError));
      } finally {
        if (showLoader) setIsLoading(false);
      }
    },
    [scope, userId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function addTask(
    title: string,
    category: TaskCategory,
    priority: TaskPriority,
    scheduledDate: string,
    customCategory: string | null,
  ) {
    const cleanTitle = title.trim();

    if (!cleanTitle) return false;

    setError(null);
    setIsMutating(true);
    const optimisticTask = createLocalTask(
      cleanTitle,
      category,
      priority,
      scheduledDate,
      customCategory,
    );
    commit((current) => [optimisticTask, ...current]);

    try {
      if (userId) {
        const savedTask = await insertRemoteTask(
          userId,
          cleanTitle,
          category,
          priority,
          scheduledDate,
          customCategory,
        );
        commit((current) =>
          current.map((task) =>
            task.id === optimisticTask.id ? savedTask : task,
          ),
        );
      }

      return true;
    } catch (mutationError) {
      commit((current) =>
        current.filter((task) => task.id !== optimisticTask.id),
      );
      setError(errorMessage(mutationError));
      return false;
    } finally {
      setIsMutating(false);
    }
  }

  async function toggleTask(task: Task) {
    setError(null);
    setIsMutating(true);
    const now = new Date().toISOString();
    const nextTask: Task = {
      ...task,
      isCompleted: !task.isCompleted,
      completedAt: task.isCompleted ? null : now,
      updatedAt: now,
    };
    commit((current) =>
      current.map((item) => (item.id === task.id ? nextTask : item)),
    );

    try {
      if (userId) {
        const savedTask = await updateRemoteTask(userId, nextTask);
        commit((current) =>
          current.map((item) => (item.id === task.id ? savedTask : item)),
        );
      }

      return true;
    } catch (mutationError) {
      commit((current) =>
        current.map((item) => (item.id === task.id ? task : item)),
      );
      setError(errorMessage(mutationError));
      return false;
    } finally {
      setIsMutating(false);
    }
  }

  async function updateTaskCategory(
    task: Task,
    customCategory: string | null,
  ) {
    if (task.category !== 'longTerm') return false;

    setError(null);
    setIsMutating(true);
    const nextTask: Task = {
      ...task,
      customCategory: normalizeLongTermCategory(customCategory),
      updatedAt: new Date().toISOString(),
    };
    commit((current) =>
      current.map((item) => (item.id === task.id ? nextTask : item)),
    );

    try {
      if (userId) {
        const savedTask = await updateRemoteTask(userId, nextTask);
        commit((current) =>
          current.map((item) =>
            item.id === task.id ? savedTask : item,
          ),
        );
      }
      return true;
    } catch (mutationError) {
      commit((current) =>
        current.map((item) => (item.id === task.id ? task : item)),
      );
      setError(errorMessage(mutationError));
      return false;
    } finally {
      setIsMutating(false);
    }
  }

  async function removeTask(task: Task) {
    setError(null);
    setIsMutating(true);
    commit((current) => current.filter((item) => item.id !== task.id));

    try {
      if (userId) {
        await deleteRemoteTask(userId, task.id);
      }

      return true;
    } catch (mutationError) {
      commit((current) => [task, ...current]);
      setError(errorMessage(mutationError));
      return false;
    } finally {
      setIsMutating(false);
    }
  }

  return {
    tasks,
    isLoading,
    isMutating,
    error,
    addTask,
    toggleTask,
    removeTask,
    updateTaskCategory,
    refresh: () => load(false),
    clearError: () => setError(null),
  };
}
