import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Alert, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useApiQuery } from '@/hooks/useApiQuery';
import type { AppScreenProps } from '@/navigation/types';
import { customerService } from '@/services/api/customer.service';
import { toApiError } from '@/services/api/errors';
import { enqueue } from '@/services/offline/offlineQueue';
import type { Endereco } from '@/types/api';

export function AddressesScreen({ navigation }: Readonly<AppScreenProps<'Addresses'>>) {
  const { data, loading, error, refetch } = useApiQuery(() => customerService.listAddresses(), [], {
    cacheKey: 'enderecos',
  });

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const remove = (address: Endereco) =>
    Alert.alert('Remover endereço', `${address.endereco}, ${address.numero}`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await customerService.deleteAddress(address.id);
          } catch (err) {
            const apiError = toApiError(err);
            if (!apiError.isNetworkError) {
              Alert.alert('Erro', apiError.message);
              return;
            }
            // Sem internet: remove quando a conexão voltar.
            await enqueue({ type: 'address.delete', payload: { id: address.id } });
            Alert.alert('Sem conexão', 'O endereço será removido quando a internet voltar.');
          }
          await refetch();
        },
      },
    ]);

  if (loading) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} onRetry={() => void refetch()} />;

  return (
    <Screen
      scroll
      footer={
        <Button title="Adicionar endereço" onPress={() => navigation.navigate('AddressForm')} />
      }
    >
      {data?.length === 0 && (
        <EmptyState
          icon="location-outline"
          title="Nenhum endereço"
          message="Cadastre um endereço para receber em casa."
        />
      )}
      {data?.map((address) => (
        <Card key={address.id}>
          <AppText bold>
            {address.endereco}, {address.numero}
            {address.principal ? '  ·  Principal' : ''}
          </AppText>
          {!!address.complemento && <AppText tone="muted">{address.complemento}</AppText>}
          <AppText tone="muted">
            {address.bairro} · {address.cidade}/{address.estado} · {address.cep}
          </AppText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              title="Editar"
              variant="secondary"
              onPress={() => navigation.navigate('AddressForm', { address })}
            />
            <Button title="Remover" variant="ghost" onPress={() => remove(address)} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
