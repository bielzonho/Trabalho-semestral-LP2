import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { pedidos } from "../data/pedidos";
import { Pedido, StatusPedido } from "../types/pedido";

const router = Router();

const statusValidos: StatusPedido[] = [
  "PENDENTE",
  "CONFIRMADO",
  "EM_PREPARACAO",
  "SAIU_PARA_ENTREGA",
  "ENTREGUE",
  "CANCELADO"
];

router.get("/", (_req: Request, res: Response) => {
  return res.status(200).json(pedidos);
});

router.get("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  const pedido = pedidos.find((p) => p.id === id);

  if (!pedido) {
    return res.status(404).json({ mensagem: "Pedido não encontrado." });
  }

  return res.status(200).json(pedido);
});

router.post("/", (req: Request, res: Response) => {
  const {
    clienteNome,
    clienteTelefone,
    enderecoEntrega,
    cestaId,
    quantidade,
    valorTotal
  } = req.body;

  if (
    !clienteNome ||
    !clienteTelefone ||
    !enderecoEntrega ||
    !cestaId ||
    quantidade === undefined ||
    valorTotal === undefined
  ) {
    return res.status(400).json({
      mensagem:
        "Campos obrigatórios: clienteNome, clienteTelefone, enderecoEntrega, cestaId, quantidade, valorTotal."
    });
  }

  const novoPedido: Pedido = {
    id: uuidv4(),
    clienteNome,
    clienteTelefone,
    enderecoEntrega,
    cestaId,
    quantidade,
    valorTotal,
    status: "PENDENTE",
    dataPedido: new Date().toISOString()
  };

  pedidos.push(novoPedido);

  return res.status(201).json(novoPedido);
});

router.put("/:id/status", (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: StatusPedido };

  const pedido = pedidos.find((p) => p.id === id);

  if (!pedido) {
    return res.status(404).json({ mensagem: "Pedido não encontrado." });
  }

  if (!status || !statusValidos.includes(status)) {
    return res.status(400).json({
      mensagem: `Status inválido. Use: ${statusValidos.join(", ")}.`
    });
  }

  pedido.status = status;

  return res.status(200).json(pedido);
});

router.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  const index = pedidos.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ mensagem: "Pedido não encontrado." });
  }

  pedidos.splice(index, 1);

  return res.status(200).json({ mensagem: "Pedido removido com sucesso." });
});

export default router;