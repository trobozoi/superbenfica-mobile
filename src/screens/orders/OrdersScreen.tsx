import { FlashList } from '@shopify/flash-list';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

import { OrderCard } from '@/components/order/OrderCard';
import { AppText } from '@/components/ui/AppText';
import { ListSeparator } from '@/components/ui/ListSeparator';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';
import type { TabScreenProps } from '@/navigation/types';
import { ordersService } from '@/services/api/orders.service';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import type { Pedido } from '@/types/api';

const fetchOrders = (page: number) => ordersService.list(page);

export function OrdersScreen({ navigation }: Readonly<TabScreenProps<'Orders'>>) {
  const { colors, spacing } = useTheme();
  const lastOrderEvent = useAppSelector((state) => state.app.lastOrderEvent);
  const orders = usePaginatedQuery(fetchOrders, [], 'pedidos:1');

  // Evento em tempo real: recarrega a 1ª página sem piscar a lista.
  const { refetch } = orders;
  useEffect(() => {
    if (lastOrderEvent) void refetch({ silent: true });
  }, [lastOrderEvent, refetch]);

  const openOrder = useCallback(
    (order: Pedido) => navigation.navigate('OrderTracking', { orderId: order.id }),
    [navigation],
  );

  if (orders.loading) return <LoadingState />;
  if (orders.error && orders.items.length === 0) {
    return <ErrorState message={orders.error} onRetry={() => void orders.refetch()} />;
  }

  return (
    <Screen padded={false}>
      {orders.stale && (
        <AppText variant="caption" tone="muted" center style={{ padding: spacing.sm }}>
          Histórico salvo (sem conexão)
        </AppText>
      )}
      <FlashList
        data={orders.items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <OrderCard order={item} onPress={openOrder} />}
        ItemSeparatorComponent={ListSeparator}
        contentContainerStyle={{ padding: spacing.lg }}
        refreshing={orders.refreshing}
        onRefresh={() => void orders.refetch()}
        onEndReached={() => void orders.loadMore()}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Nenhum pedido ainda"
            message="Seus pedidos aparecerão aqui."
            actionLabel="Começar a comprar"
            onAction={() => navigation.navigate('Explore')}
          />
        }
        ListFooterComponent={
          orders.loadingMore ? <ActivityIndicator color={colors.primary} /> : null
        }
      />
    </Screen>
  );
}
