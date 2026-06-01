export type Perfil = "admin" | "cliente";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
  perfil: Perfil;
}

export const usuarios: Usuario[] = [
  {
    id: "1",
    nome: "Admin",
    email: "admin@email.com",
    senha: "admin123",
    perfil: "admin"
  },
  {
    id: "2",
    nome: "Cliente",
    email: "cliente@email.com",
    senha: "cliente123",
    perfil: "cliente"
  }
];

export function buscarPorEmail(email: string): Usuario | undefined {
  return usuarios.find((u) => u.email === email);
}
