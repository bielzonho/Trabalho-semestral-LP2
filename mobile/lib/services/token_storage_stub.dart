import 'token_storage.dart';

class _MemoriaTokenStorage implements TokenStorage {
  String? _token;

  @override
  String? ler() => _token;

  @override
  void salvar(String token) => _token = token;

  @override
  void limpar() => _token = null;
}

TokenStorage criarTokenStorage() => _MemoriaTokenStorage();
