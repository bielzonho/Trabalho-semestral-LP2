import 'package:flutter/foundation.dart';

import '../models/usuario.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../services/token_storage.dart';

/// Estado da sessão do usuário (login/logout) para a interface.
class SessaoController extends ChangeNotifier {
  final AuthService _auth;
  final TokenStorage _storage;

  Usuario? _usuario;
  bool _carregando = false;

  SessaoController(this._auth, this._storage);

  Usuario? get usuario => _usuario;
  bool get logado => _usuario != null;
  bool get carregando => _carregando;

  /// Token JWT da sessão atual (para as rotas protegidas).
  String? get token => logado ? _storage.ler() : null;

  /// Ao abrir o app: se há token salvo, valida no servidor (/auth/me).
  Future<void> restaurar() async {
    final token = _storage.ler();
    if (token == null) return;
    try {
      _usuario = await _auth.me(token);
    } on ApiException catch (e) {
      // Token inválido/expirado é descartado; falha de rede mantém o token.
      if (e.status == 401) _storage.limpar();
    }
    notifyListeners();
  }

  /// Valida e-mail/senha sem ainda abrir a sessão (etapa 1 do login com OTP).
  /// Lança [ApiException] com a mensagem da API em caso de erro.
  Future<Sessao> autenticar(String email, String senha) async {
    _carregando = true;
    notifyListeners();
    try {
      return await _auth.login(email, senha);
    } finally {
      _carregando = false;
      notifyListeners();
    }
  }

  /// Abre a sessão depois que todas as etapas do login foram concluídas.
  void concluir(Sessao sessao) {
    _storage.salvar(sessao.token);
    _usuario = sessao.usuario;
    notifyListeners();
  }

  /// Login direto (sem OTP). Lança [ApiException] em caso de erro.
  Future<void> entrar(String email, String senha) async =>
      concluir(await autenticar(email, senha));

  void sair() {
    _storage.limpar();
    _usuario = null;
    notifyListeners();
  }
}
