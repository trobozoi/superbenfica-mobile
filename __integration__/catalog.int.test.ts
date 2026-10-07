import { catalogService } from '@/services/api/catalog.service';
import { toCents } from '@/utils/money';

import { describeApi, useSharedSession } from './helpers';

describeApi('Catálogo (API real)', () => {
  beforeAll(useSharedSession);

  it('lista produtos paginados com o formato esperado', async () => {
    const page = await catalogService.listProducts();
    expect(page.count).toBeGreaterThan(0);
    expect(page.results.length).toBeGreaterThan(0);

    const produto = page.results[0]!;
    expect(produto).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        nome: expect.any(String),
        preco: expect.stringMatching(/^\d+\.\d{2}$/),
        categoria: expect.any(String),
        ativo: true,
      }),
    );
    expect(toCents(produto.preco)).toBeGreaterThan(0);
  });

  it('filtra por categoria', async () => {
    const page = await catalogService.listProducts({ categoria: 'BEBIDAS' });
    expect(page.results.every((p) => p.categoria === 'BEBIDAS')).toBe(true);
  });

  it('busca por nome', async () => {
    const all = await catalogService.listProducts();
    const termo = all.results[0]!.nome.split(' ')[0]!;
    const found = await catalogService.listProducts({ search: termo });
    expect(found.results.length).toBeGreaterThan(0);
  });

  it('ordena por preço', async () => {
    const page = await catalogService.listProducts({ ordering: 'preco' });
    const precos = page.results.map((p) => toCents(p.preco));
    expect(precos).toEqual([...precos].sort((a, b) => a - b));
  });

  it('pagina (2ª página não repete a 1ª)', async () => {
    const first = await catalogService.listProducts({ page: 1 });
    if (!first.next) return; // catálogo pequeno: só uma página
    const second = await catalogService.listProducts({ page: 2 });
    const ids = new Set(first.results.map((p) => p.id));
    expect(second.results.some((p) => ids.has(p.id))).toBe(false);
  });

  it('detalhe de produto', async () => {
    const { results } = await catalogService.listProducts();
    const produto = await catalogService.getProduct(results[0]!.id);
    expect(produto.id).toBe(results[0]!.id);
  });

  it('produto inexistente retorna 404', async () => {
    await expect(catalogService.getProduct(999_999)).rejects.toMatchObject({ status: 404 });
  });

  it('lista lojas ativas e formas de pagamento ativas', async () => {
    const [lojas, formas] = await Promise.all([
      catalogService.listStores(),
      catalogService.listPaymentMethods(),
    ]);
    expect(lojas.length).toBeGreaterThan(0);
    expect(lojas.every((l) => l.ativa)).toBe(true);
    expect(formas.length).toBeGreaterThan(0);
    expect(formas.every((f) => f.ativa)).toBe(true);
  });
});
