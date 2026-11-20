import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import {
  deleteRemoteArchive,
  fetchRemoteArchives,
  insertRemoteArchive,
  readArchiveCache,
  writeArchiveCache,
  type TaskArchiveDraft,
} from '../lib/activityRepository';
import { getTodayLabel, CATEGORY_META } from '../taskUtils';
import type { Task, TaskArchive, TaskCategory } from '../types';

export type ArchiveState = {
  archives: TaskArchive[];
  isLoading: boolean;
  error: string | null;
  saveArchive: (
    category: TaskCategory,
    tasks: Task[],
  ) => Promise<boolean>;
  removeArchive: (archive: TaskArchive) => Promise<boolean>;
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
  return '存档没有完成，请稍后再试。';
}

export function useArchives(userId?: string): ArchiveState {
  const scope = userId ?? 'guest';
  const [archives, setArchives] = useState<TaskArchive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const commit = useCallback(
    (producer: (current: TaskArchive[]) => TaskArchive[]) => {
      setArchives((current) => {
        const next = producer(current);
        void writeArchiveCache(scope, next);
        return next;
      });
    },
    [scope],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const cached = await readArchiveCache(scope);
      setArchives(cached);

      if (!userId) return;

      let remote = await fetchRemoteArchives(userId);
      const guestArchives = await readArchiveCache('guest');

      if (remote.length === 0 && guestArchives.length > 0) {
        for (const archive of guestArchives) {
          await insertRemoteArchive(userId, {
            title: archive.title,
            category: archive.category,
            tasks: archive.tasks,
            taskCount: archive.taskCount,
            completedCount: archive.completedCount,
          });
        }
        await AsyncStorage.removeItem('@sanfen/archives/guest');
        remote = await fetchRemoteArchives(userId);
      }

      setArchives(remote);
      await writeArchiveCache(scope, remote);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [scope, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveArchive(category: TaskCategory, tasks: Task[]) {
    if (tasks.length === 0) return false;

    setError(null);
    const draft: TaskArchiveDraft = {
      title: `${CATEGORY_META[category].label} · ${getTodayLabel()}`,
      category,
      tasks: tasks.map((task) => ({ ...task })),
      taskCount: tasks.length,
      completedCount: tasks.filter((task) => task.isCompleted).length,
    };
    const now = new Date().toISOString();
    const optimistic: TaskArchive = {
      ...draft,
      id: `local-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      archivedAt: now,
    };
    commit((current) => [optimistic, ...current]);

    try {
      if (userId) {
        const saved = await insertRemoteArchive(userId, draft);
        commit((current) =>
          current.map((archive) =>
            archive.id === optimistic.id ? saved : archive,
          ),
        );
      }
      return true;
    } catch (saveError) {
      commit((current) =>
        current.filter((archive) => archive.id !== optimistic.id),
      );
      setError(errorMessage(saveError));
      return false;
    }
  }

  async function removeArchive(archive: TaskArchive) {
    setError(null);
    commit((current) =>
      current.filter((item) => item.id !== archive.id),
    );

    try {
      if (userId) {
        await deleteRemoteArchive(userId, archive.id);
      }
      return true;
    } catch (removeError) {
      commit((current) => [archive, ...current]);
      setError(errorMessage(removeError));
      return false;
    }
  }

  return {
    archives,
    isLoading,
    error,
    saveArchive,
    removeArchive,
    clearError: () => setError(null),
  };
}
