/** Estados padrão de tela: carregando, erro e vazio. */
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';
import { Button } from './Button';

type IconName = keyof typeof Ionicons.glyphMap;

export function LoadingState({ message }: Readonly<{ message?: string }>) {
  const { colors } = useTheme();
  return (
    <View style={styles.center} accessibilityLabel={message ?? 'Carregando'}>
      <ActivityIndicator size="large" color={colors.primary} />
      {!!message && <AppText tone="muted">{message}</AppText>}
    </View>
  );
}

interface MessageStateProps {
  title: string;
  message?: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
}

function MessageState({
  title,
  message,
  icon,
  actionLabel,
  onAction,
}: Readonly<MessageStateProps>) {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      {icon && <Ionicons name={icon} size={48} color={colors.textMuted} />}
      <AppText variant="subtitle" center>
        {title}
      </AppText>
      {!!message && (
        <AppText tone="muted" center>
          {message}
        </AppText>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="secondary" />
      )}
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: Readonly<{ message: string; onRetry?: () => void }>) {
  return (
    <MessageState
      icon="alert-circle-outline"
      title="Ops! Algo deu errado"
      message={message}
      actionLabel={onRetry ? 'Tentar novamente' : undefined}
      onAction={onRetry}
    />
  );
}

export function EmptyState(props: Readonly<MessageStateProps>) {
  return <MessageState icon="file-tray-outline" {...props} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
});
