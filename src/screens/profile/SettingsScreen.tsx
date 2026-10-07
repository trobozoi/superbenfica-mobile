import Constants from 'expo-constants';
import { StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { requestNotificationPermission } from '@/services/notifications/pushNotifications';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setNotificationsEnabled,
  setTheme,
  type ThemePreference,
} from '@/store/slices/settingsSlice';

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];

export function SettingsScreen() {
  const dispatch = useAppDispatch();
  const { theme, notificationsEnabled } = useAppSelector((state) => state.settings);

  const toggleNotifications = async (enabled: boolean) => {
    const granted = enabled ? await requestNotificationPermission() : true;
    dispatch(setNotificationsEnabled(enabled && granted));
  };

  return (
    <Screen scroll>
      <Card>
        <AppText variant="subtitle">Aparência</AppText>
        <View style={styles.chips}>
          {THEMES.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={theme === option.value}
              onPress={() => dispatch(setTheme(option.value))}
            />
          ))}
        </View>
      </Card>
      <Card>
        <View style={styles.row}>
          <View style={styles.flex}>
            <AppText variant="subtitle">Notificações de pedidos</AppText>
            <AppText variant="caption" tone="muted">
              Avisos quando o status do pedido mudar.
            </AppText>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={(value) => void toggleNotifications(value)}
            accessibilityLabel="Notificações de pedidos"
          />
        </View>
      </Card>
      <AppText variant="caption" tone="muted" center>
        Versão {Constants.expoConfig?.version}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chips: { flexDirection: 'row', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
