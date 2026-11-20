import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  deleteRemoteArchive,
  fetchRemoteArchives,
  insertRemoteArchive,
  readArchiveCache,
  updateRemoteArchive,
  writeArchiveCache,
} from '../lib/activityRepository';
import {
  CATEGORY_META,
  getLocalDateKey,
  getTodayLabel,
} from '../taskUtils';
import type { Task, TaskArchive } from '../types';

export type ArchiveState = {
  archives: TaskArchive[];
  isLoading: boolean;
  error: string | null;
  recordCompletedTask: (
    task: Task,
    completedAt: string,
  ) => Promise<boolean>;
  unrecordCompletedTask: (
    task: Task,
    completedAt: string,
  ) => Promise<boolean>;
  removeArchives: (archives: TaskArchive[]) => Promise<boolean>;
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
  const archivesRef = useRef<TaskArchive[]>([]);
  const completionLocks = useRef(new Set<string>());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const commit = useCallback(
    (producer: (current: TaskArchive[]) => TaskArchive[]) => {
      setArchives((current) => {
        const next = producer(current);
        archivesRef.current = next;
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
      archivesRef.current = cached;
      setArchives(cached);

      if (!userId) return;

      let remote = await fetchRemoteArchives(userId);
      const guestArchives = await readArchiveCache('guest');

      if (remote.length === 0 && guestArchives.length > 0) {
        for (const archive of guestArchives) {
          await insertRemoteArchive(userId, {
            title: archive.title,
            category: archive.category,
            kind: archive.kind ?? 'manual',
            recordDate: archive.recordDate ?? getLocalDateKey(),
            tasks: archive.tasks,
            taskCount: archive.taskCount,
            completedCount: archive.completedCount,
          });
        }
        await AsyncStorage.removeItem('@sanfen/archives/guest');
        remote = await fetchRemoteArchives(userId);
      }

      setArchives(remote);
      archivesRef.current = remote;
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

  async function recordCompletedTask(task: Task, completedAt: string) {
    setError(null);
    const snapshot = archivesRef.current;
    const recordDate = getLocalDateKey(completedAt);
    const lockKey = `record:${task.id}:${recordDate}`;
    if (completionLocks.current.has(lockKey)) return true;
    completionLocks.current.add(lockKey);
    const existing = archivesRef.current.find(
      (archive) =>
        archive.kind === 'completed' &&
        archive.category === task.category &&
        archive.recordDate === recordDate,
    );
    const completedTask: Task = {
      ...task,
      isCompleted: true,
      completedAt,
    };
    const now = new Date().toISOString();
    let optimistic: TaskArchive;

    if (existing) {
      const nextTasks = [
        completedTask,
        ...existing.tasks.filter((item) => item.id !== task.id),
      ];
      optimistic = {
        ...existing,
        tasks: nextTasks,
        taskCount: nextTasks.length,
        completedCount: nextTasks.length,
      };
      commit((current) =>
        current.map((archive) =>
          archive.id === existing.id ? optimistic : archive,
        ),
      );
    } else {
      optimistic = {
        id: `local-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        title: `${CATEGORY_META[task.category].label} · ${getTodayLabel(
          new Date(completedAt),
        )}`,
        category: task.category,
        kind: 'completed',
        recordDate,
        tasks: [completedTask],
        taskCount: 1,
        completedCount: 1,
        archivedAt: now,
      };
      commit((current) => [optimistic, ...current]);
    }

    try {
      if (userId) {
        const saved = existing
          ? await updateRemoteArchive(userId, optimistic)
          : await insertRemoteArchive(userId, optimistic);
        commit((current) =>
          current.map((archive) =>
            archive.id === optimistic.id ? saved : archive,
          ),
        );
      }
      return true;
    } catch (saveError) {
      setArchives(snapshot);
      archivesRef.current = snapshot;
      await writeArchiveCache(scope, snapshot);
      setError(errorMessage(saveError));
      return false;
    } finally {
      completionLocks.current.delete(lockKey);
    }
  }

  async function unrecordCompletedTask(task: Task, completedAt: string) {
    setError(null);
    const snapshot = archivesRef.current;
    const recordDate = getLocalDateKey(completedAt);
    const lockKey = `unrecord:${task.id}:${recordDate}`;
    if (completionLocks.current.has(lockKey)) return true;
    completionLocks.current.add(lockKey);
    const existing = archivesRef.current.find(
      (archive) =>
        archive.tasks.some((item) => item.id === task.id) &&
        (archive.kind !== 'completed' ||
          (archive.category === task.category &&
            archive.recordDate === recordDate)),
    );
    if (!existing) {
      completionLocks.current.delete(lockKey);
      return true;
    }

    const remainingTasks = existing.tasks.filter((item) => item.id !== task.id);
    const shouldDelete = remainingTasks.length === 0;
    const nextArchive: TaskArchive = {
      ...existing,
      tasks: remainingTasks,
      taskCount: remainingTasks.length,
      completedCount: remainingTasks.length,
    };
    commit((current) =>
      shouldDelete
        ? current.filter((archive) => archive.id !== existing.id)
        : current.map((archive) =>
            archive.id === existing.id ? nextArchive : archive,
          ),
    );

    try {
      if (userId) {
        if (shouldDelete) {
          await deleteRemoteArchive(userId, existing.id);
        } else {
          await updateRemoteArchive(userId, nextArchive);
        }
      }
      return true;
    } catch (updateError) {
      setArchives(snapshot);
      archivesRef.current = snapshot;
      await writeArchiveCache(scope, snapshot);
      setError(errorMessage(updateError));
      return false;
    } finally {
      completionLocks.current.delete(lockKey);
    }
  }

  async function removeArchives(archivesToRemove: TaskArchive[]) {
    if (archivesToRemove.length === 0) return false;
    setError(null);
    const ids = new Set(archivesToRemove.map((archive) => archive.id));
    const snapshot = archivesRef.current;
    commit((current) => current.filter((archive) => !ids.has(archive.id)));

    try {
      if (userId) {
        for (const archive of archivesToRemove) {
          await deleteRemoteArchive(userId, archive.id);
        }
      }
      return true;
    } catch (removeError) {
      setArchives(snapshot);
      archivesRef.current = snapshot;
      await writeArchiveCache(scope, snapshot);
      setError(errorMessage(removeError));
      return false;
    }
  }

  return {
    archives,
    isLoading,
    error,
    recordCompletedTask,
    unrecordCompletedTask,
    removeArchives,
    clearError: () => setError(null),
  };
}
