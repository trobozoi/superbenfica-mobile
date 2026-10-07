import { customerService } from '@/services/api/customer.service';

import { describeApi, itWrites, useSharedSession } from './helpers';

describeApi('Cliente e endereços (API real)', () => {
  beforeAll(useSharedSession);

  it('retorna o cadastro de cliente do usuário logado', async () => {
    const cliente = await customerService.getProfile();
    expect(cliente.email).toBe(process.env.TEST_USER_EMAIL?.toLowerCase());
    expect(Array.isArray(cliente.enderecos)).toBe(true);
  });

  it('lista apenas os próprios endereços', async () => {
    const [cliente, enderecos] = await Promise.all([
      customerService.getProfile(),
      customerService.listAddresses(),
    ]);
    expect(enderecos.every((e) => e.cliente === cliente.id)).toBe(true);
  });

  itWrites('cria, edita e remove um endereço', async () => {
    const cliente = await customerService.getProfile();
    const criado = await customerService.createAddress({
      cliente: cliente.id,
      endereco: 'Rua Teste de Integração',
      numero: '123',
      complemento: '',
      bairro: 'Centro',
      cidade: 'Fortaleza',
      estado: 'CE',
      cep: '60060170',
      principal: false,
    });
    try {
      expect(criado.cep).toBe('60060-170'); // normalizado pelo backend

      const editado = await customerService.updateAddress(criado.id, { numero: '456' });
      expect(editado.numero).toBe('456');
    } finally {
      await customerService.deleteAddress(criado.id);
    }
    const restantes = await customerService.listAddresses();
    expect(restantes.some((e) => e.id === criado.id)).toBe(false);
  });

  it('validação da API vira erro de campo', async () => {
    const cliente = await customerService.getProfile();
    // CEP vazio: rejeitado sem gravar nada.
    await expect(
      customerService.createAddress({
        cliente: cliente.id,
        endereco: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        principal: false,
      }),
    ).rejects.toMatchObject({
      status: 400,
      fieldErrors: expect.objectContaining({ endereco: expect.any(String) }),
    });
  });
});
