import { View } from 'react-native';

import { spacing } from '@/theme';

/** Espaço entre itens de listas (componente estável: não recria a cada render). */
export function ListSeparator() {
  return <View style={{ height: spacing.md }} />;
}

export function SmallListSeparator() {
  return <View style={{ height: spacing.sm }} />;
}
