import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { authService } from '@/services/api/auth.service';
import { ApiError, toApiError, type FieldErrors } from '@/services/api/errors';
import { fetchWithOfflineCache } from '@/services/offline/offlineCache';
import { clearUserData } from '@/services/storage/storage';
import { tokenStorage } from '@/services/storage/tokenStorage';
import type { RegistroPayload, Usuario } from '@/types/api';

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: Usuario | null;
  loading: boolean;
  error: string | null;
  fieldErrors: FieldErrors;
}

const initialState: AuthState = {
  status: 'checking',
  user: null,
  loading: false,
  error: null,
  fieldErrors: {},
};

interface RejectPayload {
  message: string;
  fieldErrors: FieldErrors;
}

const toReject = (error: unknown): RejectPayload => {
  const apiError = toApiError(error);
  return { message: apiError.message, fieldErrors: apiError.fieldErrors };
};

const CLIENT_ONLY_MESSAGE = 'Este app é exclusivo para clientes. Use o painel da loja.';

/** Este app é só para clientes; funcionários usam o painel administrativo. */
async function loadClientUser(): Promise<Usuario> {
  const user = await authService.me();
  if (user.role !== 'CLIENTE') {
    await authService.logout();
    throw new ApiError({ message: CLIENT_ONLY_MESSAGE, kind: 'http', status: 403 });
  }
  return user;
}

/** Restaura a sessão salva ao abrir o app. */
export const restoreSession = createAsyncThunk<Usuario | null>('auth/restore', async () => {
  const tokens = await tokenStorage.load();
  if (!tokens) return null;
  try {
    // Sem internet, usa o último perfil salvo para abrir o app em modo offline.
    return (await fetchWithOfflineCache('usuario', loadClientUser)).data;
  } catch (error) {
    const apiError = toApiError(error);
    // Sem internet: mantém a sessão para o modo offline (dados do cache).
    if (apiError.isNetworkError) throw apiError;
    await tokenStorage.clear();
    return null;
  }
});

export const login = createAsyncThunk<
  Usuario,
  { email: string; password: string },
  { rejectValue: RejectPayload }
>('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    await authService.login(email, password);
    return await loadClientUser();
  } catch (error) {
    return rejectWithValue(toReject(error));
  }
});

export const register = createAsyncThunk<Usuario, RegistroPayload, { rejectValue: RejectPayload }>(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      await authService.register(payload);
      await authService.login(payload.email, payload.password);
      return await loadClientUser();
    } catch (error) {
      return rejectWithValue(toReject(error));
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
  await clearUserData();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Disparado pelo cliente HTTP quando o refresh token expira. */
    sessionExpired: (state) => {
      state.status = 'unauthenticated';
      state.user = null;
      state.error = 'Sua sessão expirou. Entre novamente.';
    },
    clearAuthError: (state) => {
      state.error = null;
      state.fieldErrors = {};
    },
    userUpdated: (state, action: { payload: Partial<Usuario> }) => {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = action.payload ? 'authenticated' : 'unauthenticated';
      })
      .addCase(restoreSession.rejected, (state) => {
        // Offline com tokens salvos: entra no app com os dados em cache.
        state.status = 'authenticated';
      })
      .addCase(logout.fulfilled, () => ({ ...initialState, status: 'unauthenticated' }));

    for (const thunk of [login, register]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.loading = true;
          state.error = null;
          state.fieldErrors = {};
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.loading = false;
          state.user = action.payload;
          state.status = 'authenticated';
        })
        .addCase(thunk.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload?.message ?? 'Não foi possível entrar.';
          state.fieldErrors = action.payload?.fieldErrors ?? {};
        });
    }
  },
});

export const { sessionExpired, clearAuthError, userUpdated } = authSlice.actions;
export default authSlice.reducer;
