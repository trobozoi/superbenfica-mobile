import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { useAppSelector } from '@/store/hooks';

import { darkTheme, lightTheme, type AppTheme } from './index';

const ThemeContext = createContext<AppTheme>(lightTheme);

/** Resolve o tema a partir da preferência do usuário (ou do sistema). */
export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
  const systemScheme = useColorScheme();
  const preference = useAppSelector((state) => state.settings.theme);

  const theme = useMemo(() => {
    const scheme = preference === 'system' ? systemScheme : preference;
    return scheme === 'dark' ? darkTheme : lightTheme;
  }, [preference, systemScheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}
