import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { MAX_ITEM_QUANTITY } from '@/config/constants';
import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  label?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  label = 'Quantidade',
}: Readonly<Props>) {
  const { colors, radius } = useTheme();

  const button = (icon: 'remove' | 'add', next: number, disabled: boolean, a11y: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      disabled={disabled}
      onPress={() => onChange(next)}
      hitSlop={8}
      style={[styles.button, { opacity: disabled ? 0.4 : 1 }]}
    >
      <Ionicons name={icon} size={18} color={colors.primary} />
    </Pressable>
  );

  return (
    <View
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.row, { borderColor: colors.border, borderRadius: radius.pill }]}
    >
      {button('remove', value - 1, value <= min, 'Diminuir quantidade')}
      <AppText bold style={styles.value}>
        {value}
      </AppText>
      {button('add', value + 1, value >= MAX_ITEM_QUANTITY, 'Aumentar quantidade')}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, alignSelf: 'flex-start' },
  button: { padding: 8 },
  value: { minWidth: 28, textAlign: 'center' },
});
