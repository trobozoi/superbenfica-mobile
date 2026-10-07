import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FormTextField } from '@/components/ui/FormTextField';
import { Screen } from '@/components/ui/Screen';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuthError, register } from '@/store/slices/authSlice';
import { maskPhone } from '@/utils/format';
import { registerSchema, type RegisterForm } from '@/utils/validation';

const API_FIELDS = ['nome', 'email', 'telefone', 'password'] as const;

export function RegisterScreen() {
  const dispatch = useAppDispatch();
  const { loading, error, fieldErrors } = useAppSelector((state) => state.auth);

  const { control, handleSubmit, setError } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nome: '', email: '', telefone: '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    for (const field of API_FIELDS) {
      const message = fieldErrors[field];
      if (message) setError(field, { message });
    }
  }, [fieldErrors, setError]);

  useEffect(
    () => () => {
      dispatch(clearAuthError());
    },
    [dispatch],
  );

  const onSubmit = handleSubmit(({ confirmPassword: _confirm, ...values }) => {
    void dispatch(register(values));
  });

  const hasFieldError = API_FIELDS.some((field) => fieldErrors[field]);

  return (
    <Screen scroll>
      {!!error && !hasFieldError && (
        <AppText tone="danger" accessibilityRole="alert">
          {error}
        </AppText>
      )}
      <FormTextField control={control} name="nome" label="Nome completo" autoComplete="name" />
      <FormTextField
        control={control}
        name="email"
        label="E-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <FormTextField
        control={control}
        name="telefone"
        label="Telefone (opcional)"
        keyboardType="phone-pad"
        autoComplete="tel"
        mask={maskPhone}
      />
      <FormTextField
        control={control}
        name="password"
        label="Senha"
        password
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <FormTextField
        control={control}
        name="confirmPassword"
        label="Confirmar senha"
        password
        autoComplete="new-password"
      />
      <Button title="Criar conta" onPress={onSubmit} loading={loading} />
    </Screen>
  );
}
