import { Router, Request, Response } from "express";
import { supabase } from "../database";

const router = Router();

// ── Mapa de handlers por tipo de evento (apostila seção 4.3.37) ──
// Cada chave é um tipo de evento; serviços descartam o que não conhecem.

type ItemEvento = { itemId: string; quantidade: number };

type DadosPedidoEfetivado = {
  pedidoId: string;
  status: string;
  itens: ItemEvento[];
};

const funcoes: Record<string, (dados: unknown) => Promise<void>> = {

  // Quando um pedido é confirmado/entregue pela primeira vez,
  // decrementamos o estoque e incrementamos as vendas de cada produto.
  PedidoEfetivado: async (dados: unknown) => {
    const { pedidoId, status, itens } = dados as DadosPedidoEfetivado;

    if (!itens || itens.length === 0) {
      console.log(`[Produtos] PedidoEfetivado (${pedidoId} → ${status}): sem itens adicionais.`);
      return;
    }

    console.log(`[Produtos] PedidoEfetivado recebido — pedido ${pedidoId} → ${status}`);

    for (const item of itens) {
      const { data: produto } = await supabase
        .from("itens")
        .select("quantidade_estoque, quantidade_vendas")
        .eq("id", item.itemId)
        .single();

      if (!produto) {
        console.warn(`[Produtos] Item ${item.itemId} não encontrado — ignorando.`);
        continue;
      }

      const novoEstoque = Math.max(0, (Number(produto.quantidade_estoque) || 0) - item.quantidade);
      const novasVendas  = (Number(produto.quantidade_vendas)  || 0) + item.quantidade;

      await supabase
        .from("itens")
        .update({ quantidade_estoque: novoEstoque, quantidade_vendas: novasVendas })
        .eq("id", item.itemId);

      console.log(
        `[Produtos] Item ${item.itemId}: estoque ${produto.quantidade_estoque} → ${novoEstoque}, vendas → ${novasVendas}`
      );
    }
  }
};

// POST /eventos
// Recebe broadcast do barramento; descarta eventos desconhecidos (try/catch)
router.post("/", async (req: Request, res: Response) => {
  const { tipo, dados } = req.body;

  try {
    if (funcoes[tipo]) {
      await funcoes[tipo](dados);
    }
  } catch (err) {
    // Erros internos não devem parar o processamento do barramento
    console.error(`[Produtos] Erro ao processar evento "${tipo}":`, (err as Error).message);
  }

  return res.status(200).json({ msg: "ok" });
});

export default router;
