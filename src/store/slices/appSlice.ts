/** Estado de infraestrutura: conexão com a internet e com o tempo real. */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ConnectionState } from '@/services/websocket/realtimeClient';
import type { PedidoEventoDados } from '@/types/api';

export interface AppState {
  isOnline: boolean;
  realtime: ConnectionState;
  /** Último evento de pedido recebido; as telas de pedido reagem a ele. */
  lastOrderEvent: (PedidoEventoDados & { receivedAt: number }) | null;
}

const initialState: AppState = {
  isOnline: true,
  realtime: 'idle',
  lastOrderEvent: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    connectivityChanged: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    realtimeStateChanged: (state, action: PayloadAction<ConnectionState>) => {
      state.realtime = action.payload;
    },
    orderEventReceived: (state, action: PayloadAction<PedidoEventoDados>) => {
      state.lastOrderEvent = { ...action.payload, receivedAt: Date.now() };
    },
  },
});

export const { connectivityChanged, realtimeStateChanged, orderEventReceived } = appSlice.actions;
export default appSlice.reducer;
