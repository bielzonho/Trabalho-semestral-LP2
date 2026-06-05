import jwt from "jsonwebtoken";
import { Perfil } from "./users";

const JWT_SECRET = process.env.JWT_SECRET || "chave_secreta_padrao";
const JWT_EXPIRY = "8h";

export interface TokenPayload {
  sub: string;
  nome: string;
  email: string;
  perfil: Perfil;
}

export function gerarToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verificarToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
