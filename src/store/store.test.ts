import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/config/constants';
import type { Produto } from '@/types/api';

import { createStore } from './index';
import { hydrateStore } from './persistence';
import { sessionExpired } from './slices/authSlice';
import cartReducer, {
  addItem,
  removeItem,
  selectCartCount,
  selectCartTotalCents,
  setQuantity,
} from './slices/cartSlice';
import {
  notificationReceived,
  selectUnreadCount,
  markAllAsRead,
} from './slices/notificationsSlice';
import { setTheme } from './slices/settingsSlice';

const produto = (id: number, preco: string): Produto => ({
  id,
  nome: `Produto ${id}`,
  descricao: '',
  categoria: 'MERCEARIA',
  preco,
  sku: `SKU-${id}`,
  codigo_barras: '',
  ativo: true,
  foto: null,
  data_criacao: '',
  data_atualizacao: '',
});

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('cartSlice', () => {
  it('adiciona, soma quantidades e calcula total em centavos', () => {
    let state = cartReducer(undefined, addItem({ product: produto(1, '4.79') }));
    state = cartReducer(state, addItem({ product: produto(1, '4.79'), quantity: 2 }));
    state = cartReducer(state, addItem({ product: produto(2, '0.10'), quantity: 3 }));

    const root = { cart: state };
    expect(selectCartCount(root)).toBe(6);
    expect(selectCartTotalCents(root)).toBe(479 * 3 + 30);
  });

  it('quantidade zero remove o item e o máximo é 999', () => {
    let state = cartReducer(undefined, addItem({ product: produto(1, '1.00') }));
    state = cartReducer(state, setQuantity({ productId: 1, quantity: 5000 }));
    expect(state.items[0]?.quantity).toBe(999);
    state = cartReducer(state, setQuantity({ productId: 1, quantity: 0 }));
    expect(state.items).toHaveLength(0);
  });

  it('remove item', () => {
    let state = cartReducer(undefined, addItem({ product: produto(1, '1.00') }));
    state = cartReducer(state, removeItem(1));
    expect(state.items).toEqual([]);
  });
});

describe('persistência', () => {
  beforeEach(() => AsyncStorage.clear());

  it('grava carrinho e tema e os recupera ao iniciar', async () => {
    const store = createStore();
    store.dispatch(addItem({ product: produto(7, '2.99'), quantity: 2 }));
    store.dispatch(setTheme('dark'));
    await flush();

    const fresh = createStore();
    await hydrateStore(fresh.dispatch);
    expect(fresh.getState().cart.items[0]?.quantity).toBe(2);
    expect(fresh.getState().settings.theme).toBe('dark');
  });

  it('sessão expirada limpa carrinho e notificações', async () => {
    const store = createStore();
    store.dispatch(addItem({ product: produto(1, '1.00') }));
    store.dispatch(
      notificationReceived({ id: 'n1', title: 't', body: 'b', createdAt: Date.now(), orderId: 1 }),
    );
    expect(selectUnreadCount(store.getState())).toBe(1);

    store.dispatch(sessionExpired());
    await flush();

    expect(store.getState().cart.items).toEqual([]);
    expect(store.getState().notifications.items).toEqual([]);
    expect(store.getState().auth.status).toBe('unauthenticated');
    expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.cart)) ?? '{}')).toEqual({
      items: [],
    });
  });

  it('marca todas as notificações como lidas', () => {
    const store = createStore();
    store.dispatch(notificationReceived({ id: 'a', title: '', body: '', createdAt: 1 }));
    store.dispatch(notificationReceived({ id: 'b', title: '', body: '', createdAt: 2 }));
    store.dispatch(markAllAsRead());
    expect(selectUnreadCount(store.getState())).toBe(0);
  });
});
