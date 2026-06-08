// Tıbb-ul Furkan - Tema renkleri ve tipografi tokenları
export const colors = {
  bgPrimary: '#F9F6F0',
  bgSecondary: '#EBE5D9',
  bgCard: '#FFFFFF',
  textPrimary: '#2C3531',
  textSecondary: '#5C6B64',
  accentSage: '#89A894',
  maternalPrimary: '#C87971',
  maternalLight: '#F2D5D1',
  paternalPrimary: '#4F6D7A',
  paternalLight: '#D0DEE5',
  borderSubtle: '#DCD5C6',
  errorVow: '#A94438',
  selfPrimary: '#2C3531',
  selfLight: '#E5E0D6',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  round: 9999,
} as const;

export const fonts = {
  heading: 'CormorantGaramond_600SemiBold',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemi: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
} as const;

export const typography = {
  h1: { fontFamily: fonts.heading, fontSize: 36, letterSpacing: -0.5, color: colors.textPrimary },
  h2: { fontFamily: fonts.heading, fontSize: 28, letterSpacing: -0.4, color: colors.textPrimary },
  h3: { fontFamily: fonts.heading, fontSize: 22, color: colors.textPrimary },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.textPrimary },
  bodySm: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  label: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 1 },
} as const;
