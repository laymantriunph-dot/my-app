import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { normalizeLongTermCategory } from '../taskUtils';

export const DEFAULT_LONG_TERM_CATEGORIES = [
  '备考',
  '锻炼',
  '阅读',
  '创作',
  '生活',
];

export function normalizeCategoryDefaults(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const category = normalizeLongTermCategory(value);
    if (!category) continue;
    const key = category.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(category);
    if (result.length === 8) break;
  }

  return result;
}

export function useLongTermCategoryDefaults(scopeId?: string) {
  const key = `@sanfen/long-term-category-defaults/${scopeId ?? 'guest'}`;
  const [categories, setCategoriesState] = useState<string[]>(
    DEFAULT_LONG_TERM_CATEGORIES,
  );

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(key).then((value) => {
      if (!active || !value) return;

      try {
        const parsed: unknown = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setCategoriesState(
            normalizeCategoryDefaults(
              parsed.filter((item): item is string => typeof item === 'string'),
            ),
          );
        }
      } catch {
        // Keep the built-in suggestions if stored data is invalid.
      }
    });

    return () => {
      active = false;
    };
  }, [key]);

  async function setCategories(nextCategories: string[]) {
    const next = normalizeCategoryDefaults(nextCategories);
    setCategoriesState(next);
    await AsyncStorage.setItem(key, JSON.stringify(next));
  }

  return { categories, setCategories };
}
