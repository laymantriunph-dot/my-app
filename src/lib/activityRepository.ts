import AsyncStorage from '@react-native-async-storage/async-storage';

import { getSupabase } from './supabase';
import { normalizeTask } from '../taskUtils';
import type {
  FocusSession,
  FocusSessionRow,
  TaskArchive,
  TaskArchiveRow,
} from '../types';

const ARCHIVE_PREFIX = '@sanfen/archives';
const FOCUS_PREFIX = '@sanfen/focus';

export type TaskArchiveDraft = Omit<TaskArchive, 'id' | 'archivedAt'>;

function storageKey(prefix: string, scope: string) {
  return `${prefix}/${scope}`;
}

function readArray<T>(raw: string | null): T[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function archiveFromRow(row: TaskArchiveRow): TaskArchive {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    kind: row.record_type,
    recordDate: row.record_date,
    tasks: row.tasks.map(normalizeTask),
    taskCount: row.task_count,
    completedCount: row.completed_count,
    archivedAt: row.archived_at,
  };
}

function focusSessionFromRow(row: FocusSessionRow): FocusSession {
  return {
    id: row.id,
    mode: row.mode,
    note: row.note,
    plannedSeconds: row.planned_seconds,
    elapsedSeconds: row.elapsed_seconds,
    startedAt: row.started_at,
    endedAt: row.ended_at,
  };
}

export async function readArchiveCache(scope: string): Promise<TaskArchive[]> {
  const raw = await AsyncStorage.getItem(storageKey(ARCHIVE_PREFIX, scope));
  return readArray<TaskArchive>(raw).map((archive) => ({
    ...archive,
    tasks: archive.tasks.map(normalizeTask),
  }));
}

export async function writeArchiveCache(
  scope: string,
  archives: TaskArchive[],
) {
  await AsyncStorage.setItem(
    storageKey(ARCHIVE_PREFIX, scope),
    JSON.stringify(archives),
  );
}

export async function fetchRemoteArchives(
  userId: string,
): Promise<TaskArchive[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('task_archives')
    .select(
      'id,user_id,title,category,record_type,record_date,tasks,task_count,completed_count,archived_at',
    )
    .eq('user_id', userId)
    .order('archived_at', { ascending: false });

  if (error) throw error;
  return ((data ?? []) as TaskArchiveRow[]).map(archiveFromRow);
}

export async function insertRemoteArchive(
  userId: string,
  archive: TaskArchiveDraft,
): Promise<TaskArchive> {
  const client = getSupabase();
  const { data, error } = await client
    .from('task_archives')
    .insert({
      user_id: userId,
      title: archive.title,
      category: archive.category,
      record_type: archive.kind,
      record_date: archive.recordDate,
      tasks: archive.tasks,
      task_count: archive.taskCount,
      completed_count: archive.completedCount,
    })
    .select(
      'id,user_id,title,category,record_type,record_date,tasks,task_count,completed_count,archived_at',
    )
    .single();

  if (error) throw error;
  return archiveFromRow(data as TaskArchiveRow);
}

export async function updateRemoteArchive(
  userId: string,
  archive: TaskArchive,
): Promise<TaskArchive> {
  const client = getSupabase();
  const { data, error } = await client
    .from('task_archives')
    .update({
      title: archive.title,
      category: archive.category,
      record_type: archive.kind,
      record_date: archive.recordDate,
      tasks: archive.tasks,
      task_count: archive.taskCount,
      completed_count: archive.completedCount,
    })
    .eq('id', archive.id)
    .eq('user_id', userId)
    .select(
      'id,user_id,title,category,record_type,record_date,tasks,task_count,completed_count,archived_at',
    )
    .single();

  if (error) throw error;
  return archiveFromRow(data as TaskArchiveRow);
}

export async function deleteRemoteArchive(
  userId: string,
  archiveId: string,
) {
  const client = getSupabase();
  const { error } = await client
    .from('task_archives')
    .delete()
    .eq('id', archiveId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function readFocusCache(scope: string): Promise<FocusSession[]> {
  const raw = await AsyncStorage.getItem(storageKey(FOCUS_PREFIX, scope));
  return readArray<FocusSession>(raw);
}

export async function writeFocusCache(
  scope: string,
  sessions: FocusSession[],
) {
  await AsyncStorage.setItem(
    storageKey(FOCUS_PREFIX, scope),
    JSON.stringify(sessions),
  );
}

export async function fetchRemoteFocusSessions(
  userId: string,
): Promise<FocusSession[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('focus_sessions')
    .select(
      'id,user_id,mode,note,planned_seconds,elapsed_seconds,started_at,ended_at,created_at',
    )
    .eq('user_id', userId)
    .order('ended_at', { ascending: false });

  if (error) throw error;
  return ((data ?? []) as FocusSessionRow[]).map(focusSessionFromRow);
}

export async function insertRemoteFocusSession(
  userId: string,
  session: Omit<FocusSession, 'id'>,
): Promise<FocusSession> {
  const client = getSupabase();
  const { data, error } = await client
    .from('focus_sessions')
    .insert({
      user_id: userId,
      mode: session.mode,
      note: session.note,
      planned_seconds: session.plannedSeconds,
      elapsed_seconds: session.elapsedSeconds,
      started_at: session.startedAt,
      ended_at: session.endedAt,
    })
    .select(
      'id,user_id,mode,note,planned_seconds,elapsed_seconds,started_at,ended_at,created_at',
    )
    .single();

  if (error) throw error;
  return focusSessionFromRow(data as FocusSessionRow);
}

export async function deleteRemoteFocusSession(
  userId: string,
  sessionId: string,
) {
  const client = getSupabase();
  const { error } = await client
    .from('focus_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) throw error;
}
