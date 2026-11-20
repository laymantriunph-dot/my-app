export const CHIMES = [
  {
    id: 'zen-bowl',
    label: 'Zen Bowl',
    hint: '静心钵 · 温暖而克制',
    source: require('../assets/sounds/zen-bowl.wav'),
  },
  {
    id: 'morning-bell',
    label: 'Morning Bell',
    hint: '晨钟 · 清亮、清醒',
    source: require('../assets/sounds/morning-bell.wav'),
  },
  {
    id: 'air-chime',
    label: 'Air Chime',
    hint: '风铃 · 轻盈不刺耳',
    source: require('../assets/sounds/air-chime.wav'),
  },
  {
    id: 'wooden-fish',
    label: 'Wooden Fish',
    hint: '木鱼 · 短促、沉稳',
    source: require('../assets/sounds/wooden-fish.wav'),
  },
  {
    id: 'water-drop',
    label: 'Water Drop',
    hint: '水滴 · 干净、轻巧',
    source: require('../assets/sounds/water-drop.wav'),
  },
  {
    id: 'deep-gong',
    label: 'Deep Gong',
    hint: '深空 · 低频、有余韵',
    source: require('../assets/sounds/deep-gong.wav'),
  },
  {
    id: 'two-note-rise',
    label: 'Two-Note Rise',
    hint: '双音升 · 暗示完成',
    source: require('../assets/sounds/two-note-rise.wav'),
  },
  {
    id: 'crystal-echo',
    label: 'Crystal Echo',
    hint: '水晶 · 明亮、带回声',
    source: require('../assets/sounds/crystal-echo.wav'),
  },
  {
    id: 'quiet-harp',
    label: 'Quiet Harp',
    hint: '轻弦 · 柔和、温润',
    source: require('../assets/sounds/quiet-harp.wav'),
  },
  {
    id: 'focus-bell',
    label: 'Focus Bell',
    hint: '专注铃 · 简洁、稳定',
    source: require('../assets/sounds/focus-bell.wav'),
  },
] as const;

export type ChimeId = (typeof CHIMES)[number]['id'];

export const DEFAULT_CHIME_ID: ChimeId = 'morning-bell';

export function getChime(id: ChimeId) {
  return CHIMES.find((chime) => chime.id === id) ?? CHIMES[1];
}
