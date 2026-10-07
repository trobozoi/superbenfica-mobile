/**
 * Checkout: loja, forma de entrega, endereço, pagamento e confirmação.
 * O total final é calculado pelo backend; aqui mostramos a estimativa.
 * Pagamento online é placeholder: a forma escolhida é paga na entrega/retirada.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { FormTextField } from '@/components/ui/FormTextField';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useApiQuery } from '@/hooks/useApiQuery';
import type { AppScreenProps } from '@/navigation/types';
import { catalogService } from '@/services/api/catalog.service';
import { customerService } from '@/services/api/customer.service';
import { toApiError } from '@/services/api/errors';
import { ordersService } from '@/services/api/orders.service';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearCart, selectCartItems, selectCartTotalCents } from '@/store/slices/cartSlice';
import type { TipoEntrega } from '@/types/api';
import { formatTime, TIPO_ENTREGA_LABEL } from '@/utils/format';
import { formatCents } from '@/utils/money';
import { checkoutSchema, type CheckoutForm } from '@/utils/validation';

const TIPOS_ENTREGA: TipoEntrega[] = ['RETIRADA', 'DOMICILIO'];

export function CheckoutScreen({ navigation }: Readonly<AppScreenProps<'Checkout'>>) {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const totalCents = useAppSelector(selectCartTotalCents);
  const userStore = useAppSelector((state) => state.auth.user?.loja ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const options = useApiQuery(
    async () => {
      const [stores, payments] = await Promise.all([
        catalogService.listStores(),
        catalogService.listPaymentMethods(),
      ]);
      return { stores, payments };
    },
    [],
    { cacheKey: 'checkout:opcoes' },
  );
  const addresses = useApiQuery(() => customerService.listAddresses(), []);

  // Recarrega os endereços ao voltar do cadastro de endereço.
  useFocusEffect(
    useCallback(() => {
      void addresses.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao ganhar foco
    }, []),
  );

  const { control, handleSubmit, setValue, formState } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      loja: userStore ?? undefined,
      formaPagamento: undefined,
      tipoEntrega: 'RETIRADA',
      endereco: null,
      observacao: '',
    },
  });
  const tipoEntrega = useWatch({ control, name: 'tipoEntrega' });

  // Pré-seleciona o endereço principal.
  useEffect(() => {
    const principal = addresses.data?.find((a) => a.principal) ?? addresses.data?.[0];
    if (principal) setValue('endereco', principal.id);
  }, [addresses.data, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await ordersService.create({
        loja: values.loja,
        forma_pagamento: values.formaPagamento,
        tipo_entrega: values.tipoEntrega,
        endereco: values.tipoEntrega === 'DOMICILIO' ? values.endereco : null,
        observacao: values.observacao,
        itens: items.map((item) => ({ produto: item.product.id, quantidade: item.quantity })),
      });
      dispatch(clearCart());
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Tabs', params: { screen: 'Orders' } },
          { name: 'OrderTracking', params: { orderId: order.id } },
        ],
      });
    } catch (error) {
      const apiError = toApiError(error);
      // 409 = estoque insuficiente ou produto indisponível na loja escolhida.
      const message =
        apiError.status === 409
          ? `${apiError.message}\nAjuste o carrinho ou escolha outra loja.`
          : apiError.message;
      setSubmitError(message);
      Alert.alert('Não foi possível concluir', message);
    } finally {
      setSubmitting(false);
    }
  });

  if (options.loading) return <LoadingState message="Carregando opções..." />;
  if (!options.data) {
    return (
      <ErrorState
        message={options.error ?? 'Erro ao carregar.'}
        onRetry={() => void options.refetch()}
      />
    );
  }
  const { stores, payments } = options.data;

  return (
    <Screen
      scroll
      footer={
        <View style={styles.gap}>
          <View style={styles.row}>
            <AppText variant="subtitle">Total estimado</AppText>
            <AppText variant="subtitle" tone="primary">
              {formatCents(totalCents)}
            </AppText>
          </View>
          <Button
            title="Confirmar pedido"
            onPress={onSubmit}
            loading={submitting}
            disabled={items.length === 0}
          />
        </View>
      }
    >
      <Section title="Loja" error={formState.errors.loja?.message}>
        <Controller
          control={control}
          name="loja"
          render={({ field }) => (
            <View style={styles.gap}>
              {stores.map((store) => (
                <Card
                  key={store.id}
                  onPress={() => field.onChange(store.id)}
                  style={field.value === store.id ? styles.selected : undefined}
                >
                  <AppText bold={field.value === store.id}>
                    {field.value === store.id ? '● ' : '○ '}
                    {store.nome}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {store.endereco} · {formatTime(store.horario_abertura)}–
                    {formatTime(store.horario_fechamento)}
                  </AppText>
                </Card>
              ))}
            </View>
          )}
        />
      </Section>

      <Section title="Entrega">
        <Controller
          control={control}
          name="tipoEntrega"
          render={({ field }) => (
            <View style={styles.chips}>
              {TIPOS_ENTREGA.map((tipo) => (
                <Chip
                  key={tipo}
                  label={TIPO_ENTREGA_LABEL[tipo]}
                  selected={field.value === tipo}
                  onPress={() => field.onChange(tipo)}
                />
              ))}
            </View>
          )}
        />
      </Section>

      {tipoEntrega === 'DOMICILIO' && (
        <Section title="Endereço de entrega" error={formState.errors.endereco?.message}>
          <Controller
            control={control}
            name="endereco"
            render={({ field }) => (
              <View style={styles.gap}>
                {addresses.loading && <LoadingState />}
                {addresses.data?.map((address) => (
                  <Card key={address.id} onPress={() => field.onChange(address.id)}>
                    <AppText bold={field.value === address.id}>
                      {field.value === address.id ? '● ' : '○ '}
                      {address.endereco}, {address.numero}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {address.bairro} · {address.cidade}/{address.estado} · {address.cep}
                    </AppText>
                  </Card>
                ))}
                <Button
                  title="Adicionar endereço"
                  variant="secondary"
                  onPress={() => navigation.navigate('AddressForm')}
                />
              </View>
            )}
          />
        </Section>
      )}

      <Section
        title="Pagamento (na entrega/retirada)"
        error={formState.errors.formaPagamento?.message}
      >
        <Controller
          control={control}
          name="formaPagamento"
          render={({ field }) => (
            <View style={styles.chips}>
              {payments.map((payment) => (
                <Chip
                  key={payment.id}
                  label={payment.nome}
                  selected={field.value === payment.id}
                  onPress={() => field.onChange(payment.id)}
                />
              ))}
            </View>
          )}
        />
        {/* TODO: integrar pagamento online (Pix/cartão) quando o backend suportar. */}
      </Section>

      <FormTextField
        control={control}
        name="observacao"
        label="Observação (opcional)"
        placeholder="Ex.: sem sacolas plásticas"
        multiline
        maxLength={500}
      />

      {!!submitError && (
        <AppText tone="danger" accessibilityRole="alert">
          {submitError}
        </AppText>
      )}
    </Screen>
  );
}

function Section({
  title,
  error,
  children,
}: Readonly<{ title: string; error?: string; children: React.ReactNode }>) {
  return (
    <View style={styles.gap}>
      <AppText variant="subtitle">{title}</AppText>
      {children}
      {!!error && (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selected: { borderWidth: 2 },
});
