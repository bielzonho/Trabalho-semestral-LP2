/// Usuário autenticado, no formato devolvido por POST /auth/login.
class Usuario {
  final String id;
  final String nome;
  final String email;
  final String perfil;

  const Usuario({
    required this.id,
    required this.nome,
    required this.email,
    required this.perfil,
  });

  bool get ehAdmin => perfil == 'admin';

  factory Usuario.fromJson(Map<String, dynamic> json) => Usuario(
        // /auth/login devolve `id`; /auth/me devolve `sub`.
        id: (json['id'] ?? json['sub'] ?? '').toString(),
        nome: (json['nome'] as String?) ?? '',
        email: (json['email'] as String?) ?? '',
        perfil: (json['perfil'] as String?) ?? 'cliente',
      );
}
