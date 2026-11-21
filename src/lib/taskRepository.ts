import AsyncStorage from '@react-native-async-storage/async-storage';

import { getSupabase } from './supabase';
import { normalizeTask, taskFromRow } from '../taskUtils';
import type {
  Task,
  TaskCategory,
  TaskPriority,
  TaskRow,
} from '../types';

const CACHE_PREFIX = '@sanfen/tasks';

function cacheKey(scope: string) {
  return `${CACHE_PREFIX}/${scope}`;
}

function isTaskArray(value: unknown): value is Task[] {
  return Array.isArray(value);
}

export async function readTaskCache(scope: string): Promise<Task[]> {
  const raw = await AsyncStorage.getItem(cacheKey(scope));

  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return isTaskArray(parsed) ? parsed.map(normalizeTask) : [];
  } catch {
    return [];
  }
}

export async function writeTaskCache(scope: string, tasks: Task[]) {
  await AsyncStorage.setItem(cacheKey(scope), JSON.stringify(tasks));
}

export async function fetchRemoteTasks(userId: string): Promise<Task[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('tasks')
    .select(
      'id,user_id,title,category,priority,scheduled_date,is_completed,created_at,completed_at,updated_at',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data ?? []) as TaskRow[]).map(taskFromRow);
}

export async function migrateGuestTasks(userId: string): Promise<Task[]> {
  const guestTasks = await readTaskCache('guest');

  if (guestTasks.length === 0) {
    return fetchRemoteTasks(userId);
  }

  const client = getSupabase();
  const rows = guestTasks.map((task) => ({
    user_id: userId,
    title: task.title,
    category: task.category,
    priority: task.priority,
    scheduled_date: task.scheduledDate,
    is_completed: task.isCompleted,
    created_at: task.createdAt,
    completed_at: task.completedAt,
    updated_at: task.updatedAt,
  }));

  const { error } = await client.from('tasks').insert(rows);

  if (error) throw error;

  await AsyncStorage.removeItem(cacheKey('guest'));
  return fetchRemoteTasks(userId);
}

export async function insertRemoteTask(
  userId: string,
  title: string,
  category: TaskCategory,
  priority: TaskPriority,
  scheduledDate: string,
): Promise<Task> {
  const client = getSupabase();
  const { data, error } = await client
    .from('tasks')
    .insert({
      user_id: userId,
      title,
      category,
      priority,
      scheduled_date: scheduledDate,
    })
    .select(
      'id,user_id,title,category,priority,scheduled_date,is_completed,created_at,completed_at,updated_at',
    )
    .single();

  if (error) throw error;
  return taskFromRow(data as TaskRow);
}

export async function updateRemoteTask(
  userId: string,
  task: Task,
): Promise<Task> {
  const client = getSupabase();
  const { data, error } = await client
    .from('tasks')
    .update({
      title: task.title,
      category: task.category,
      priority: task.priority,
      scheduled_date: task.scheduledDate,
      is_completed: task.isCompleted,
      completed_at: task.completedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', task.id)
    .eq('user_id', userId)
    .select(
      'id,user_id,title,category,priority,scheduled_date,is_completed,created_at,completed_at,updated_at',
    )
    .single();

  if (error) throw error;
  return taskFromRow(data as TaskRow);
}

export async function deleteRemoteTask(userId: string, taskId: string) {
  const client = getSupabase();
  const { error } = await client
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);

  if (error) throw error;
}
