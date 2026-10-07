import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FormTextField } from '@/components/ui/FormTextField';
import { Screen } from '@/components/ui/Screen';
import type { AppScreenProps } from '@/navigation/types';
import { customerService } from '@/services/api/customer.service';
import { toApiError } from '@/services/api/errors';
import { fetchWithOfflineCache } from '@/services/offline/offlineCache';
import { enqueue } from '@/services/offline/offlineQueue';
import type { EnderecoPayload } from '@/types/api';
import { maskCep } from '@/utils/format';
import { addressSchema, type AddressForm } from '@/utils/validation';

const FIELDS = ['cep', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'estado'] as const;

export function AddressFormScreen({ navigation, route }: Readonly<AppScreenProps<'AddressForm'>>) {
  const existing = route.params?.address;
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, setError } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      cep: existing?.cep ?? '',
      endereco: existing?.endereco ?? '',
      numero: existing?.numero ?? '',
      complemento: existing?.complemento ?? '',
      bairro: existing?.bairro ?? '',
      cidade: existing?.cidade ?? 'Fortaleza',
      estado: existing?.estado ?? 'CE',
      principal: existing?.principal ?? false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    try {
      const parsed = addressSchema.parse(values);
      if (existing) {
        await customerService.updateAddress(existing.id, parsed);
      } else {
        // O id do cliente fica em cache para permitir cadastrar offline.
        const { data: profile } = await fetchWithOfflineCache('cliente', () =>
          customerService.getProfile(),
        );
        await saveNew({ ...parsed, cliente: profile.id });
      }
      navigation.goBack();
    } catch (error) {
      const apiError = toApiError(error);
      FIELDS.forEach((field) => {
        const message = apiError.fieldErrors[field];
        if (message) setError(field, { message });
      });
      Alert.alert('Não foi possível salvar', apiError.message);
    } finally {
      setSaving(false);
    }
  });

  return (
    <Screen scroll footer={<Button title="Salvar" onPress={onSubmit} loading={saving} />}>
      <FormTextField
        control={control}
        name="cep"
        label="CEP"
        keyboardType="number-pad"
        mask={maskCep}
      />
      <FormTextField
        control={control}
        name="endereco"
        label="Rua / Avenida"
        autoComplete="street-address"
      />
      <View style={styles.row}>
        <View style={styles.small}>
          <FormTextField control={control} name="numero" label="Número" />
        </View>
        <View style={styles.flex}>
          <FormTextField control={control} name="complemento" label="Complemento" />
        </View>
      </View>
      <FormTextField control={control} name="bairro" label="Bairro" />
      <View style={styles.row}>
        <View style={styles.flex}>
          <FormTextField control={control} name="cidade" label="Cidade" />
        </View>
        <View style={styles.small}>
          <FormTextField
            control={control}
            name="estado"
            label="UF"
            autoCapitalize="characters"
            maxLength={2}
          />
        </View>
      </View>
      <Controller
        control={control}
        name="principal"
        render={({ field }) => (
          <View style={styles.switchRow}>
            <AppText>Endereço principal</AppText>
            <Switch
              value={field.value}
              onValueChange={field.onChange}
              accessibilityLabel="Endereço principal"
            />
          </View>
        )}
      />
    </Screen>
  );
}

/** Cria o endereço; sem internet, deixa na fila para enviar depois. */
async function saveNew(payload: EnderecoPayload): Promise<void> {
  try {
    await customerService.createAddress(payload);
  } catch (error) {
    if (!toApiError(error).isNetworkError) throw error;
    await enqueue({ type: 'address.create', payload });
    Alert.alert('Sem conexão', 'O endereço será enviado quando a internet voltar.');
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  small: { width: 100 },
  row: { flexDirection: 'row', gap: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
