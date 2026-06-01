// URLs das APIs
const API_PRODUTOS = "http://localhost:3012/produtos";
const API_CESTAS = "http://localhost:3010/cestas";
const API_PEDIDOS = "http://localhost:3011/pedidos";
const API_AUTH = "http://localhost:3013/auth";

// ============================================================
// AUTENTICAÇÃO
// ============================================================

async function fazerLogin(email, senha) {
  const resposta = await fetch(`${API_AUTH}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha })
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.mensagem || "Credenciais inválidas.");
  }

  return dados;
}

function obterUsuarioLogado() {
  const dados = localStorage.getItem("usuario");
  return dados ? JSON.parse(dados) : null;
}

function estaLogado() {
  return !!localStorage.getItem("token");
}

function eAdmin() {
  const usuario = obterUsuarioLogado();
  return usuario?.perfil === "admin";
}

function fazerLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}

// ============================================================
// UTILITÁRIO DE REQUISIÇÕES
// ============================================================

async function fetchAPI(url, options = {}) {
  const token = localStorage.getItem("token");

  try {
    const resposta = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {})
      },
      ...options,
      headers: undefined
    });

    if (resposta.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.href = "login.html";
      return;
    }

    if (resposta.status === 403) {
      throw new Error("Você não tem permissão para realizar esta ação.");
    }

    if (!resposta.ok) {
      const corpo = await resposta.json().catch(() => ({}));
      throw new Error(corpo.mensagem || `HTTP ${resposta.status}: ${resposta.statusText}`);
    }

    return await resposta.json();
  } catch (erro) {
    console.error("Erro na requisição:", erro);
    throw erro;
  }
}

// Versão corrigida do fetchAPI que monta os headers corretamente
async function fetchComAuth(url, options = {}) {
  const token = localStorage.getItem("token");
  const headersBase = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  try {
    const resposta = await fetch(url, {
      ...options,
      headers: { ...headersBase, ...(options.headers || {}) }
    });

    if (resposta.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.href = "login.html";
      return;
    }

    if (resposta.status === 403) {
      throw new Error("Você não tem permissão para realizar esta ação.");
    }

    if (!resposta.ok) {
      const corpo = await resposta.json().catch(() => ({}));
      throw new Error(corpo.mensagem || `HTTP ${resposta.status}: ${resposta.statusText}`);
    }

    return await resposta.json();
  } catch (erro) {
    console.error("Erro na requisição:", erro);
    throw erro;
  }
}

// ============================================================
// PRODUTOS
// ============================================================

async function carregarProdutos() {
  try {
    return await fetchComAuth(API_PRODUTOS);
  } catch (erro) {
    console.error("Erro ao carregar produtos:", erro);
    return [];
  }
}

async function obterProduto(id) {
  try {
    return await fetchComAuth(`${API_PRODUTOS}/${id}`);
  } catch (erro) {
    console.error("Erro ao obter produto:", erro);
    return null;
  }
}

async function criarProduto(dados) {
  return await fetchComAuth(API_PRODUTOS, {
    method: "POST",
    body: JSON.stringify(dados)
  });
}

async function atualizarProduto(id, dados) {
  return await fetchComAuth(`${API_PRODUTOS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados)
  });
}

async function deletarProduto(id) {
  return await fetchComAuth(`${API_PRODUTOS}/${id}`, {
    method: "DELETE"
  });
}

// ============================================================
// CESTAS
// ============================================================

async function carregarCestas() {
  try {
    return await fetchComAuth(API_CESTAS);
  } catch (erro) {
    console.error("Erro ao carregar cestas:", erro);
    return [];
  }
}

async function obterCesta(id) {
  try {
    return await fetchComAuth(`${API_CESTAS}/${id}`);
  } catch (erro) {
    console.error("Erro ao obter cesta:", erro);
    return null;
  }
}

async function criarCesta(dados) {
  return await fetchComAuth(API_CESTAS, {
    method: "POST",
    body: JSON.stringify(dados)
  });
}

async function atualizarCesta(id, dados) {
  return await fetchComAuth(`${API_CESTAS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados)
  });
}

async function adicionarItemCesta(cestaId, dados) {
  return await fetchComAuth(`${API_CESTAS}/${cestaId}/itens`, {
    method: "POST",
    body: JSON.stringify(dados)
  });
}

async function removerItemCesta(cestaId, itemId) {
  return await fetchComAuth(`${API_CESTAS}/${cestaId}/itens/${itemId}`, {
    method: "DELETE"
  });
}

async function deletarCesta(id) {
  return await fetchComAuth(`${API_CESTAS}/${id}`, {
    method: "DELETE"
  });
}

// ============================================================
// PEDIDOS
// ============================================================

async function carregarPedidos() {
  try {
    return await fetchComAuth(API_PEDIDOS);
  } catch (erro) {
    console.error("Erro ao carregar pedidos:", erro);
    return [];
  }
}

async function obterPedido(id) {
  try {
    return await fetchComAuth(`${API_PEDIDOS}/${id}`);
  } catch (erro) {
    console.error("Erro ao obter pedido:", erro);
    return null;
  }
}

async function criarPedido(dados) {
  return await fetchComAuth(API_PEDIDOS, {
    method: "POST",
    body: JSON.stringify(dados)
  });
}

async function atualizarPedido(id, dados) {
  return await fetchComAuth(`${API_PEDIDOS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados)
  });
}

async function atualizarStatusPedido(id, status) {
  return await fetchComAuth(`${API_PEDIDOS}/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

async function adicionarItemPedido(pedidoId, dados) {
  return await fetchComAuth(`${API_PEDIDOS}/${pedidoId}/itens`, {
    method: "POST",
    body: JSON.stringify(dados)
  });
}

async function removerItemPedido(pedidoId, itemId) {
  return await fetchComAuth(`${API_PEDIDOS}/${pedidoId}/itens/${itemId}`, {
    method: "DELETE"
  });
}

async function deletarPedido(id) {
  return await fetchComAuth(`${API_PEDIDOS}/${id}`, {
    method: "DELETE"
  });
}

// ============================================================
// FORMATADORES
// ============================================================

function formatarData(dataIso) {
  const data = new Date(dataIso);
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(valor);
}

function formatarStatus(status) {
  const mapeamento = {
    pendente: "Pendente",
    confirmado: "Confirmado",
    em_preparacao: "Em Preparação",
    saiu_para_entrega: "Saiu para Entrega",
    entregue: "Entregue",
    cancelado: "Cancelado"
  };
  return mapeamento[status] || status;
}

function formatarStatusBadge(status) {
  const cores = {
    pendente: "#fff3dc",
    confirmado: "#dcf0ff",
    em_preparacao: "#ffe6d9",
    saiu_para_entrega: "#f0e6ff",
    entregue: "#dcffde",
    cancelado: "#ffdcdc"
  };

  const textoCores = {
    pendente: "#8a6200",
    confirmado: "#0052a3",
    em_preparacao: "#a35200",
    saiu_para_entrega: "#6200a3",
    entregue: "#009200",
    cancelado: "#a30000"
  };

  return { bg: cores[status] || "#f0f0f0", text: textoCores[status] || "#333" };
}
