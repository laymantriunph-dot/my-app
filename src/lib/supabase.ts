import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
  '';

export const isSupabaseConfigured =
  /^https?:\/\//.test(supabaseUrl) &&
  supabaseKey.length > 0 &&
  !supabaseUrl.includes('YOUR_PROJECT') &&
  !supabaseKey.includes('YOUR_');

const CHUNK_SIZE = 1800;

function segmentKey(key: string, index: number) {
  return `${key}.segment-${index}`;
}

const secureStoreAdapter = {
  async getItem(key: string) {
    const manifest = await SecureStore.getItemAsync(`${key}.manifest`);

    if (!manifest) {
      return SecureStore.getItemAsync(key);
    }

    const { count } = JSON.parse(manifest) as { count: number };
    const segments: string[] = [];

    for (let index = 0; index < count; index += 1) {
      const segment = await SecureStore.getItemAsync(segmentKey(key, index));

      if (segment === null) {
        return null;
      }

      segments.push(segment);
    }

    return segments.join('');
  },
  async setItem(key: string, value: string) {
    const previousManifest = await SecureStore.getItemAsync(`${key}.manifest`);

    if (previousManifest) {
      const { count } = JSON.parse(previousManifest) as { count: number };

      for (let index = 0; index < count; index += 1) {
        await SecureStore.deleteItemAsync(segmentKey(key, index));
      }
    }

    const segments: string[] = [];

    for (let index = 0; index < value.length; index += CHUNK_SIZE) {
      segments.push(value.slice(index, index + CHUNK_SIZE));
    }

    for (let index = 0; index < segments.length; index += 1) {
      await SecureStore.setItemAsync(segmentKey(key, index), segments[index]);
    }

    await SecureStore.setItemAsync(
      `${key}.manifest`,
      JSON.stringify({ count: segments.length }),
    );
  },
  async removeItem(key: string) {
    const manifest = await SecureStore.getItemAsync(`${key}.manifest`);

    if (manifest) {
      const { count } = JSON.parse(manifest) as { count: number };

      for (let index = 0; index < count; index += 1) {
        await SecureStore.deleteItemAsync(segmentKey(key, index));
      }
    }

    await Promise.all([
      SecureStore.deleteItemAsync(`${key}.manifest`),
      SecureStore.deleteItemAsync(key),
    ]);
  },
};

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: Platform.OS === 'web' ? AsyncStorage : secureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    })
  : null;

if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      '尚未配置 Supabase。请参考 README 创建 .env 文件并填写项目地址和公开密钥。',
    );
  }

  return supabase;
}

export type AuthUser = User;
