const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const express = require('express');
const jwt = require('jsonwebtoken');

// Routers, middleware JWT e consultas HTTP reais; somente a persistência
// é substituída para nunca escrever no Supabase durante os testes.
const secret = 'segredo-exclusivo-dos-testes-de-pedidos';
process.env.JWT_SECRET = secret;
let cestas, produtos, falhas, consultas, escritas, tabelas, eventoPublicado;
let api, catalogo, base;
const token = jwt.sign({ sub: 'cliente-1', nome: 'Ana', email: 'ana@example.test', perfil: 'cliente' }, secret);

function bancoFalso(tabela) {
  let inserir, carrinhoId;
  const consulta = {
    insert(valor) { inserir = valor; return consulta; },
    select() { return consulta; },
    eq(campo, valor) { assert.equal(campo, 'carrinho_id'); carrinhoId = valor; return consulta; },
    async executar(unico = false) {
      if (inserir !== undefined) {
        escritas.push({ tabela, dados: structuredClone(inserir) });
        const linhas = (Array.isArray(inserir) ? inserir : [inserir]).map((linha) => ({
          id: String((tabelas[tabela] || []).length + 1), ...linha
        }));
        (tabelas[tabela] ||= []).push(...linhas);
        return { data: unico ? linhas[0] : linhas, error: null };
      }
      const linhas = (tabelas[tabela] || []).filter((linha) => String(linha.carrinho_id) === carrinhoId);
      return { data: linhas, error: null };
    },
    single() { return consulta.executar(true); },
    then(resolve, reject) { return consulta.executar().then(resolve, reject); }
  };
  return consulta;
}

async function iniciar(app) {
  const servidor = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => servidor.once('listening', resolve));
  return servidor;
}

before(async () => {
  const appCatalogo = express();
  for (const recurso of ['cestas', 'produtos']) {
    appCatalogo.get(`/${recurso}/:id`, (req, res) => {
      consultas.push(`${recurso}/${req.params.id}`);
      if (falhas[recurso]) return res.status(falhas[recurso]).json({ mensagem: 'indisponível' });
      const registro = (recurso === 'cestas' ? cestas : produtos)[req.params.id];
      return registro ? res.json(registro) : res.status(404).json({ mensagem: 'não encontrado' });
    });
  }
  catalogo = await iniciar(appCatalogo);
  const origem = `http://127.0.0.1:${catalogo.address().port}`;
  process.env.CATALOGO_CESTAS_API_URL = `${origem}/cestas`;
  process.env.PRODUTOS_API_URL = `${origem}/produtos`;

  const database = path.resolve(__dirname, '../dist/database.js');
  require.cache[database] = { id: database, filename: database, loaded: true, exports: { supabase: { from: bancoFalso } } };
  // A criação nunca deve publicar PedidoEfetivado, mesmo com status forjado.
  require('axios').post = async () => { eventoPublicado = true; throw new Error('Publicação indevida'); };
  const app = express();
  app.set('env', 'test');
  app.use(express.json());
  app.use('/pedidos', require('../dist/routes/pedido.routes.js').default);
  api = await iniciar(app);
  base = `http://127.0.0.1:${api.address().port}`;
});

after(async () => {
  await Promise.all([api, catalogo].filter(Boolean).map((server) => new Promise((resolve) => server.close(resolve))));
});

beforeEach(() => {
  cestas = { '1': { id: '1', precoBase: 75, preco: 75, ativa: true } };
  produtos = { '2': { id: '2', preco: 7.9, quantidadeEstoque: 10, ativo: true } };
  falhas = {}; consultas = []; escritas = []; tabelas = {}; eventoPublicado = false;
});

async function criar(corpo, autorizacao = token) {
  const resposta = await fetch(`${base}/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(autorizacao ? { Authorization: `Bearer ${autorizacao}` } : {}) },
    body: JSON.stringify(corpo)
  });
  const texto = await resposta.text();
  let dados;
  try { dados = JSON.parse(texto); } catch { dados = texto; }
  return { status: resposta.status, corpo: dados };
}

function venda() { return escritas.find((escrita) => escrita.tabela === 'vendas_cestas').dados; }

test('recalcula preços forjados e ignora status/pagamento escolhidos pelo cliente', async () => {
  const resposta = await criar({
    cestaId: '1', valorTotal: 0.01, preco_pago: 0.01, status: 'entregue', pago: true,
    itens: [{ produtoId: '2', quantidade: 2, precoUnitario: 0.01 }]
  });
  assert.equal(resposta.status, 201);
  assert.equal(resposta.corpo.valorTotal, 90.8);
  assert.equal(venda().preco_pago, 90.8);
  assert.equal(venda().status, 'pendente');
  assert.equal(venda().pago, false);
  assert.equal(resposta.corpo.status, 'pendente');
  assert.equal(resposta.corpo.pago, false);
  assert.equal(eventoPublicado, false);
});

test('cria cesta sem valorTotal, sem adicionais e com identidade do JWT', async () => {
  const resposta = await criar({ cestaId: 1 });
  assert.equal(resposta.status, 201);
  assert.equal(resposta.corpo.valorTotal, 75);
  assert.equal(venda().email_cliente, 'ana@example.test');
  assert.equal(venda().cliente_nome, 'Ana');
  assert.deepEqual(consultas, ['cestas/1']);
});

test('multiplica a quantidade de cestas e calcula adicionais em centavos', async () => {
  cestas['1'].precoBase = 0.1;
  produtos['2'].preco = 0.2;
  const resposta = await criar({ cestaId: '1', quantidade: 3, itens: [{ produtoId: '2', quantidade: 3 }] });
  assert.equal(resposta.status, 201);
  assert.equal(resposta.corpo.valorTotal, 0.9);
});

test('agrega linhas repetidas e usa uma consulta por produto', async () => {
  const resposta = await criar({ cestaId: '1', itens: [{ produtoId: 2, quantidade: 1 }, { produtoId: '02', quantidade: 2 }] });
  assert.equal(resposta.status, 201);
  assert.equal(resposta.corpo.valorTotal, 98.7);
  assert.equal(consultas.filter((url) => url === 'produtos/2').length, 1);
  assert.deepEqual(tabelas.carrinho_itens_adicionais.map(({ item_id, quantidade }) => ({ item_id, quantidade })), [{ item_id: '2', quantidade: 3 }]);
});

for (const quantidade of [-3, 0, 1.5, '2', null, true, 2147483648]) {
  test(`rejeita quantidade adicional inválida (${JSON.stringify(quantidade)}) antes de gravar`, async () => {
    const resposta = await criar({ cestaId: '1', itens: [{ produtoId: '2', quantidade }] });
    assert.equal(resposta.status, 400);
    assert.equal(escritas.length, 0);
    assert.equal(consultas.length, 0);
  });
}

test('rejeita o payload completo da exploração original sem gravar', async () => {
  const resposta = await criar({ cestaId: '1', valorTotal: 0.01, status: 'entregue', pago: true, itens: [{ produtoId: '2', quantidade: -3 }] });
  assert.equal(resposta.status, 400);
  assert.equal(escritas.length, 0);
});

for (const quantidade of [-1, 0, 0.5, '2', null]) {
  test(`rejeita quantidade de cestas inválida (${JSON.stringify(quantidade)})`, async () => {
    assert.equal((await criar({ cestaId: '1', quantidade })).status, 400);
    assert.equal(escritas.length, 0);
  });
}

for (const corpo of [null, [], {}, { cestaId: {} }, { cestaId: '../eventos' }, { cestaId: 0 }, { cestaId: '1', itens: {} }, { cestaId: '1', itens: null }, { cestaId: '1', itens: [null] }, { cestaId: '1', itens: [{ produtoId: '2' }] }, { cestaId: '1', clienteNome: {} }, { cestaId: '1', telefone: 'abc' }]) {
  test(`rejeita estrutura inválida (${JSON.stringify(corpo)})`, async () => {
    assert.equal((await criar(corpo)).status, 400);
    assert.equal(escritas.length, 0);
  });
}

test('rejeita cesta inexistente antes de gravar', async () => {
  assert.equal((await criar({ cestaId: '999' })).status, 404);
  assert.equal(escritas.length, 0);
});

test('rejeita produto inexistente antes de gravar', async () => {
  assert.equal((await criar({ cestaId: '1', itens: [{ produtoId: '999', quantidade: 1 }] })).status, 404);
  assert.equal(escritas.length, 0);
});

test('rejeita cesta inativa', async () => {
  cestas['1'].ativa = false;
  assert.equal((await criar({ cestaId: '1' })).status, 409);
  assert.equal(escritas.length, 0);
});

test('soma quantidades repetidas para verificar estoque', async () => {
  const resposta = await criar({ cestaId: '1', itens: [{ produtoId: '2', quantidade: 6 }, { produtoId: '2', quantidade: 6 }] });
  assert.equal(resposta.status, 409);
  assert.equal(escritas.length, 0);
});

test('rejeita produto sem estoque ou desativado', async () => {
  produtos['2'].quantidadeEstoque = 0;
  assert.equal((await criar({ cestaId: '1', itens: [{ produtoId: '2', quantidade: 1 }] })).status, 409);
  produtos['2'].quantidadeEstoque = 10;
  produtos['2'].ativo = false;
  assert.equal((await criar({ cestaId: '1', itens: [{ produtoId: '2', quantidade: 1 }] })).status, 409);
  assert.equal(escritas.length, 0);
});

test('falha de catálogo não usa o preço do cliente nem deixa carrinho gravado', async () => {
  falhas.cestas = 500;
  assert.equal((await criar({ cestaId: '1', valorTotal: 75 })).status, 503);
  assert.equal(escritas.length, 0);
});

test('falha de produtos não usa precoUnitario do cliente', async () => {
  falhas.produtos = 500;
  assert.equal((await criar({ cestaId: '1', itens: [{ produtoId: '2', quantidade: 1, precoUnitario: 7.9 }] })).status, 503);
  assert.equal(escritas.length, 0);
});

test('recusa preço de catálogo inválido e total fora do limite do banco', async () => {
  cestas['1'].precoBase = -1;
  assert.equal((await criar({ cestaId: '1' })).status, 502);
  cestas['1'].precoBase = 99999999.99;
  assert.equal((await criar({ cestaId: '1', quantidade: 2 })).status, 400);
  assert.equal(escritas.length, 0);
});

test('criação continua exigindo JWT e cliente não pode alterar preço/status depois', async () => {
  assert.equal((await criar({ cestaId: '1' }, null)).status, 401);
  for (const [metodo, rota] of [['PUT', '/pedidos/1'], ['PATCH', '/pedidos/1/status']]) {
    const resposta = await fetch(base + rota, { method: metodo, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ valorTotal: 0.01, status: 'entregue' }) });
    assert.equal(resposta.status, 403);
  }
  assert.equal(escritas.length, 0);
});
