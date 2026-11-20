import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import {
  CHIMES,
  DEFAULT_CHIME_ID,
  type ChimeId,
} from '../chimes';

export function useChime(scopeId?: string) {
  const key = `@sanfen/chime/${scopeId ?? 'guest'}`;
  const [chimeId, setChimeIdState] = useState<ChimeId>(DEFAULT_CHIME_ID);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(key).then((value) => {
      if (active && CHIMES.some((chime) => chime.id === value)) {
        setChimeIdState(value as ChimeId);
      }
    });

    return () => {
      active = false;
    };
  }, [key]);

  async function setChimeId(value: ChimeId) {
    setChimeIdState(value);
    await AsyncStorage.setItem(key, value);
  }

  return { chimeId, setChimeId };
}
