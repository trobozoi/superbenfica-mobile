import { FlashList } from '@shopify/flash-list';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, type TextInput } from 'react-native';

import { ProductCard } from '@/components/product/ProductCard';
import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { TextField } from '@/components/ui/TextField';
import { SEARCH_DEBOUNCE_MS } from '@/config/constants';
import { useDebounce } from '@/hooks/useDebounce';
import { useProducts } from '@/hooks/useProducts';
import type { TabScreenProps } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addItem } from '@/store/slices/cartSlice';
import { useTheme } from '@/theme/ThemeProvider';
import type { Categoria, Produto } from '@/types/api';
import { CATEGORIA_LABEL, CATEGORIAS } from '@/utils/format';

const ORDERINGS = [
  { value: 'nome', label: 'A-Z' },
  { value: 'preco', label: 'Menor preço' },
  { value: '-preco', label: 'Maior preço' },
] as const;

export function ExploreScreen({ navigation, route }: Readonly<TabScreenProps<'Explore'>>) {
  const { colors, spacing } = useTheme();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);
  const searchRef = useRef<TextInput>(null);

  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState<Categoria | null>(route.params?.categoria ?? null);
  const [ordering, setOrdering] = useState<string>('nome');
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);

  // Categoria escolhida na Home: ajusta o estado durante o render
  // (padrão recomendado pelo React em vez de setState dentro de efeito).
  const [prevParams, setPrevParams] = useState(route.params);
  if (route.params !== prevParams) {
    setPrevParams(route.params);
    if (route.params?.categoria) setCategoria(route.params.categoria);
  }

  // Foco na busca quando a Home pede.
  useEffect(() => {
    if (route.params?.focusSearch) searchRef.current?.focus();
  }, [route.params]);

  const products = useProducts({ search: debouncedSearch, categoria, ordering });

  const openProduct = useCallback(
    (product: Produto) =>
      navigation.navigate('ProductDetails', { productId: product.id, title: product.nome }),
    [navigation],
  );
  const addToCart = useCallback((product: Produto) => dispatch(addItem({ product })), [dispatch]);

  const renderContent = () => {
    if (products.loading) return <LoadingState />;
    if (products.error && products.items.length === 0) {
      return <ErrorState message={products.error} onRetry={() => void products.refetch()} />;
    }
    return (
      <FlashList
        data={products.items}
        numColumns={2}
        keyExtractor={(item) => String(item.id)}
        extraData={cartItems}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            quantityInCart={cartItems.find((i) => i.product.id === item.id)?.quantity ?? 0}
            onPress={openProduct}
            onAdd={addToCart}
          />
        )}
        onEndReached={() => void products.loadMore()}
        onEndReachedThreshold={0.5}
        refreshing={products.refreshing}
        onRefresh={() => void products.refetch()}
        contentContainerStyle={{ padding: spacing.sm }}
        ListEmptyComponent={
          <EmptyState title="Nenhum produto encontrado" message="Tente outra busca ou categoria." />
        }
        ListFooterComponent={
          products.loadingMore ? <ActivityIndicator color={colors.primary} /> : null
        }
      />
    );
  };

  return (
    <Screen padded={false}>
      <View style={{ padding: spacing.lg, paddingBottom: 0, gap: spacing.sm }}>
        <TextField
          ref={searchRef}
          label="Buscar"
          placeholder="Nome, SKU ou código de barras"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip label="Todas" selected={categoria === null} onPress={() => setCategoria(null)} />
          {CATEGORIAS.map((c) => (
            <Chip
              key={c}
              label={CATEGORIA_LABEL[c]}
              selected={categoria === c}
              onPress={() => setCategoria(c)}
            />
          ))}
        </ScrollView>
        <View style={styles.chips}>
          {ORDERINGS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={ordering === o.value}
              onPress={() => setOrdering(o.value)}
            />
          ))}
        </View>
        {products.stale && (
          <AppText variant="caption" tone="muted">
            Mostrando resultados salvos (sem conexão).
          </AppText>
        )}
      </View>
      <View style={styles.flex}>{renderContent()}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chips: { flexDirection: 'row', gap: 8 },
});
