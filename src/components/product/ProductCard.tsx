import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import type { Produto } from '@/types/api';
import { CATEGORIA_LABEL } from '@/utils/format';
import { formatPrice } from '@/utils/money';

interface Props {
  product: Produto;
  quantityInCart: number;
  onPress: (product: Produto) => void;
  onAdd: (product: Produto) => void;
}

/** Card de produto para grades (memo: listas grandes re-renderizam muito). */
export const ProductCard = memo(function ProductCard({
  product,
  quantityInCart,
  onPress,
  onAdd,
}: Readonly<Props>) {
  const { colors, radius, spacing } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.nome}, ${formatPrice(product.preco)}`}
      onPress={() => onPress(product)}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.sm,
        },
      ]}
    >
      <ProductImage uri={product.foto} />
      <AppText variant="caption" tone="muted" numberOfLines={1}>
        {CATEGORIA_LABEL[product.categoria]}
      </AppText>
      <AppText variant="label" numberOfLines={2} style={styles.name}>
        {product.nome}
      </AppText>
      <View style={styles.footer}>
        <AppText bold tone="primary">
          {formatPrice(product.preco)}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Adicionar ${product.nome} ao carrinho`}
          hitSlop={8}
          onPress={() => onAdd(product)}
          style={[styles.add, { backgroundColor: colors.primary, borderRadius: radius.pill }]}
        >
          {quantityInCart > 0 ? (
            <AppText variant="caption" tone="inverse" bold>
              {quantityInCart}
            </AppText>
          ) : (
            <Ionicons name="add" size={18} color={colors.primaryContrast} />
          )}
        </Pressable>
      </View>
    </Pressable>
  );
});

export function ProductImage({
  uri,
  size = 'card',
}: Readonly<{ uri: string | null; size?: 'card' | 'hero' }>) {
  const { colors, radius } = useTheme();
  const style = [
    size === 'hero' ? styles.hero : styles.image,
    { backgroundColor: colors.surfaceAlt, borderRadius: radius.md },
  ];
  if (!uri) {
    return (
      <View style={[style, styles.placeholder]} accessibilityLabel="Produto sem foto">
        <Ionicons name="image-outline" size={size === 'hero' ? 64 : 32} color={colors.textMuted} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit="contain"
      cachePolicy="memory-disk"
      transition={150}
    />
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, margin: 6, borderWidth: StyleSheet.hairlineWidth, gap: 4 },
  image: { width: '100%', aspectRatio: 1 },
  hero: { width: '100%', aspectRatio: 1.2 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  name: { minHeight: 36 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  add: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
