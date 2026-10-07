/**
 * Recuperação de senha.
 * TODO: o backend ainda não tem esse endpoint. Enquanto isso, um 404 da API
 * é tratado com uma mensagem orientando o cliente a procurar a loja.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FormTextField } from '@/components/ui/FormTextField';
import { Screen } from '@/components/ui/Screen';
import { authService } from '@/services/api/auth.service';
import { toApiError } from '@/services/api/errors';
import { forgotPasswordSchema, type ForgotPasswordForm } from '@/utils/validation';

const NOT_AVAILABLE =
  'A recuperação de senha pelo app ainda não está disponível. Procure o atendimento da sua loja.';

export function ForgotPasswordScreen() {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const { control, handleSubmit } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setLoading(true);
    setFeedback(null);
    try {
      await authService.requestPasswordReset(email);
      // Mensagem neutra: não revela se o e-mail está cadastrado.
      setFeedback({
        ok: true,
        text: 'Se o e-mail estiver cadastrado, você receberá as instruções.',
      });
    } catch (error) {
      const apiError = toApiError(error);
      setFeedback({ ok: false, text: apiError.status === 404 ? NOT_AVAILABLE : apiError.message });
    } finally {
      setLoading(false);
    }
  });

  return (
    <Screen scroll>
      <AppText tone="muted">Informe o e-mail da sua conta.</AppText>
      <FormTextField
        control={control}
        name="email"
        label="E-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      {feedback && (
        <AppText tone={feedback.ok ? 'success' : 'danger'} accessibilityRole="alert">
          {feedback.text}
        </AppText>
      )}
      <Button title="Enviar" onPress={onSubmit} loading={loading} />
    </Screen>
  );
}
