import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'title' | 'subtitle' | 'body' | 'caption' | 'label';
type Tone = 'default' | 'muted' | 'primary' | 'danger' | 'success' | 'inverse';

export interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  bold?: boolean;
  center?: boolean;
}

export function AppText({
  variant = 'body',
  tone = 'default',
  bold,
  center,
  style,
  ...rest
}: Readonly<AppTextProps>) {
  const { colors, font } = useTheme();

  const variants: Record<Variant, TextStyle> = {
    title: { fontSize: font.size.xl, fontWeight: font.weight.bold },
    subtitle: { fontSize: font.size.lg, fontWeight: font.weight.semibold },
    body: { fontSize: font.size.md },
    caption: { fontSize: font.size.sm },
    label: { fontSize: font.size.sm, fontWeight: font.weight.medium },
  };
  const tones: Record<Tone, string> = {
    default: colors.text,
    muted: colors.textMuted,
    primary: colors.primary,
    danger: colors.danger,
    success: colors.success,
    inverse: colors.primaryContrast,
  };

  return (
    <Text
      {...rest}
      style={[
        variants[variant],
        { color: tones[tone] },
        bold && { fontWeight: font.weight.bold },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}
