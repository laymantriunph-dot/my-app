import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  deleteRemoteFocusSession,
  fetchRemoteFocusSessions,
  insertRemoteFocusSession,
  readFocusCache,
  writeFocusCache,
} from '../lib/activityRepository';
import type { FocusSession } from '../types';

export type FocusSessionState = {
  sessions: FocusSession[];
  isLoading: boolean;
  error: string | null;
  addSession: (session: Omit<FocusSession, 'id'>) => Promise<boolean>;
  removeSessions: (sessions: FocusSession[]) => Promise<boolean>;
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
  return '计时记录没有保存，请稍后再试。';
}

export function useFocusSessions(userId?: string): FocusSessionState {
  const scope = userId ?? 'guest';
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const sessionsRef = useRef<FocusSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const commit = useCallback(
    (producer: (current: FocusSession[]) => FocusSession[]) => {
      setSessions((current) => {
        const next = producer(current);
        sessionsRef.current = next;
        void writeFocusCache(scope, next);
        return next;
      });
    },
    [scope],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const cached = await readFocusCache(scope);
      sessionsRef.current = cached;
      setSessions(cached);

      if (!userId) return;

      let remote = await fetchRemoteFocusSessions(userId);
      const guestSessions = await readFocusCache('guest');

      if (remote.length === 0 && guestSessions.length > 0) {
        for (const session of guestSessions) {
          await insertRemoteFocusSession(userId, {
            mode: session.mode,
            note: session.note,
            plannedSeconds: session.plannedSeconds,
            elapsedSeconds: session.elapsedSeconds,
            startedAt: session.startedAt,
            endedAt: session.endedAt,
          });
        }
        await AsyncStorage.removeItem('@sanfen/focus/guest');
        remote = await fetchRemoteFocusSessions(userId);
      }

      setSessions(remote);
      sessionsRef.current = remote;
      await writeFocusCache(scope, remote);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [scope, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addSession(session: Omit<FocusSession, 'id'>) {
    setError(null);
    const optimistic: FocusSession = {
      ...session,
      id: `local-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    };
    commit((current) => [optimistic, ...current]);

    try {
      if (userId) {
        const saved = await insertRemoteFocusSession(userId, session);
        commit((current) =>
          current.map((item) =>
            item.id === optimistic.id ? saved : item,
          ),
        );
      }
      return true;
    } catch (saveError) {
      commit((current) =>
        current.filter((item) => item.id !== optimistic.id),
      );
      setError(errorMessage(saveError));
      return false;
    }
  }

  async function removeSessions(sessionsToRemove: FocusSession[]) {
    if (sessionsToRemove.length === 0) return false;
    setError(null);
    const ids = new Set(sessionsToRemove.map((session) => session.id));
    const snapshot = sessionsRef.current;
    commit((current) => current.filter((session) => !ids.has(session.id)));

    try {
      if (userId) {
        for (const session of sessionsToRemove) {
          await deleteRemoteFocusSession(userId, session.id);
        }
      }
      return true;
    } catch (removeError) {
      sessionsRef.current = snapshot;
      setSessions(snapshot);
      await writeFocusCache(scope, snapshot);
      setError(errorMessage(removeError));
      return false;
    }
  }

  return {
    sessions,
    isLoading,
    error,
    addSession,
    removeSessions,
    clearError: () => setError(null),
  };
}
