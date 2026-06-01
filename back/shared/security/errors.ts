import { Response } from "express";

export function respostaErro(res: Response, status: number, mensagem: string) {
  return res.status(status).json({ mensagem });
}

export function naoAutorizado(res: Response) {
  return respostaErro(res, 401, "Acesso não autorizado. Faça login.");
}

export function semPermissao(res: Response) {
  return respostaErro(res, 403, "Permissão insuficiente para esta ação.");
}
