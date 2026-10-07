/**
 * Acompanhamento em tempo real: o status muda assim que o backend publica
 * `pedido.atualizado` no WebSocket; em seguida recarregamos o pedido completo.
 */
import { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { OrderStatusBadge } from '@/components/order/OrderStatusBadge';
import { OrderStatusTimeline } from '@/components/order/OrderStatusTimeline';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useApiQuery } from '@/hooks/useApiQuery';
import type { AppScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/services/api/errors';
import { ordersService } from '@/services/api/orders.service';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { formatDateTime, TIPO_ENTREGA_LABEL } from '@/utils/format';
import { formatPrice } from '@/utils/money';

export function OrderTrackingScreen({ route }: Readonly<AppScreenProps<'OrderTracking'>>) {
  const { orderId } = route.params;
  const { colors, spacing } = useTheme();
  const realtime = useAppSelector((state) => state.app.realtime);
  const lastOrderEvent = useAppSelector((state) => state.app.lastOrderEvent);
  const [cancelling, setCancelling] = useState(false);

  const {
    data: order,
    loading,
    refreshing,
    error,
    refetch,
  } = useApiQuery(() => ordersService.get(orderId), [orderId], { cacheKey: `pedido:${orderId}` });

  // Evento deste pedido chegou pelo WebSocket: recarrega os detalhes.
  useEffect(() => {
    if (lastOrderEvent?.pedido_id === orderId) void refetch({ silent: true });
  }, [lastOrderEvent, orderId, refetch]);

  if (loading) return <LoadingState />;
  if (!order)
    return (
      <ErrorState message={error ?? 'Pedido não encontrado.'} onRetry={() => void refetch()} />
    );

  const cancel = () =>
    Alert.alert('Cancelar pedido', `Deseja cancelar o pedido ${order.codigo}?`, [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Cancelar pedido',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await ordersService.cancel(order.id);
            await refetch();
          } catch (err) {
            Alert.alert('Não foi possível cancelar', getErrorMessage(err));
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refetch()} />}
      >
        <View style={styles.row}>
          <AppText variant="title">{order.codigo}</AppText>
          <OrderStatusBadge status={order.status} />
        </View>
        <AppText variant="caption" tone={realtime === 'open' ? 'success' : 'muted'}>
          {realtime === 'open'
            ? '● Atualizando em tempo real'
            : '○ Tempo real desconectado — puxe para atualizar'}
        </AppText>

        <Card>
          <OrderStatusTimeline status={order.status} tipoEntrega={order.tipo_entrega} />
        </Card>

        <Card>
          <AppText variant="subtitle">Detalhes</AppText>
          <AppText>Loja: {order.loja_nome}</AppText>
          <AppText>{TIPO_ENTREGA_LABEL[order.tipo_entrega]}</AppText>
          {!!order.endereco_entrega && <AppText tone="muted">{order.endereco_entrega}</AppText>}
          <AppText>Pagamento: {order.forma_pagamento_nome ?? '—'}</AppText>
          <AppText variant="caption" tone="muted">
            Feito em {formatDateTime(order.data_criacao)}
          </AppText>
          {!!order.observacao && <AppText tone="muted">Obs.: {order.observacao}</AppText>}
        </Card>

        <Card>
          <AppText variant="subtitle">Itens</AppText>
          {order.itens.map((item) => (
            <View key={item.id} style={styles.row}>
              <AppText style={styles.flex} numberOfLines={2}>
                {item.quantidade}× {item.produto_nome}
              </AppText>
              <AppText>{formatPrice(item.subtotal)}</AppText>
            </View>
          ))}
          <View style={[styles.row, styles.total, { borderColor: colors.border }]}>
            <AppText bold>Total</AppText>
            <AppText bold tone="primary">
              {formatPrice(order.total)}
            </AppText>
          </View>
        </Card>

        {order.status === 'PENDENTE' && (
          <Button title="Cancelar pedido" variant="danger" onPress={cancel} loading={cancelling} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  total: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
});
