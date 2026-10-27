import 'package:web/web.dart' as web;

import 'token_storage.dart';

const _chave = 'grao_cesta_token';

class _LocalTokenStorage implements TokenStorage {
  @override
  String? ler() {
    try {
      return web.window.localStorage.getItem(_chave);
    } catch (_) {
      return null; // localStorage bloqueado (modo privado etc.)
    }
  }

  @override
  void salvar(String token) {
    try {
      web.window.localStorage.setItem(_chave, token);
    } catch (_) {}
  }

  @override
  void limpar() {
    try {
      web.window.localStorage.removeItem(_chave);
    } catch (_) {}
  }
}

TokenStorage criarTokenStorage() => _LocalTokenStorage();
