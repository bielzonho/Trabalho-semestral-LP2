import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  carregarProdutos,
  criarProduto,
  atualizarProduto,
  deletarProduto,
  carregarCestas,
  criarCesta,
  atualizarCesta,
  deletarCesta,
  obterCesta,
  carregarPedidos,
  atualizarStatusPedido,
  deletarPedido,
  formatarMoeda,
  STATUS_LABELS,
  STATUS_CORES,
  API_PRODUTOS_URL,
  API_CESTAS_URL,
  API_PEDIDOS_URL,
} from '../api/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { ToastProvider, useToast } from '../components/Toast';

// ── Painel Produtos ───────────────────────────────────────────

function PainelProdutos() {
  const toast = useToast();
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({ nome: '', descricao: '', preco: '', quantidadeEstoque: '' });

  const carregar = useCallback(async () => {
    setLoading(true);
    try { setProdutos(await carregarProdutos()); }
    catch { toast('Erro ao carregar produtos.', 'erro'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, []);

  function abrirNovo() {
    setEditandoId(null);
    setForm({ nome: '', descricao: '', preco: '', quantidadeEstoque: '' });
    setModalAberto(true);
  }

  async function abrirEditar(id) {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_PRODUTOS_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const p = await res.json();
      setEditandoId(id);
      setForm({ nome: p.nome, descricao: p.descricao || '', preco: p.preco, quantidadeEstoque: p.quantidadeEstoque ?? 0 });
      setModalAberto(true);
    } catch { toast('Erro ao carregar produto.', 'erro'); }
  }

  async function salvar() {
    if (!form.nome || isNaN(parseFloat(form.preco))) { toast('Preencha nome e preço.', 'erro'); return; }
    const dados = { nome: form.nome, descricao: form.descricao, preco: parseFloat(form.preco), quantidadeEstoque: parseInt(form.quantidadeEstoque || 0) };
    try {
      if (editandoId) await atualizarProduto(editandoId, dados);
      else await criarProduto(dados);
      setModalAberto(false);
      toast(editandoId ? 'Produto atualizado!' : 'Produto criado!');
      carregar();
    } catch (err) { toast(err.message || 'Erro ao salvar.', 'erro'); }
  }

  async function excluir(id, nome) {
    if (!confirm(`Excluir produto "${nome}"?`)) return;
    try { await deletarProduto(id); toast('Produto excluído.'); carregar(); }
    catch { toast('Erro ao excluir produto.', 'erro'); }
  }

  const campo = (k, label, type = 'text', extra = {}) => (
    <div className="campo">
      <label>{label}</label>
      <input type={type} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} {...extra} />
    </div>
  );

  return (
    <>
      <div className="secao-header">
        <h2>Gerenciar Produtos</h2>
        <button className="btn-novo" onClick={abrirNovo}>+ Novo Produto</button>
      </div>
      <div className="tabela-container">
        <table>
          <thead>
            <tr>
              <th>Nome</th><th>Preço</th><th>Estoque</th><th>Status</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}><div className="vazio"><p>Carregando...</p></div></td></tr>
            ) : produtos.length === 0 ? (
              <tr><td colSpan={5}><div className="vazio"><p>Nenhum produto cadastrado.</p></div></td></tr>
            ) : (
              produtos.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.nome}</strong></td>
                  <td>{formatarMoeda(p.preco)}</td>
                  <td>{p.quantidadeEstoque ?? 0}</td>
                  <td>
                    <span className="badge" style={{ background: p.ativo ? '#e8f5e9' : '#ffeaea', color: p.ativo ? '#2e7d32' : '#c0392b' }}>
                      {p.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="acoes">
                      <button className="btn-acao btn-editar" onClick={() => abrirEditar(p.id)}>Editar</button>
                      <button className="btn-acao btn-excluir" onClick={() => excluir(p.id, p.nome)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editandoId ? 'Editar Produto' : 'Novo Produto'}
        actions={
          <>
            <button className="btn-cancelar" onClick={() => setModalAberto(false)}>Cancelar</button>
            <button className="btn-salvar" onClick={salvar}>Salvar</button>
          </>
        }
      >
        {campo('nome', 'Nome *', 'text', { placeholder: 'Nome do produto' })}
        <div className="campo">
          <label>Descrição</label>
          <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição do produto" />
        </div>
        {campo('preco', 'Preço (R$) *', 'number', { placeholder: '0.00', step: '0.01', min: '0' })}
        {campo('quantidadeEstoque', 'Quantidade em Estoque', 'number', { placeholder: '0', min: '0' })}
      </Modal>
    </>
  );
}

// ── Painel Cestas ─────────────────────────────────────────────

function PainelCestas() {
  const toast = useToast();
  const [cestas, setCestas] = useState([]);
  const [produtosCache, setProdutosCache] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCesta, setModalCesta] = useState(false);
  const [modalItens, setModalItens] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [cestaItensId, setCestaItensId] = useState(null);
  const [cestaItensNome, setCestaItensNome] = useState('');
  const [itensAdmin, setItensAdmin] = useState([]);
  const [form, setForm] = useState({ nome: '', descricao: '', precoBase: '' });

  const carregar = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const [c, p] = await Promise.all([
        fetch(API_CESTAS_URL, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(API_PRODUTOS_URL, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);
      setCestas(Array.isArray(c) ? c : []);
      setProdutosCache(Array.isArray(p) ? p : []);
    } catch { toast('Erro ao carregar cestas.', 'erro'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, []);

  function abrirNova() {
    setEditandoId(null);
    setForm({ nome: '', descricao: '', precoBase: '' });
    setModalCesta(true);
  }

  async function abrirEditar(id) {
    const token = localStorage.getItem('token');
    try {
      const c = await fetch(`${API_CESTAS_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      setEditandoId(id);
      setForm({ nome: c.nome, descricao: c.descricao || '', precoBase: c.preco ?? c.precoBase });
      setModalCesta(true);
    } catch { toast('Erro ao carregar cesta.', 'erro'); }
  }

  async function salvar() {
    if (!form.nome || isNaN(parseFloat(form.precoBase))) { toast('Preencha nome e preço.', 'erro'); return; }
    const dados = { nome: form.nome, descricao: form.descricao, precoBase: parseFloat(form.precoBase) };
    try {
      if (editandoId) await atualizarCesta(editandoId, dados);
      else await criarCesta(dados);
      setModalCesta(false);
      toast(editandoId ? 'Cesta atualizada!' : 'Cesta criada!');
      carregar();
    } catch (err) { toast(err.message || 'Erro ao salvar.', 'erro'); }
  }

  async function excluir(id, nome) {
    if (!confirm(`Excluir cesta "${nome}"?`)) return;
    try { await deletarCesta(id); toast('Cesta excluída.'); carregar(); }
    catch { toast('Erro ao excluir cesta.', 'erro'); }
  }

  async function abrirModalItens(cestaId, nome) {
    setCestaItensId(cestaId);
    setCestaItensNome(nome);
    const token = localStorage.getItem('token');
    try {
      const c = await fetch(`${API_CESTAS_URL}/${cestaId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      setItensAdmin((c.itens || []).map(i => ({ produtoId: i.produtoId, _key: Math.random() })));
    } catch { toast('Erro ao carregar itens.', 'erro'); }
    setModalItens(true);
  }

  function adicionarItemAdmin() {
    if (!produtosCache.length) { toast('Nenhum produto disponível.', 'erro'); return; }
    setItensAdmin(prev => [...prev, { produtoId: produtosCache[0].id, _key: Math.random() }]);
  }

  async function salvarItens() {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_CESTAS_URL}/${cestaItensId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itens: itensAdmin.map(i => ({ produtoId: i.produtoId })) }),
      });
      if (!res.ok) throw new Error((await res.json()).mensagem);
      setModalItens(false);
      toast('Itens salvos com sucesso!');
      carregar();
    } catch (err) { toast(err.message || 'Erro ao salvar itens.', 'erro'); }
  }

  return (
    <>
      <div className="secao-header">
        <h2>Gerenciar Cestas</h2>
        <button className="btn-novo" onClick={abrirNova}>+ Nova Cesta</button>
      </div>
      <div className="tabela-container">
        <table>
          <thead>
            <tr><th>Nome</th><th>Preço</th><th>Itens Padrão</th><th>Vendas</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}><div className="vazio"><p>Carregando...</p></div></td></tr>
            ) : cestas.length === 0 ? (
              <tr><td colSpan={5}><div className="vazio"><p>Nenhuma cesta cadastrada.</p></div></td></tr>
            ) : (
              cestas.map(c => {
                const itens = c.itens || [];
                return (
                  <tr key={c.id}>
                    <td><strong>{c.nome}</strong></td>
                    <td>{formatarMoeda(c.preco ?? c.precoBase)}</td>
                    <td>
                      {itens.length === 0
                        ? <span style={{ color: 'var(--muted-warm)', fontSize: 12 }}>Sem itens</span>
                        : itens.map(item => {
                            const prod = produtosCache.find(p => p.id === item.produtoId);
                            return <span key={item.produtoId} className="itens-chip">{prod?.nome || '?'}</span>;
                          })
                      }
                    </td>
                    <td>{c.quantidadeVendas ?? 0}</td>
                    <td>
                      <div className="acoes">
                        <button className="btn-acao btn-editar" onClick={() => abrirEditar(c.id)}>Editar</button>
                        <button className="btn-acao btn-itens" onClick={() => abrirModalItens(c.id, c.nome)}>Itens</button>
                        <button className="btn-acao btn-excluir" onClick={() => excluir(c.id, c.nome)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal cesta */}
      <Modal
        isOpen={modalCesta}
        onClose={() => setModalCesta(false)}
        title={editandoId ? 'Editar Cesta' : 'Nova Cesta'}
        actions={
          <>
            <button className="btn-cancelar" onClick={() => setModalCesta(false)}>Cancelar</button>
            <button className="btn-salvar" onClick={salvar}>Salvar</button>
          </>
        }
      >
        <div className="campo">
          <label>Nome *</label>
          <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome da cesta" />
        </div>
        <div className="campo">
          <label>Descrição</label>
          <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição da cesta" />
        </div>
        <div className="campo">
          <label>Preço Base (R$) *</label>
          <input type="number" value={form.precoBase} onChange={e => setForm(f => ({ ...f, precoBase: e.target.value }))} placeholder="0.00" step="0.01" min="0" />
        </div>
      </Modal>

      {/* Modal itens */}
      <Modal
        isOpen={modalItens}
        onClose={() => setModalItens(false)}
        title={<>Itens de: <span style={{ color: 'var(--gold)' }}>{cestaItensNome}</span></>}
        actions={
          <>
            <button className="btn-cancelar" onClick={() => setModalItens(false)}>Cancelar</button>
            <button className="btn-salvar" onClick={salvarItens}>Salvar Itens</button>
          </>
        }
      >
        <p style={{ color: 'var(--muted-warm)', fontSize: 13, marginBottom: 16 }}>
          Selecione os produtos que fazem parte desta cesta por padrão.
        </p>
        <div className="itens-header-modal">Produto</div>
        {itensAdmin.map((item) => (
          <div key={item._key} className="item-admin-row">
            <select
              value={item.produtoId}
              onChange={e => setItensAdmin(prev => prev.map(i => i._key === item._key ? { ...i, produtoId: e.target.value } : i))}
            >
              {produtosCache.map(p => (
                <option key={p.id} value={p.id}>{p.nome} — {formatarMoeda(p.preco)}</option>
              ))}
            </select>
            <button
              type="button"
              className="btn-acao btn-excluir"
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => setItensAdmin(prev => prev.filter(i => i._key !== item._key))}
            >
              Remover
            </button>
          </div>
        ))}
        <button type="button" className="btn-add-item-admin" onClick={adicionarItemAdmin}>
          + Adicionar produto
        </button>
      </Modal>
    </>
  );
}

// ── Painel Pedidos ────────────────────────────────────────────

function PainelPedidos() {
  const toast = useToast();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalStatus, setModalStatus] = useState(false);
  const [pedidoStatusId, setPedidoStatusId] = useState(null);
  const [novoStatus, setNovoStatus] = useState('pendente');

  const carregar = useCallback(async () => {
    setLoading(true);
    try { setPedidos(await carregarPedidos()); }
    catch { toast('Erro ao carregar pedidos.', 'erro'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, []);

  function abrirModalStatus(id, statusAtual) {
    setPedidoStatusId(id);
    setNovoStatus(statusAtual);
    setModalStatus(true);
  }

  async function confirmarStatus() {
    try {
      await atualizarStatusPedido(pedidoStatusId, novoStatus);
      setModalStatus(false);
      toast('Status atualizado!');
      carregar();
    } catch { toast('Erro ao atualizar status.', 'erro'); }
  }

  async function excluir(id) {
    if (!confirm('Excluir este pedido?')) return;
    try { await deletarPedido(id); toast('Pedido excluído.'); carregar(); }
    catch { toast('Erro ao excluir pedido.', 'erro'); }
  }

  return (
    <>
      <div className="secao-header">
        <h2>Gerenciar Pedidos</h2>
      </div>
      <div className="tabela-container">
        <table>
          <thead>
            <tr><th>ID</th><th>Cliente</th><th>Valor</th><th>Status</th><th>Data</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="vazio"><p>Carregando...</p></div></td></tr>
            ) : pedidos.length === 0 ? (
              <tr><td colSpan={6}><div className="vazio"><p>Nenhum pedido registrado.</p></div></td></tr>
            ) : (
              pedidos.map(p => (
                <tr key={p.id}>
                  <td><code style={{ fontSize: 12, color: 'var(--muted-warm)' }}>{String(p.id).slice(0, 8)}...</code></td>
                  <td>{p.clienteNome}</td>
                  <td>{formatarMoeda(p.valorTotal)}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>{p.criadoEm ? new Date(p.criadoEm).toLocaleDateString('pt-BR') : '-'}</td>
                  <td>
                    <div className="acoes">
                      <button className="btn-acao btn-status" onClick={() => abrirModalStatus(p.id, p.status)}>Status</button>
                      <button className="btn-acao btn-excluir" onClick={() => excluir(p.id)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalStatus}
        onClose={() => setModalStatus(false)}
        title="Alterar Status do Pedido"
        actions={
          <>
            <button className="btn-cancelar" onClick={() => setModalStatus(false)}>Cancelar</button>
            <button className="btn-salvar" onClick={confirmarStatus}>Confirmar</button>
          </>
        }
      >
        <p style={{ color: 'var(--muted-warm)', fontSize: 14, marginBottom: 18 }}>
          Pedido ID: <strong>{pedidoStatusId ? String(pedidoStatusId).slice(0, 12) + '...' : ''}</strong>
        </p>
        <div className="campo">
          <label>Novo Status</label>
          <select value={novoStatus} onChange={e => setNovoStatus(e.target.value)}>
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </Modal>
    </>
  );
}

// ── AdminPage ─────────────────────────────────────────────────

const ABAS = ['produtos', 'cestas', 'pedidos'];
const ABA_LABELS = { produtos: 'Produtos', cestas: 'Cestas', pedidos: 'Pedidos' };

function AdminPageInner() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('produtos');

  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !usuario) { navigate('/login'); return; }
    if (usuario.perfil !== 'admin') {
      alert('Acesso restrito a administradores.');
      navigate('/');
    }
  }, []);

  function fazerLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('emailVerificado');
    navigate('/login');
  }

  return (
    <div className="admin-bg">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>Grão &amp; Cesta</h1>
          <span className="badge-admin">ADMIN</span>
        </div>
        <div className="admin-header-right">
          <span className="nome-usuario">{usuario?.nome}</span>
          <button className="btn-sair" onClick={fazerLogout}>Sair</button>
        </div>
      </header>

      {/* Abas */}
      <div className="admin-tabs">
        {ABAS.map(aba => (
          <button
            key={aba}
            className={`admin-tab${abaAtiva === aba ? ' ativa' : ''}`}
            onClick={() => setAbaAtiva(aba)}
          >
            {ABA_LABELS[aba]}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="admin-conteudo">
        {abaAtiva === 'produtos' && <PainelProdutos />}
        {abaAtiva === 'cestas' && <PainelCestas />}
        {abaAtiva === 'pedidos' && <PainelPedidos />}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ToastProvider>
      <AdminPageInner />
    </ToastProvider>
  );
}
