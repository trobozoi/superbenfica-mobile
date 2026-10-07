import { FlashList } from '@shopify/flash-list';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SmallListSeparator } from '@/components/ui/ListSeparator';
import { Screen } from '@/components/ui/Screen';
import { EmptyState } from '@/components/ui/StateViews';
import type { AppScreenProps } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  markAllAsRead,
  markAsRead,
  selectNotifications,
  selectUnreadCount,
  type AppNotification,
} from '@/store/slices/notificationsSlice';
import { useTheme } from '@/theme/ThemeProvider';
import { formatDateTime } from '@/utils/format';

/** Botão do header: marca todas como lidas (só aparece se houver não lidas). */
export function MarkAllReadButton() {
  const dispatch = useAppDispatch();
  const hasUnread = useAppSelector((state) => selectUnreadCount(state) > 0);
  if (!hasUnread) return null;
  return <Button title="Ler todas" variant="ghost" onPress={() => dispatch(markAllAsRead())} />;
}

export function NotificationsScreen({ navigation }: Readonly<AppScreenProps<'Notifications'>>) {
  const dispatch = useAppDispatch();
  const { colors, spacing } = useTheme();
  const items = useAppSelector(selectNotifications);

  const open = (item: AppNotification) => {
    dispatch(markAsRead(item.id));
    if (item.orderId) navigation.navigate('OrderTracking', { orderId: item.orderId });
  };

  return (
    <Screen padded={false}>
      <FlashList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg }}
        ItemSeparatorComponent={SmallListSeparator}
        renderItem={({ item }) => (
          <Card
            onPress={() => open(item)}
            style={item.read ? undefined : { borderColor: colors.primary, borderWidth: 1 }}
          >
            <AppText bold={!item.read}>{item.title}</AppText>
            <AppText tone="muted">{item.body}</AppText>
            <AppText variant="caption" tone="muted">
              {formatDateTime(new Date(item.createdAt).toISOString())}
            </AppText>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="Nenhuma notificação"
            message="Você será avisado aqui quando seus pedidos mudarem de status."
          />
        }
      />
    </Screen>
  );
}
