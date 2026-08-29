export const API_PRODUTOS_URL    = 'http://localhost:3012/produtos';
export const API_CESTAS_URL      = 'http://localhost:3010/cestas';
export const API_PEDIDOS_URL     = 'http://localhost:3011/pedidos';
export const API_AUTH_URL        = 'http://localhost:3013/auth';
export const API_VERIFICACAO_URL = 'http://localhost:3014/verificacao';

// ── Auth ──────────────────────────────────────────────────────

export async function fazerLogin(email, senha) {
  const res = await fetch(`${API_AUTH_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  });
  const dados = await res.json();
  if (!res.ok) throw new Error(dados.mensagem || 'Credenciais inválidas.');
  return dados;
}

export function obterUsuarioLogado() {
  const dados = localStorage.getItem('usuario');
  return dados ? JSON.parse(dados) : null;
}

export function estaLogado() {
  return !!localStorage.getItem('token');
}

export function eAdmin() {
  return obterUsuarioLogado()?.perfil === 'admin';
}

export function fazerLogout(navigate) {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('emailVerificado');
  if (navigate) navigate('/login');
  else window.location.href = '/login';
}

// ── OTP ───────────────────────────────────────────────────────

export async function enviarCodigoVerificacao(email) {
  const res = await fetch(`${API_VERIFICACAO_URL}/enviar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const dados = await res.json();
  if (!res.ok) throw new Error(dados.mensagem || 'Erro ao enviar código.');
  return dados;
}

export async function confirmarCodigoVerificacao(email, codigo) {
  const res = await fetch(`${API_VERIFICACAO_URL}/confirmar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, codigo }),
  });
  const dados = await res.json();
  if (!res.ok) throw new Error(dados.mensagem || 'Código inválido ou expirado.');
  return dados;
}

export function emailEstaVerificado() {
  return localStorage.getItem('emailVerificado') === 'true';
}

// ── Utilitário HTTP ──────────────────────────────────────────

export async function fetchComAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  const headersBase = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, {
    ...options,
    headers: { ...headersBase, ...(options.headers || {}) },
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('emailVerificado');
    window.location.href = '/login';
    return null;
  }

  if (res.status === 403) throw new Error('Você não tem permissão para realizar esta ação.');

  if (!res.ok) {
    const corpo = await res.json().catch(() => ({}));
    throw new Error(corpo.mensagem || `HTTP ${res.status}: ${res.statusText}`);
  }

  return await res.json();
}

// ── Produtos ─────────────────────────────────────────────────

export async function carregarProdutos() {
  return (await fetchComAuth(API_PRODUTOS_URL)) ?? [];
}

export async function obterProduto(id) {
  return fetchComAuth(`${API_PRODUTOS_URL}/${id}`);
}

export async function criarProduto(dados) {
  return fetchComAuth(API_PRODUTOS_URL, { method: 'POST', body: JSON.stringify(dados) });
}

export async function atualizarProduto(id, dados) {
  return fetchComAuth(`${API_PRODUTOS_URL}/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
}

export async function deletarProduto(id) {
  return fetchComAuth(`${API_PRODUTOS_URL}/${id}`, { method: 'DELETE' });
}

// ── Cestas ───────────────────────────────────────────────────

export async function carregarCestas() {
  return (await fetchComAuth(API_CESTAS_URL)) ?? [];
}

export async function obterCesta(id) {
  return fetchComAuth(`${API_CESTAS_URL}/${id}`);
}

export async function criarCesta(dados) {
  return fetchComAuth(API_CESTAS_URL, { method: 'POST', body: JSON.stringify(dados) });
}

export async function atualizarCesta(id, dados) {
  return fetchComAuth(`${API_CESTAS_URL}/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
}

export async function deletarCesta(id) {
  return fetchComAuth(`${API_CESTAS_URL}/${id}`, { method: 'DELETE' });
}

// ── Pedidos ──────────────────────────────────────────────────

export async function carregarPedidos() {
  return (await fetchComAuth(API_PEDIDOS_URL)) ?? [];
}

export async function carregarMeusPedidos() {
  return (await fetchComAuth(`${API_PEDIDOS_URL}/meus`)) ?? [];
}

export async function criarPedido(dados) {
  return fetchComAuth(API_PEDIDOS_URL, { method: 'POST', body: JSON.stringify(dados) });
}

export async function atualizarStatusPedido(id, status) {
  return fetchComAuth(`${API_PEDIDOS_URL}/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deletarPedido(id) {
  return fetchComAuth(`${API_PEDIDOS_URL}/${id}`, { method: 'DELETE' });
}

// ── Formatadores ─────────────────────────────────────────────

export function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

export function formatarPreco(valor) {
  const n = Number(valor);
  if (Number.isNaN(n)) return '0,00';
  return n.toFixed(2).replace('.', ',');
}

export function formatarData(dataIso) {
  return new Date(dataIso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export const STATUS_LABELS = {
  pendente:          'Pendente',
  confirmado:        'Confirmado',
  em_preparacao:     'Em Preparação',
  saiu_para_entrega: 'Saiu para Entrega',
  entregue:          'Entregue',
  cancelado:         'Cancelado',
};

export const STATUS_CORES = {
  pendente:          { bg: '#fff3dc', text: '#8a6200' },
  confirmado:        { bg: '#dcf0ff', text: '#0052a3' },
  em_preparacao:     { bg: '#ffe6d9', text: '#a35200' },
  saiu_para_entrega: { bg: '#f0e6ff', text: '#6200a3' },
  entregue:          { bg: '#dcffde', text: '#009200' },
  cancelado:         { bg: '#ffdcdc', text: '#a30000' },
};
