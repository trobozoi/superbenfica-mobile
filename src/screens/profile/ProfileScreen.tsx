import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { env } from '@/config/env';
import type { TabScreenProps } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { selectUnreadCount } from '@/store/slices/notificationsSlice';
import { useTheme } from '@/theme/ThemeProvider';

type IconName = keyof typeof Ionicons.glyphMap;
type MenuTarget = 'Addresses' | 'Notifications' | 'Settings';

export function ProfileScreen({ navigation }: Readonly<TabScreenProps<'Profile'>>) {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const unread = useAppSelector(selectUnreadCount);

  const menu: { icon: IconName; label: string; target: MenuTarget; badge?: number }[] = [
    { icon: 'location-outline', label: 'Meus endereços', target: 'Addresses' },
    {
      icon: 'notifications-outline',
      label: 'Notificações',
      target: 'Notifications',
      badge: unread,
    },
    { icon: 'settings-outline', label: 'Configurações', target: 'Settings' },
  ];

  const confirmLogout = () =>
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void dispatch(logout()) },
    ]);

  return (
    <Screen scroll>
      <Card>
        <AppText variant="subtitle">{user?.nome ?? 'Cliente'}</AppText>
        <AppText tone="muted">{user?.email}</AppText>
        {!!user?.telefone && <AppText tone="muted">{user.telefone}</AppText>}
        {!!user?.loja_nome && <AppText variant="caption">Loja preferida: {user.loja_nome}</AppText>}
      </Card>

      <Card style={styles.menu}>
        {menu.map((item, index) => (
          <Pressable
            key={item.target}
            accessibilityRole="button"
            onPress={() => navigation.navigate(item.target)}
            style={[
              styles.menuItem,
              index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
            ]}
          >
            <Ionicons name={item.icon} size={22} color={colors.text} />
            <AppText style={styles.flex}>{item.label}</AppText>
            {!!item.badge && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <AppText variant="caption" tone="inverse" bold>
                  {item.badge}
                </AppText>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </Card>

      <Button title="Sair" variant="danger" onPress={confirmLogout} />
      {!env.isProduction && (
        <AppText variant="caption" tone="muted" center>
          {env.appEnv} · {env.apiUrl}
        </AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  menu: { padding: 0, gap: 0 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
});
