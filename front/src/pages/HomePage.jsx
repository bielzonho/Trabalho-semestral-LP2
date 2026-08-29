import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  carregarCestas,
  carregarProdutos,
  carregarMeusPedidos,
  criarPedido,
  formatarMoeda,
  formatarPreco,
  emailEstaVerificado,
  STATUS_LABELS,
  API_PEDIDOS_URL,
} from '../api/api';
import DecorationSVG from '../components/DecorationSVG';

export default function HomePage() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
  const token = localStorage.getItem('token');

  const [cestas, setCestas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [meusPedidos, setMeusPedidos] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);

  // Formulário de pedido
  const [nomeCliente, setNomeCliente] = useState(usuario?.nome || '');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cestaId, setCestaId] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState('');
  const [itensPedido, setItensPedido] = useState([]);
  const [telefoneErro, setTelefoneErro] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const itemIdRef = useRef(0);

  const pedidosSectionRef = useRef(null);

  useEffect(() => {
    Promise.all([carregarCestas(), carregarProdutos()]).then(([c, p]) => {
      setCestas(Array.isArray(c) ? c : []);
      setProdutos(Array.isArray(p) ? p : []);
    });
    if (token) carregarPedidosUsuario();
  }, []);

  async function carregarPedidosUsuario() {
    setLoadingPedidos(true);
    try {
      const res = await fetch(`${API_PEDIDOS_URL}/meus`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { setMeusPedidos([]); return; }
      const dados = await res.json();
      setMeusPedidos(Array.isArray(dados) ? dados : []);
    } catch {
      setMeusPedidos([]);
    } finally {
      setLoadingPedidos(false);
    }
  }

  function calcularTotal() {
    const cesta = cestas.find(c => c.id === cestaId);
    let total = Number(cesta?.preco || cesta?.precoBase || 0) * Number(quantidade || 0);
    itensPedido.forEach(item => {
      total += (item.quantidade || 0) * (item.precoUnitario || 0);
    });
    return total;
  }

  function adicionarItemDireto(produtoId, preco) {
    if (!token) {
      alert('Faça login para adicionar produtos ao pedido.');
      navigate('/login');
      return;
    }
    itemIdRef.current += 1;
    setItensPedido(prev => [...prev, {
      _key: itemIdRef.current,
      produtoId,
      quantidade: 1,
      precoUnitario: Number(preco),
    }]);
    pedidosSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function adicionarItemManual() {
    if (!produtos.length) { alert('Nenhum produto disponível para adicionar.'); return; }
    const primeiro = produtos[0];
    adicionarItemDireto(primeiro.id, primeiro.preco);
  }

  function removerItem(key) {
    setItensPedido(prev => prev.filter(i => i._key !== key));
  }

  function atualizarItem(key, campo, valor) {
    setItensPedido(prev => prev.map(i => {
      if (i._key !== key) return i;
      if (campo === 'produtoId') {
        const prod = produtos.find(p => p.id === valor);
        return { ...i, produtoId: valor, precoUnitario: Number(prod?.preco || 0) };
      }
      return { ...i, [campo]: campo === 'quantidade' ? Number(valor) : valor };
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!token) {
      alert('Você precisa estar logado para fazer um pedido.');
      navigate('/login');
      return;
    }
    if (!emailEstaVerificado()) {
      alert('Você precisa verificar seu e-mail antes de realizar pedidos.\nFaça login novamente para receber o código de verificação.');
      return;
    }
    if (telefone && !/^[0-9]+$/.test(telefone)) {
      setTelefoneErro(true);
      return;
    }
    setTelefoneErro(false);

    // Validação de estoque
    const itensInvalidos = [];
    itensPedido.forEach(item => {
      const prod = produtos.find(p => p.id === item.produtoId);
      const estoque = Number(prod?.quantidadeEstoque) || 0;
      if (prod && estoque === 0) itensInvalidos.push(`"${prod.nome}" está indisponível`);
      else if (prod && item.quantidade > estoque) itensInvalidos.push(`"${prod.nome}" tem apenas ${estoque} em estoque`);
    });
    if (itensInvalidos.length) {
      alert('Não é possível criar o pedido:\n• ' + itensInvalidos.join('\n• '));
      return;
    }

    const cesta = cestas.find(c => c.id === cestaId);
    const qtdCesta = Number(quantidade) || 1;
    let valorTotal = Number(cesta?.preco || cesta?.precoBase || 0) * qtdCesta;
    itensPedido.forEach(it => { valorTotal += it.quantidade * it.precoUnitario; });

    const payload = {
      clienteNome: nomeCliente.trim(),
      clienteTelefone: telefone.trim(),
      enderecoEntrega: endereco.trim(),
      cestaId: cestaId || null,
      quantidade: qtdCesta,
      observacoes: observacao.trim(),
      valorTotal: Number(valorTotal.toFixed(2)),
      itens: itensPedido.map(({ produtoId, quantidade, precoUnitario }) => ({ produtoId, quantidade, precoUnitario })),
    };

    setEnviando(true);
    try {
      await criarPedido(payload);
      setNomeCliente(usuario?.nome || '');
      setTelefone('');
      setEndereco('');
      setCestaId('');
      setQuantidade(1);
      setObservacao('');
      setItensPedido([]);
      alert('Pedido enviado com sucesso!');
      carregarPedidosUsuario();
    } catch (err) {
      alert(`Não foi possível criar o pedido: ${err.message}`);
    } finally {
      setEnviando(false);
    }
  }

  function fazerLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('emailVerificado');
    window.location.reload();
  }

  const imagemCesta = (nome) =>
    String(nome).toLowerCase().includes('premium') ? '/cesta_premium.jpg' : '/cesta.jpg';

  return (
    <div>
      <DecorationSVG />

      {/* ── Header ────────────────────────────────────────── */}
      <header className="site-header">
        <div className="brand">
          <strong>Grão &amp; Cesta</strong>
          <span>Café da manhã especial para presentear</span>
        </div>
        <nav className="site-nav">
          <a href="#catalogo">Catálogo</a>
          <a href="#produtos-extra">Produtos</a>
          <a href="#pedidos">Pedido</a>
          {usuario?.perfil === 'admin' && (
            <Link to="/admin" style={{ color: 'var(--gold)', fontWeight: 700 }}>Painel Admin</Link>
          )}
          {usuario ? (
            <>
              <span style={{ fontWeight: 700, color: '#444' }}>{usuario.nome}</span>
              <button className="btn btn-ghost" style={{ padding: '8px 14px' }} onClick={fazerLogout}>Sair</button>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </nav>
      </header>

      {/* ── Banner ────────────────────────────────────────── */}
      <section className="banner">
        <div>
          <h1>Café da manhã especial</h1>
          <p>Seleção de cestas para ocasiões especiais</p>
        </div>
      </section>

      <main className="container">

        {/* ── Catálogo de cestas ────────────────────────────── */}
        <section id="catalogo">
          <h2 className="section-title">Catálogo de Cestas</h2>
          <p className="section-subtitle">Veja as cestas disponíveis, com imagens, descrições e preços.</p>
          {cestas.length === 0 ? (
            <p className="empty">Nenhuma cesta encontrada.</p>
          ) : (
            <div className="grid-cestas">
              {cestas.map(cesta => (
                <article key={cesta.id} className="cesta-card">
                  <div className="cesta-imagem">
                    <img src={imagemCesta(cesta.nome)} alt={cesta.nome} />
                  </div>
                  <div className="cesta-info">
                    <h3 className="cesta-nome">{cesta.nome}</h3>
                    <p className="cesta-descricao">{cesta.descricao || 'Sem descrição.'}</p>
                    <div className="cesta-preco">R$ {formatarPreco(cesta.preco || cesta.precoBase)}</div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="section-divider" />

        {/* ── Produtos extras ───────────────────────────────── */}
        <section id="produtos-extra">
          <h2 className="section-title">Produtos Disponíveis</h2>
          <p className="section-subtitle">
            Veja os produtos disponíveis para adicionar ao seu pedido.
            Clique em <strong>+ Adicionar ao pedido</strong> para incluir na lista abaixo.
          </p>
          {produtos.length === 0 ? (
            <p className="empty">Carregando produtos...</p>
          ) : (
            <div className="grid-produtos">
              {produtos.map(p => {
                const estoque = Number(p.quantidadeEstoque) || 0;
                const indisponivel = estoque === 0;
                const estoqueBaixo = estoque > 0 && estoque < 10;
                return (
                  <div key={p.id} className="produto-card">
                    <div className="p-nome">{p.nome}</div>
                    <div className="p-desc">{p.descricao || ''}</div>
                    <div className="p-preco">{formatarMoeda(p.preco)}</div>
                    {indisponivel && <span className="badge-estoque badge-indisponivel">Indisponível</span>}
                    {estoqueBaixo && <span className="badge-estoque badge-estoque-baixo">Restam {estoque}</span>}
                    <button
                      type="button"
                      className="btn-add-produto"
                      disabled={indisponivel}
                      onClick={() => adicionarItemDireto(p.id, p.preco)}
                    >
                      {indisponivel ? 'Indisponível' : '+ Adicionar ao pedido'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="section-divider" />

        {/* ── Pedidos ───────────────────────────────────────── */}
        <section id="pedidos" ref={pedidosSectionRef}>
          <h2 className="section-title">Pedidos</h2>
          <p className="section-subtitle">Registre um pedido e acompanhe os pedidos já criados.</p>

          <div className="pedidos-wrap">

            {/* Formulário */}
            <div className="card">
              <h3>Novo pedido</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nome do cliente</label>
                  <input type="text" value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} placeholder="Ex.: Maria Silva" required />
                </div>

                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={e => { setTelefone(e.target.value); setTelefoneErro(false); }}
                    placeholder="Somente números. Ex.: 11999999999"
                    style={telefoneErro ? { borderColor: '#dc3545' } : {}}
                  />
                  {telefoneErro && <small style={{ color: '#dc3545', fontSize: 12 }}>Use somente números, sem espaços, traços ou parênteses.</small>}
                </div>

                <div className="form-group">
                  <label>Endereço de entrega</label>
                  <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, número, bairro" required />
                </div>

                <div className="form-group">
                  <label>Cesta</label>
                  <select value={cestaId} onChange={e => setCestaId(e.target.value)}>
                    <option value="">— sem cesta —</option>
                    {cestas.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nome} — R$ {formatarPreco(c.preco || c.precoBase)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantidade</label>
                  <input type="number" value={quantidade} min="1" onChange={e => setQuantidade(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>Observação</label>
                  <textarea value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Ex.: Entregar pela manhã, incluir cartão..." />
                </div>

                {/* Produtos adicionais */}
                <div className="itens-section">
                  <div className="itens-section-header">
                    <span>Produtos adicionais</span>
                    <button type="button" className="btn-add-produto" style={{ width: 'auto', padding: '5px 12px', fontSize: 12 }} onClick={adicionarItemManual}>
                      + Adicionar produto
                    </button>
                  </div>
                  <div className="itens-lista">
                    {itensPedido.length === 0 ? (
                      <p className="itens-vazio">Nenhum produto adicional. Use os botões acima ou clique em &quot;+ Adicionar produto&quot;.</p>
                    ) : (
                      itensPedido.map(item => {
                        const prod = produtos.find(p => p.id === item.produtoId);
                        return (
                          <div key={item._key} className="item-pedido-row">
                            <select value={item.produtoId} onChange={e => atualizarItem(item._key, 'produtoId', e.target.value)}>
                              {produtos.map(p => {
                                const est = Number(p.quantidadeEstoque) || 0;
                                const label = est === 0 ? `${p.nome} — Indisponível` : est < 10 ? `${p.nome} (restam ${est})` : p.nome;
                                return <option key={p.id} value={p.id} disabled={est === 0}>{label}</option>;
                              })}
                            </select>
                            <input type="number" min="1" value={item.quantidade} onChange={e => atualizarItem(item._key, 'quantidade', e.target.value)} />
                            <span className="item-subtotal">{formatarMoeda(item.quantidade * item.precoUnitario)}</span>
                            <button type="button" className="btn-remover-item" onClick={() => removerItem(item._key)}>✕</button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="total-pedido-row">
                  <span>Total estimado:</span>
                  <span className="total-valor">{formatarMoeda(calcularTotal())}</span>
                </div>

                <button className="btn btn-primary" type="submit" disabled={enviando} style={{ width: '100%' }}>
                  {enviando ? 'Enviando...' : 'Enviar pedido'}
                </button>
              </form>
            </div>

            {/* Meus pedidos */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0 }}>Meus pedidos</h3>
                <button className="btn-atualizar-pedidos" onClick={carregarPedidosUsuario}>↺ Atualizar</button>
              </div>

              {!token ? (
                <p className="empty">Faça login para ver seus pedidos.</p>
              ) : loadingPedidos ? (
                <p className="empty">Carregando...</p>
              ) : meusPedidos.length === 0 ? (
                <p className="empty">Você ainda não fez nenhum pedido.</p>
              ) : (
                meusPedidos.map(p => {
                  const cestaNome = cestas.find(c => c.id === p.cestaId)?.nome || 'Cesta não identificada';
                  const status = p.status || 'pendente';
                  const data = p.criadoEm ? new Date(p.criadoEm).toLocaleDateString('pt-BR') : '—';
                  return (
                    <div key={p.id} className="meu-pedido">
                      <div className="meu-pedido-header">
                        <span className="meu-pedido-cesta">{cestaNome}</span>
                        <span className="meu-pedido-valor">R$ {formatarPreco(p.valorTotal)}</span>
                      </div>
                      <div className="meu-pedido-meta">
                        <div><b>Data:</b> {data}</div>
                        {p.enderecoEntrega && <div><b>Endereço:</b> {p.enderecoEntrega}</div>}
                        {p.observacoes && <div><b>Obs:</b> {p.observacoes}</div>}
                      </div>
                      <span className="badge-status" style={{ background: STATUS_LABELS[status] ? undefined : '#f0f0f0' }}>
                        {STATUS_LABELS[status] || status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
