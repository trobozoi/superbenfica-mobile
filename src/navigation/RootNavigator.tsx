/**
 * Raiz da navegação: alterna entre o fluxo de autenticação e o app,
 * conforme `auth.status`. Ao sair, a pilha inteira do app é descartada.
 */
import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';

import { CheckoutScreen } from '@/screens/checkout/CheckoutScreen';
import { NotificationsScreen } from '@/screens/notifications/NotificationsScreen';
import { OrderTrackingScreen } from '@/screens/orders/OrderTrackingScreen';
import { ProductDetailsScreen } from '@/screens/product/ProductDetailsScreen';
import { AddressesScreen } from '@/screens/profile/AddressesScreen';
import { AddressFormScreen } from '@/screens/profile/AddressFormScreen';
import { SettingsScreen } from '@/screens/profile/SettingsScreen';
import { SplashView } from '@/screens/SplashView';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme/ThemeProvider';

import { AuthNavigator } from './AuthNavigator';
import { linking } from './linking';
import { MainTabs } from './MainTabs';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={({ route }) => ({ title: route.params.title ?? 'Produto' })}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Finalizar pedido' }}
      />
      <Stack.Screen
        name="OrderTracking"
        component={OrderTrackingScreen}
        options={{ title: 'Acompanhar pedido' }}
      />
      <Stack.Screen name="Addresses" component={AddressesScreen} options={{ title: 'Endereços' }} />
      <Stack.Screen
        name="AddressForm"
        component={AddressFormScreen}
        options={{ title: 'Endereço' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notificações' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Configurações' }}
      />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  const status = useAppSelector((state) => state.auth.status);
  const theme = useTheme();

  const navigationTheme = useMemo<Theme>(() => {
    const base = theme.dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.primary,
      },
    };
  }, [theme]);

  if (status === 'checking') return <SplashView />;

  return (
    <NavigationContainer
      theme={navigationTheme}
      linking={status === 'authenticated' ? linking : undefined}
    >
      {status === 'authenticated' ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
