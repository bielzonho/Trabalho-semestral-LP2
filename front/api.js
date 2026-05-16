// URLs das APIs
const API_PRODUTOS = "http://localhost:3012/produtos";
const API_CESTAS = "http://localhost:3010/cestas";
const API_PEDIDOS = "http://localhost:3011/pedidos";

// Funções utilitárias
async function fetchAPI(url, options = {}) {
  try {
    const resposta = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      },
      ...options
    });

    if (!resposta.ok) {
      throw new Error(`HTTP ${resposta.status}: ${resposta.statusText}`);
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
    const produtos = await fetchAPI(API_PRODUTOS);
    return produtos;
  } catch (erro) {
    console.error("Erro ao carregar produtos:", erro);
    return [];
  }
}

async function obterProduto(id) {
  try {
    const produto = await fetchAPI(`${API_PRODUTOS}/${id}`);
    return produto;
  } catch (erro) {
    console.error("Erro ao obter produto:", erro);
    return null;
  }
}

async function criarProduto(dados) {
  try {
    const produto = await fetchAPI(API_PRODUTOS, {
      method: "POST",
      body: JSON.stringify(dados)
    });
    return produto;
  } catch (erro) {
    console.error("Erro ao criar produto:", erro);
    throw erro;
  }
}

async function atualizarProduto(id, dados) {
  try {
    const produto = await fetchAPI(`${API_PRODUTOS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(dados)
    });
    return produto;
  } catch (erro) {
    console.error("Erro ao atualizar produto:", erro);
    throw erro;
  }
}

async function deletarProduto(id) {
  try {
    const resultado = await fetchAPI(`${API_PRODUTOS}/${id}`, {
      method: "DELETE"
    });
    return resultado;
  } catch (erro) {
    console.error("Erro ao deletar produto:", erro);
    throw erro;
  }
}

// ============================================================
// CESTAS
// ============================================================

async function carregarCestas() {
  try {
    const cestas = await fetchAPI(API_CESTAS);
    return cestas;
  } catch (erro) {
    console.error("Erro ao carregar cestas:", erro);
    return [];
  }
}

async function obterCesta(id) {
  try {
    const cesta = await fetchAPI(`${API_CESTAS}/${id}`);
    return cesta;
  } catch (erro) {
    console.error("Erro ao obter cesta:", erro);
    return null;
  }
}

async function criarCesta(dados) {
  try {
    const cesta = await fetchAPI(API_CESTAS, {
      method: "POST",
      body: JSON.stringify(dados)
    });
    return cesta;
  } catch (erro) {
    console.error("Erro ao criar cesta:", erro);
    throw erro;
  }
}

async function atualizarCesta(id, dados) {
  try {
    const cesta = await fetchAPI(`${API_CESTAS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(dados)
    });
    return cesta;
  } catch (erro) {
    console.error("Erro ao atualizar cesta:", erro);
    throw erro;
  }
}

async function adicionarItemCesta(cestaId, dados) {
  try {
    const cesta = await fetchAPI(`${API_CESTAS}/${cestaId}/itens`, {
      method: "POST",
      body: JSON.stringify(dados)
    });
    return cesta;
  } catch (erro) {
    console.error("Erro ao adicionar item à cesta:", erro);
    throw erro;
  }
}

async function removerItemCesta(cestaId, itemId) {
  try {
    const resultado = await fetchAPI(`${API_CESTAS}/${cestaId}/itens/${itemId}`, {
      method: "DELETE"
    });
    return resultado;
  } catch (erro) {
    console.error("Erro ao remover item da cesta:", erro);
    throw erro;
  }
}

async function deletarCesta(id) {
  try {
    const resultado = await fetchAPI(`${API_CESTAS}/${id}`, {
      method: "DELETE"
    });
    return resultado;
  } catch (erro) {
    console.error("Erro ao deletar cesta:", erro);
    throw erro;
  }
}

// ============================================================
// PEDIDOS
// ============================================================

async function carregarPedidos() {
  try {
    const pedidos = await fetchAPI(API_PEDIDOS);
    return pedidos;
  } catch (erro) {
    console.error("Erro ao carregar pedidos:", erro);
    return [];
  }
}

async function obterPedido(id) {
  try {
    const pedido = await fetchAPI(`${API_PEDIDOS}/${id}`);
    return pedido;
  } catch (erro) {
    console.error("Erro ao obter pedido:", erro);
    return null;
  }
}

async function criarPedido(dados) {
  try {
    const pedido = await fetchAPI(API_PEDIDOS, {
      method: "POST",
      body: JSON.stringify(dados)
    });
    return pedido;
  } catch (erro) {
    console.error("Erro ao criar pedido:", erro);
    throw erro;
  }
}

async function atualizarPedido(id, dados) {
  try {
    const pedido = await fetchAPI(`${API_PEDIDOS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(dados)
    });
    return pedido;
  } catch (erro) {
    console.error("Erro ao atualizar pedido:", erro);
    throw erro;
  }
}

async function atualizarStatusPedido(id, status) {
  try {
    const pedido = await fetchAPI(`${API_PEDIDOS}/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    return pedido;
  } catch (erro) {
    console.error("Erro ao atualizar status do pedido:", erro);
    throw erro;
  }
}

async function adicionarItemPedido(pedidoId, dados) {
  try {
    const pedido = await fetchAPI(`${API_PEDIDOS}/${pedidoId}/itens`, {
      method: "POST",
      body: JSON.stringify(dados)
    });
    return pedido;
  } catch (erro) {
    console.error("Erro ao adicionar item ao pedido:", erro);
    throw erro;
  }
}

async function removerItemPedido(pedidoId, itemId) {
  try {
    const resultado = await fetchAPI(`${API_PEDIDOS}/${pedidoId}/itens/${itemId}`, {
      method: "DELETE"
    });
    return resultado;
  } catch (erro) {
    console.error("Erro ao remover item do pedido:", erro);
    throw erro;
  }
}

async function deletarPedido(id) {
  try {
    const resultado = await fetchAPI(`${API_PEDIDOS}/${id}`, {
      method: "DELETE"
    });
    return resultado;
  } catch (erro) {
    console.error("Erro ao deletar pedido:", erro);
    throw erro;
  }
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
