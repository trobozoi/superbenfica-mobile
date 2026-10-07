import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import type { Pedido } from '@/types/api';
import { formatDateTime, TIPO_ENTREGA_LABEL } from '@/utils/format';
import { formatPrice } from '@/utils/money';

import { OrderStatusBadge } from './OrderStatusBadge';

interface Props {
  order: Pedido;
  onPress: (order: Pedido) => void;
}

export const OrderCard = memo(function OrderCard({ order, onPress }: Readonly<Props>) {
  const itemCount = order.itens.reduce((sum, item) => sum + item.quantidade, 0);
  return (
    <Card onPress={() => onPress(order)} accessibilityLabel={`Pedido ${order.codigo}`}>
      <View style={styles.header}>
        <AppText bold>{order.codigo}</AppText>
        <OrderStatusBadge status={order.status} />
      </View>
      <AppText variant="caption" tone="muted">
        {formatDateTime(order.data_criacao)} · {order.loja_nome}
      </AppText>
      <View style={styles.header}>
        <AppText variant="caption">
          {itemCount} {itemCount === 1 ? 'item' : 'itens'} ·{' '}
          {TIPO_ENTREGA_LABEL[order.tipo_entrega]}
        </AppText>
        <AppText bold>{formatPrice(order.total)}</AppText>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
});
