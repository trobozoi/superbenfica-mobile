import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { CartScreen } from '@/screens/cart/CartScreen';
import { ExploreScreen } from '@/screens/explore/ExploreScreen';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { OrdersScreen } from '@/screens/orders/OrdersScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { useAppSelector } from '@/store/hooks';
import { selectCartCount } from '@/store/slices/cartSlice';
import { useTheme } from '@/theme/ThemeProvider';

import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<keyof MainTabParamList, [IconName, IconName]> = {
  Home: ['home', 'home-outline'],
  Explore: ['search', 'search-outline'],
  Cart: ['cart', 'cart-outline'],
  Orders: ['receipt', 'receipt-outline'],
  Profile: ['person', 'person-outline'],
};

interface TabIconProps {
  focused: boolean;
  color: string;
  size: number;
}

/** Fábrica do ícone de cada aba (fora do componente, para não recriar componentes a cada render). */
function tabIcon(routeName: keyof MainTabParamList) {
  const [active, inactive] = ICONS[routeName];
  return function TabIcon({ focused, color, size }: Readonly<TabIconProps>) {
    return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
  };
}

const TAB_ICONS = {
  Home: tabIcon('Home'),
  Explore: tabIcon('Explore'),
  Cart: tabIcon('Cart'),
  Orders: tabIcon('Orders'),
  Profile: tabIcon('Profile'),
} satisfies Record<keyof MainTabParamList, ReturnType<typeof tabIcon>>;

export function MainTabs() {
  const { colors } = useTheme();
  const cartCount = useAppSelector(selectCartCount);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: TAB_ICONS[route.name],
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Início', headerShown: false }}
      />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: 'Explorar' }} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: 'Carrinho', tabBarBadge: cartCount > 0 ? cartCount : undefined }}
      />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'Pedidos' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
