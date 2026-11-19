import { useEffect, useState } from 'react';
import type { Provider, Session } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { getSupabase, isSupabaseConfigured, supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type LoginProvider = 'qq' | 'google' | 'outlook';

export type AuthState = {
  session: Session | null;
  isLoading: boolean;
  isSigningIn: boolean;
  error: string | null;
  signIn: (provider: LoginProvider) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

function providerName(provider: LoginProvider): Provider {
  if (provider === 'outlook') return 'azure';
  if (provider === 'qq') {
    return (process.env.EXPO_PUBLIC_QQ_PROVIDER_ID?.trim() ||
      'custom:qq') as Provider;
  }
  return 'google';
}

function sessionFromReturnUrl(url: string) {
  const parsedUrl = new URL(url);
  const params = Object.fromEntries(parsedUrl.searchParams.entries());
  const fragmentParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));

  fragmentParams.forEach((value, key) => {
    params[key] = value;
  });

  if (params.error_code || params.error) {
    throw new Error(
      params.error_description || params.error_code || params.error,
    );
  }

  return params;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!isMounted) return;
        if (sessionError) setError(sessionError.message);
        setSession(data.session);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(provider: LoginProvider) {
    setError(null);
    setIsSigningIn(true);

    try {
      if (!isSupabaseConfigured) {
        throw new Error(
          '登录服务还没有配置。请先填写 .env 中的 Supabase 地址和公开密钥。',
        );
      }

      const client = getSupabase();
      const redirectTo = makeRedirectUri({
        scheme: 'sanfen',
        path: 'auth/callback',
      });
      const { data, error: signInError } = await client.auth.signInWithOAuth({
        provider: providerName(provider),
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (signInError) throw signInError;
      if (!data.url) throw new Error('登录服务没有返回授权地址。');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type !== 'success') {
        return;
      }

      const params = sessionFromReturnUrl(result.url);

      if (params.code) {
        const { error: exchangeError } =
          await client.auth.exchangeCodeForSession(params.code);
        if (exchangeError) throw exchangeError;
        return;
      }

      if (params.access_token && params.refresh_token) {
        const { error: sessionError } = await client.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (sessionError) throw sessionError;
        return;
      }

      throw new Error('登录回调中没有找到会话信息。');
    } catch (signInFailure) {
      const message =
        signInFailure instanceof Error
          ? signInFailure.message
          : '登录失败，请稍后再试。';
      setError(message);
    } finally {
      setIsSigningIn(false);
    }
  }

  async function signOut() {
    setError(null);

    if (!supabase) return;

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
  }

  return {
    session,
    isLoading,
    isSigningIn,
    error,
    signIn,
    signOut,
    clearError: () => setError(null),
  };
}
