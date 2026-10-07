/**
 * Design tokens. Toda cor usada nas telas vem daqui, para o tema claro e o
 * escuro funcionarem sem condicionais espalhadas pelos componentes.
 */
export interface ThemeColors {
  primary: string;
  primaryContrast: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  overlay: string;
}

export interface AppTheme {
  dark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  font: typeof font;
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 6, md: 10, lg: 16, pill: 999 } as const;
export const font = {
  size: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28 },
  weight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
} as const;

const lightColors: ThemeColors = {
  primary: '#C8102E',
  primaryContrast: '#FFFFFF',
  background: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF0F3',
  text: '#15181E',
  textMuted: '#5B6270',
  border: '#DADDE3',
  success: '#1E8E3E',
  warning: '#B26A00',
  danger: '#C62828',
  info: '#1565C0',
  overlay: 'rgba(0,0,0,0.4)',
};

const darkColors: ThemeColors = {
  primary: '#FF4D5E',
  primaryContrast: '#FFFFFF',
  background: '#0F1115',
  surface: '#181B21',
  surfaceAlt: '#22262E',
  text: '#F1F3F6',
  textMuted: '#A3AAB8',
  border: '#2E333D',
  success: '#5BCB7A',
  warning: '#F2B25C',
  danger: '#FF6B6B',
  info: '#6AA8FF',
  overlay: 'rgba(0,0,0,0.6)',
};

export const lightTheme: AppTheme = { dark: false, colors: lightColors, spacing, radius, font };
export const darkTheme: AppTheme = { dark: true, colors: darkColors, spacing, radius, font };
