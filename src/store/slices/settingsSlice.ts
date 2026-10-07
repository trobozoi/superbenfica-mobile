import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface SettingsState {
  theme: ThemePreference;
  notificationsEnabled: boolean;
}

const initialState: SettingsState = {
  theme: 'system',
  notificationsEnabled: true,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    settingsHydrated: (state, action: PayloadAction<Partial<SettingsState> | null>) => ({
      ...state,
      ...action.payload,
    }),
    setTheme: (state, action: PayloadAction<ThemePreference>) => {
      state.theme = action.payload;
    },
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notificationsEnabled = action.payload;
    },
  },
});

export const { settingsHydrated, setTheme, setNotificationsEnabled } = settingsSlice.actions;
export default settingsSlice.reducer;
