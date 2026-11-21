export const colors = {
  canvas: '#F3F5F1',
  surface: '#FEFEFC',
  surfaceMuted: '#ECEFEB',
  ink: '#24312A',
  inkSoft: '#65716A',
  inkFaint: '#98A19B',
  line: '#DDE2DC',
  accent: '#A95E46',
  accentSoft: '#F3E7E1',
  today: '#A95E46',
  todaySoft: '#F4E9E3',
  longTerm: '#466B5C',
  longTermSoft: '#E6EFEA',
  secondary: '#7A6B55',
  secondarySoft: '#F1ECE4',
  white: '#FFFFFF',
  danger: '#A5483E',
  success: '#466B5C',
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#29392F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.055,
    shadowRadius: 18,
    elevation: 2,
  },
} as const;
