export const colors = {
  canvas: '#F6F1E8',
  surface: '#FFFCF6',
  surfaceMuted: '#EEE8DD',
  ink: '#1F2A24',
  inkSoft: '#667068',
  inkFaint: '#969C96',
  line: '#E4DDD1',
  accent: '#E7643B',
  accentSoft: '#FBE5D9',
  today: '#E7643B',
  todaySoft: '#FBE5D9',
  longTerm: '#397B68',
  longTermSoft: '#DDECE6',
  secondary: '#8C6A3D',
  secondarySoft: '#EFE4D1',
  white: '#FFFFFF',
  danger: '#B84435',
  success: '#397B68',
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#4A3726',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
} as const;
