import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ProductImage } from '@/components/product/ProductCard';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useApiQuery } from '@/hooks/useApiQuery';
import type { AppScreenProps } from '@/navigation/types';
import { catalogService } from '@/services/api/catalog.service';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addItem, selectQuantityInCart } from '@/store/slices/cartSlice';
import { CATEGORIA_LABEL } from '@/utils/format';
import { formatCents, formatPrice, toCents } from '@/utils/money';

export function ProductDetailsScreen({
  route,
  navigation,
}: Readonly<AppScreenProps<'ProductDetails'>>) {
  const { productId } = route.params;
  const dispatch = useAppDispatch();
  const inCart = useAppSelector(selectQuantityInCart(productId));
  const [quantity, setQuantity] = useState(1);

  const {
    data: product,
    loading,
    error,
    refetch,
  } = useApiQuery(() => catalogService.getProduct(productId), [productId], {
    cacheKey: `produto:${productId}`,
  });

  if (loading) return <LoadingState />;
  if (error || !product)
    return (
      <ErrorState message={error ?? 'Produto não encontrado.'} onRetry={() => void refetch()} />
    );

  const add = () => {
    dispatch(addItem({ product, quantity }));
    navigation.goBack();
  };

  return (
    <Screen
      scroll
      footer={
        <View style={styles.footer}>
          <QuantityStepper value={quantity} onChange={setQuantity} min={1} />
          <Button
            title={`Adicionar · ${formatCents(toCents(product.preco) * quantity)}`}
            onPress={add}
            style={styles.flex}
            disabled={!product.ativo}
          />
        </View>
      }
    >
      <ProductImage uri={product.foto} size="hero" />
      <View style={styles.gap}>
        <AppText variant="caption" tone="muted">
          {CATEGORIA_LABEL[product.categoria]} · SKU {product.sku}
        </AppText>
        <AppText variant="title">{product.nome}</AppText>
        <AppText variant="title" tone="primary">
          {formatPrice(product.preco)}
        </AppText>
        {inCart > 0 && (
          <AppText variant="caption" tone="success">
            Você já tem {inCart} no carrinho
          </AppText>
        )}
        {!product.ativo && <AppText tone="danger">Produto indisponível no momento.</AppText>}
      </View>
      {!!product.descricao && (
        <View style={styles.gap}>
          <AppText variant="subtitle">Descrição</AppText>
          <AppText>{product.descricao}</AppText>
        </View>
      )}
      <Card>
        <AppText variant="subtitle">Avaliações</AppText>
        {/* TODO: a API ainda não tem avaliações de produtos. */}
        <AppText tone="muted">Em breve você poderá avaliar este produto.</AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: 6 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
