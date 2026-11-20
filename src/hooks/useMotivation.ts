import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const DEFAULT_MOTIVATION = 'Come on!';

export function useMotivation(scopeId?: string) {
  const key = `@sanfen/motivation/${scopeId ?? 'guest'}`;
  const [motivation, setMotivationState] = useState(DEFAULT_MOTIVATION);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(key)
      .then((value) => {
        if (active && value?.trim()) {
          setMotivationState(value.trim());
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [key]);

  const setMotivation = useCallback(
    async (value: string) => {
      const nextValue = value.trim() || DEFAULT_MOTIVATION;
      setMotivationState(nextValue);
      await AsyncStorage.setItem(key, nextValue);
    },
    [key],
  );

  return {
    motivation,
    defaultMotivation: DEFAULT_MOTIVATION,
    isLoading,
    setMotivation,
  };
}
