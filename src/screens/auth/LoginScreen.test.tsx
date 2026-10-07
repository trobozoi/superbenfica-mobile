import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { authService } from '@/services/api/auth.service';
import { ApiError } from '@/services/api/errors';
import type { Usuario } from '@/types/api';

import { LoginScreen } from './LoginScreen';
import { renderWithProviders } from '../../../test/helpers';

jest.mock('@/services/api/auth.service', () => ({
  authService: { login: jest.fn(), me: jest.fn(), logout: jest.fn() },
}));

const mocked = jest.mocked(authService);
const navigation = { navigate: jest.fn() };

const cliente: Usuario = {
  id: 6,
  nome: 'Cláudio Cliente',
  email: 'cliente@teste.com',
  telefone: '',
  loja: 1,
  loja_nome: 'Centro',
  role: 'CLIENTE',
  is_active: true,
  data_cadastro: '',
};

function renderLogin() {
  return renderWithProviders(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- props de navegação simplificadas no teste
    <LoginScreen navigation={navigation as any} route={{ key: 'Login', name: 'Login' } as any} />,
  );
}

describe('LoginScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('valida os campos antes de chamar a API', async () => {
    await renderLogin();
    await fireEvent.press(screen.getByTestId('login-submit'));

    // E-mail e senha vazios.
    expect(await screen.findAllByText('Campo obrigatório')).toHaveLength(2);

    await fireEvent.changeText(screen.getByTestId('login-email'), 'sem-arroba');
    await fireEvent.press(screen.getByTestId('login-submit'));
    expect(await screen.findByText('E-mail inválido')).toBeTruthy();
    expect(mocked.login).not.toHaveBeenCalled();
  });

  it('faz login de cliente e autentica', async () => {
    mocked.login.mockResolvedValue({ access: 'a', refresh: 'r' });
    mocked.me.mockResolvedValue(cliente);
    const { store } = await renderLogin();

    await fireEvent.changeText(screen.getByTestId('login-email'), 'Cliente@Teste.com');
    await fireEvent.changeText(screen.getByTestId('login-password'), 'segredo');
    await fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => expect(store.getState().auth.status).toBe('authenticated'));
    expect(mocked.login).toHaveBeenCalledWith('cliente@teste.com', 'segredo');
  });

  it('mostra o erro da API', async () => {
    mocked.login.mockRejectedValue(
      new ApiError({ message: 'Usuário ou senha inválidos.', kind: 'http', status: 401 }),
    );
    await renderLogin();

    await fireEvent.changeText(screen.getByTestId('login-email'), 'a@b.com');
    await fireEvent.changeText(screen.getByTestId('login-password'), 'errada');
    await fireEvent.press(screen.getByTestId('login-submit'));

    expect(await screen.findByText('Usuário ou senha inválidos.')).toBeTruthy();
  });

  it('bloqueia funcionários (app exclusivo para clientes)', async () => {
    mocked.login.mockResolvedValue({ access: 'a', refresh: 'r' });
    mocked.me.mockResolvedValue({ ...cliente, role: 'GERENTE' });
    const { store } = await renderLogin();

    await fireEvent.changeText(screen.getByTestId('login-email'), 'gerente@b.com');
    await fireEvent.changeText(screen.getByTestId('login-password'), 'x');
    await fireEvent.press(screen.getByTestId('login-submit'));

    expect(await screen.findByText(/exclusivo para clientes/)).toBeTruthy();
    expect(mocked.logout).toHaveBeenCalled();
    expect(store.getState().auth.status).not.toBe('authenticated');
  });
});
