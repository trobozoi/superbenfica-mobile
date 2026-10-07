/**
 * Carrinho local, persistido no AsyncStorage (ver `store/persistence.ts`).
 * Guardamos um "retrato" do produto para exibir o carrinho mesmo offline;
 * o preço final é sempre o calculado pelo backend ao criar o pedido.
 */
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { MAX_ITEM_QUANTITY } from '@/config/constants';
import type { Produto } from '@/types/api';
import { toCents } from '@/utils/money';

export type CartProduct = Pick<Produto, 'id' | 'nome' | 'preco' | 'foto' | 'categoria' | 'sku'>;

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
}

const initialState: CartState = { items: [] };

const clamp = (quantity: number): number =>
  Math.max(0, Math.min(MAX_ITEM_QUANTITY, Math.floor(quantity)));

function toCartProduct(product: Produto | CartProduct): CartProduct {
  const { id, nome, preco, foto, categoria, sku } = product;
  return { id, nome, preco, foto, categoria, sku };
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    cartHydrated: (_state, action: PayloadAction<CartState | null>) =>
      action.payload ?? initialState,
    addItem: (
      state,
      action: PayloadAction<{ product: Produto | CartProduct; quantity?: number }>,
    ) => {
      const { product, quantity = 1 } = action.payload;
      const existing = state.items.find((item) => item.product.id === product.id);
      if (existing) {
        existing.quantity = clamp(existing.quantity + quantity);
        existing.product = toCartProduct(product); // atualiza preço/foto
      } else if (clamp(quantity) > 0) {
        state.items.push({ product: toCartProduct(product), quantity: clamp(quantity) });
      }
    },
    setQuantity: (state, action: PayloadAction<{ productId: number; quantity: number }>) => {
      const quantity = clamp(action.payload.quantity);
      if (quantity === 0) {
        state.items = state.items.filter((item) => item.product.id !== action.payload.productId);
        return;
      }
      const item = state.items.find((i) => i.product.id === action.payload.productId);
      if (item) item.quantity = quantity;
    },
    removeItem: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((item) => item.product.id !== action.payload);
    },
    clearCart: () => initialState,
  },
});

export const { cartHydrated, addItem, setQuantity, removeItem, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

type WithCart = { cart: CartState };

export const selectCartItems = (state: WithCart) => state.cart.items;

export const selectCartCount = createSelector(selectCartItems, (items) =>
  items.reduce((total, item) => total + item.quantity, 0),
);

/** Total estimado em centavos (soma inteira, sem erro de float). */
export const selectCartTotalCents = createSelector(selectCartItems, (items) =>
  items.reduce((total, item) => total + toCents(item.product.preco) * item.quantity, 0),
);

export const selectQuantityInCart = (productId: number) => (state: WithCart) =>
  state.cart.items.find((item) => item.product.id === productId)?.quantity ?? 0;
