/**
 * Tela de exemplo completa: formulário com React Hook Form + Zod,
 * erros de campo vindos da API, loading, acessibilidade e tema.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FormTextField } from '@/components/ui/FormTextField';
import { Screen } from '@/components/ui/Screen';
import type { AuthScreenProps } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuthError, login } from '@/store/slices/authSlice';
import { useTheme } from '@/theme/ThemeProvider';
import { loginSchema, type LoginForm } from '@/utils/validation';

export function LoginScreen({ navigation }: Readonly<AuthScreenProps<'Login'>>) {
  const dispatch = useAppDispatch();
  const { loading, error, fieldErrors } = useAppSelector((state) => state.auth);
  const { colors, spacing } = useTheme();

  const { control, handleSubmit, setError } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Erros de campo retornados pela API aparecem no próprio input.
  useEffect(() => {
    for (const field of ['email', 'password'] as const) {
      const message = fieldErrors[field];
      if (message) setError(field, { message });
    }
  }, [fieldErrors, setError]);

  // Limpa a mensagem de erro ao sair da tela.
  useEffect(() => () => void dispatch(clearAuthError()), [dispatch]);

  const onSubmit = handleSubmit((values) => {
    void dispatch(login(values));
  });

  return (
    <Screen scroll edges={['top', 'bottom', 'left', 'right']} contentStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="title" tone="primary" center>
          Super Benfica
        </AppText>
        <AppText tone="muted" center>
          Entre para fazer suas compras
        </AppText>
      </View>

      {!!error && (
        <View
          accessibilityRole="alert"
          style={[
            styles.alert,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.danger, padding: spacing.md },
          ]}
        >
          <AppText tone="danger">{error}</AppText>
        </View>
      )}

      <FormTextField
        control={control}
        name="email"
        label="E-mail"
        placeholder="voce@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        testID="login-email"
      />
      <FormTextField
        control={control}
        name="password"
        label="Senha"
        password
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
        testID="login-password"
      />

      <Button
        title="Esqueci minha senha"
        variant="ghost"
        onPress={() => navigation.navigate('ForgotPassword')}
        style={styles.forgot}
      />
      <Button title="Entrar" onPress={onSubmit} loading={loading} testID="login-submit" />
      <Button
        title="Criar conta"
        variant="secondary"
        onPress={() => navigation.navigate('Register')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center' },
  header: { gap: 8, marginBottom: 16 },
  alert: { borderWidth: 1, borderRadius: 10 },
  forgot: { alignSelf: 'flex-end', minHeight: 32 },
});
