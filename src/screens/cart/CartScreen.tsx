import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ProductImage } from '@/components/product/ProductCard';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ListSeparator } from '@/components/ui/ListSeparator';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Screen } from '@/components/ui/Screen';
import { EmptyState } from '@/components/ui/StateViews';
import type { TabScreenProps } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearCart,
  removeItem,
  selectCartItems,
  selectCartTotalCents,
  setQuantity,
} from '@/store/slices/cartSlice';
import { useTheme } from '@/theme/ThemeProvider';
import { formatCents, formatPrice, toCents } from '@/utils/money';

export function CartScreen({ navigation }: Readonly<TabScreenProps<'Cart'>>) {
  const dispatch = useAppDispatch();
  const { colors, spacing } = useTheme();
  const items = useAppSelector(selectCartItems);
  const totalCents = useAppSelector(selectCartTotalCents);
  const isOnline = useAppSelector((state) => state.app.isOnline);

  if (items.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="cart-outline"
          title="Seu carrinho está vazio"
          message="Explore o catálogo e adicione produtos."
          actionLabel="Explorar produtos"
          onAction={() => navigation.navigate('Explore')}
        />
      </Screen>
    );
  }

  const confirmClear = () =>
    Alert.alert('Esvaziar carrinho', 'Remover todos os itens?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Esvaziar', style: 'destructive', onPress: () => dispatch(clearCart()) },
    ]);

  return (
    <Screen
      padded={false}
      footer={
        <View style={{ gap: spacing.sm }}>
          <View style={styles.row}>
            <AppText variant="subtitle">Total estimado</AppText>
            <AppText variant="subtitle" tone="primary">
              {formatCents(totalCents)}
            </AppText>
          </View>
          {!isOnline && (
            <AppText variant="caption" tone="danger">
              Conecte-se à internet para finalizar o pedido.
            </AppText>
          )}
          <Button
            title="Finalizar pedido"
            onPress={() => navigation.navigate('Checkout')}
            disabled={!isOnline}
          />
        </View>
      }
    >
      <FlashList
        data={items}
        keyExtractor={(item) => String(item.product.id)}
        contentContainerStyle={{ padding: spacing.lg }}
        ItemSeparatorComponent={ListSeparator}
        ListHeaderComponent={
          <Button
            title="Esvaziar carrinho"
            variant="ghost"
            onPress={confirmClear}
            style={styles.clear}
          />
        }
        renderItem={({ item }) => (
          <View
            style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.thumb}>
              <ProductImage uri={item.product.foto} />
            </View>
            <View style={styles.info}>
              <AppText variant="label" numberOfLines={2}>
                {item.product.nome}
              </AppText>
              <AppText variant="caption" tone="muted">
                {formatPrice(item.product.preco)} un.
              </AppText>
              <View style={styles.row}>
                <QuantityStepper
                  value={item.quantity}
                  onChange={(quantity) =>
                    dispatch(setQuantity({ productId: item.product.id, quantity }))
                  }
                />
                <AppText bold>{formatCents(toCents(item.product.preco) * item.quantity)}</AppText>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remover ${item.product.nome}`}
              hitSlop={8}
              onPress={() => dispatch(removeItem(item.product.id))}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  item: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: 72 },
  info: { flex: 1, gap: 4 },
  clear: { alignSelf: 'flex-end', minHeight: 32 },
});
