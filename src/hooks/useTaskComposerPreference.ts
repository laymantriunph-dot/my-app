import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { ACTIVE_TASK_CATEGORIES, type TaskCategory } from '../types';

export function useTaskComposerPreference(
  scopeId: string | undefined,
  fallback: TaskCategory,
) {
  const key = `@sanfen/composer-category/${scopeId ?? 'guest'}`;
  const [preferredCategory, setPreferredCategoryState] =
    useState<TaskCategory>(fallback);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(key).then((value) => {
      if (
        active &&
        value &&
        (ACTIVE_TASK_CATEGORIES as readonly string[]).includes(value)
      ) {
        setPreferredCategoryState(value as TaskCategory);
      }
    });

    return () => {
      active = false;
    };
  }, [key]);

  async function setPreferredCategory(category: TaskCategory) {
    setPreferredCategoryState(category);
    await AsyncStorage.setItem(key, category);
  }

  return { preferredCategory, setPreferredCategory };
}
