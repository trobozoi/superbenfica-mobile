/**
 * Exibida enquanto a sessão é restaurada (depois que a splash nativa some).
 * Normalmente nem aparece: a splash nativa só é ocultada ao fim do bootstrap.
 */
import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function SplashView() {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      accessibilityLabel="Carregando"
    >
      <Image
        source={require('../../assets/splash-icon.png')}
        style={styles.logo}
        contentFit="contain"
      />
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  logo: { width: 160, height: 160 },
});
