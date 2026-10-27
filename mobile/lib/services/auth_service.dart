import '../config/api_config.dart';
import '../models/usuario.dart';
import 'api_client.dart';

class Sessao {
  final String token;
  final Usuario usuario;

  const Sessao(this.token, this.usuario);
}

/// Autenticação via microsserviço auth (:3013).
abstract class AuthService {
  Future<Sessao> login(String email, String senha);

  /// Valida o token no servidor e devolve o usuário (lança [ApiException] se inválido).
  Future<Usuario> me(String token);
}

class HttpAuthService implements AuthService {
  final ApiClient _api;

  HttpAuthService([ApiClient? api]) : _api = api ?? ApiClient();

  @override
  Future<Sessao> login(String email, String senha) async {
    final dados = await _api.post(
      '${ApiConfig.auth}/auth/login',
      {'email': email.trim(), 'senha': senha},
    ) as Map<String, dynamic>;
    return Sessao(
      dados['token'] as String,
      Usuario.fromJson(dados['usuario'] as Map<String, dynamic>),
    );
  }

  @override
  Future<Usuario> me(String token) async {
    final dados = await _api.get('${ApiConfig.auth}/auth/me', token: token)
        as Map<String, dynamic>;
    return Usuario.fromJson(dados['usuario'] as Map<String, dynamic>);
  }
}
