import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';

/** Faixa exibida no topo das telas quando o aparelho está sem internet. */
export function OfflineBanner() {
  const isOnline = useAppSelector((state) => state.app.isOnline);
  const { colors, spacing } = useTheme();
  if (isOnline) return null;

  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: colors.warning, padding: spacing.sm }]}
    >
      <Ionicons name="cloud-offline-outline" size={16} color={colors.primaryContrast} />
      <AppText variant="caption" tone="inverse">
        Sem conexão. Mostrando dados salvos.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
