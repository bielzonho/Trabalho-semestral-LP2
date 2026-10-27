import 'token_storage_stub.dart'
    if (dart.library.js_interop) 'token_storage_web.dart' as impl;

/// Guarda o token do login. No web usa localStorage (sobrevive ao F5);
/// nas demais plataformas fica só em memória.
abstract class TokenStorage {
  String? ler();
  void salvar(String token);
  void limpar();

  factory TokenStorage() => impl.criarTokenStorage();
}
