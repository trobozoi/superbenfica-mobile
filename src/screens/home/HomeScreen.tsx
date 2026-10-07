import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderStatusBadge } from '@/components/order/OrderStatusBadge';
import { ProductCard } from '@/components/product/ProductCard';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useApiQuery } from '@/hooks/useApiQuery';
import type { TabScreenProps } from '@/navigation/types';
import { catalogService } from '@/services/api/catalog.service';
import { ordersService } from '@/services/api/orders.service';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addItem } from '@/store/slices/cartSlice';
import { selectUnreadCount } from '@/store/slices/notificationsSlice';
import { useTheme } from '@/theme/ThemeProvider';
import type { Produto, StatusPedido } from '@/types/api';
import { CATEGORIA_LABEL, CATEGORIAS } from '@/utils/format';

const FINAL_STATUSES: readonly StatusPedido[] = ['FINALIZADO', 'CANCELADO'];
const HIGHLIGHT_COUNT = 6;

export function HomeScreen({ navigation }: Readonly<TabScreenProps<'Home'>>) {
  const { colors, spacing, radius } = useTheme();
  const dispatch = useAppDispatch();
  const userName = useAppSelector((state) => state.auth.user?.nome.split(' ')[0]);
  const unread = useAppSelector(selectUnreadCount);
  const cartItems = useAppSelector((state) => state.cart.items);
  const lastOrderEvent = useAppSelector((state) => state.app.lastOrderEvent);

  const highlights = useApiQuery(
    () => catalogService.listProducts({ ordering: '-data_atualizacao' }),
    [],
    { cacheKey: 'home:destaques' },
  );
  // Recarrega quando chega um evento de pedido pelo WebSocket.
  const orders = useApiQuery(() => ordersService.list(1), [], {
    cacheKey: 'pedidos:1',
  });
  const refetchOrders = orders.refetch;
  // Evento de pedido pelo WebSocket: atualiza o card de pedido em andamento.
  useEffect(() => {
    if (lastOrderEvent) void refetchOrders({ silent: true });
  }, [lastOrderEvent, refetchOrders]);
  const activeOrder = orders.data?.results.find((o) => !FINAL_STATUSES.includes(o.status));

  const openProduct = useCallback(
    (product: Produto) =>
      navigation.navigate('ProductDetails', { productId: product.id, title: product.nome }),
    [navigation],
  );
  const addToCart = useCallback((product: Produto) => dispatch(addItem({ product })), [dispatch]);
  const quantityOf = (id: number) => cartItems.find((i) => i.product.id === id)?.quantity ?? 0;

  const greeting = userName ? `Olá, ${userName}!` : 'Olá!';
  const unreadLabel = unread ? `Notificações, ${unread} não lidas` : 'Notificações';
  const refresh = () => Promise.all([highlights.refetch(), orders.refetch()]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
        refreshControl={<RefreshControl refreshing={highlights.refreshing} onRefresh={refresh} />}
      >
        <View style={styles.header}>
          <View>
            <AppText tone="muted">{greeting}</AppText>
            <AppText variant="title">O que vamos comprar hoje?</AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={unreadLabel}
            onPress={() => navigation.navigate('Notifications')}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={26} color={colors.text} />
            {unread > 0 && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="search"
          accessibilityLabel="Buscar produtos"
          onPress={() => navigation.navigate('Explore', { focusSearch: true })}
          style={[
            styles.search,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
            },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <AppText tone="muted">Buscar produtos</AppText>
        </Pressable>

        {activeOrder && (
          <Card
            onPress={() => navigation.navigate('OrderTracking', { orderId: activeOrder.id })}
            accessibilityLabel={`Acompanhar pedido ${activeOrder.codigo}`}
          >
            <AppText variant="label">Pedido em andamento</AppText>
            <View style={styles.header}>
              <AppText bold>{activeOrder.codigo}</AppText>
              <OrderStatusBadge status={activeOrder.status} />
            </View>
          </Card>
        )}

        <AppText variant="subtitle">Categorias</AppText>
        <View style={styles.chips}>
          {CATEGORIAS.map((categoria) => (
            <Chip
              key={categoria}
              label={CATEGORIA_LABEL[categoria]}
              onPress={() => navigation.navigate('Explore', { categoria })}
            />
          ))}
        </View>

        <AppText variant="subtitle">Destaques</AppText>
        {highlights.loading && <LoadingState />}
        {!!highlights.error && !highlights.data && (
          <ErrorState message={highlights.error} onRetry={() => void highlights.refetch()} />
        )}
        <View style={styles.grid}>
          {highlights.data?.results.slice(0, HIGHLIGHT_COUNT).map((product) => (
            <View key={product.id} style={styles.gridItem}>
              <ProductCard
                product={product}
                quantityInCart={quantityOf(product.id)}
                onPress={openProduct}
                onAdd={addToCart}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  dot: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, padding: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  gridItem: { width: '50%' },
});
