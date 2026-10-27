// Teste de integração do app com o back end REAL (sem Flutter, sem plugins).
//
//   1. suba o back end:        npm run dev:back
//   2. rode (na pasta mobile): dart run tool/smoke.dart [email] [senha]
//
// Usa as mesmas classes de serviço do app (ApiClient, repositórios, AuthService).
// Sai com código 1 se alguma verificação falhar.
// ignore_for_file: avoid_print
import 'dart:io';

import 'package:grao_cesta/services/api_client.dart';
import 'package:grao_cesta/services/auth_service.dart';
import 'package:grao_cesta/services/catalogo_service.dart';

int falhas = 0;

void ok(String nome, [String detalhe = '']) =>
    print('  OK   $nome${detalhe.isEmpty ? '' : ' — $detalhe'}');

void falha(String nome, Object erro) {
  falhas++;
  print('  FAIL $nome — $erro');
}

Future<void> verificar(String nome, Future<String?> Function() teste) async {
  try {
    ok(nome, await teste() ?? '');
  } catch (e) {
    falha(nome, e);
  }
}

Future<void> main(List<String> args) async {
  final email = args.isNotEmpty ? args[0] : 'cliente@email.com';
  final senha = args.length > 1 ? args[1] : Platform.environment['SMOKE_SENHA'];

  final api = ApiClient();
  final catalogo = HttpCatalogoRepository(api);
  final auth = HttpAuthService(api);

  print('Funcionalidade 1 — catálogo real');
  await verificar('GET /cestas', () async {
    final cestas = await catalogo.listarCestas();
    if (cestas.isEmpty) throw 'lista vazia';
    return '${cestas.length} cestas, ex.: ${cestas.first.nome} (R\$ ${cestas.first.preco})';
  });
  await verificar('GET /produtos', () async {
    final produtos = await catalogo.listarProdutos();
    if (produtos.isEmpty) throw 'lista vazia';
    return '${produtos.length} produtos, ex.: ${produtos.first.nome}';
  });

  print('Funcionalidade 2 — login');
  await verificar('login inválido responde 401 com mensagem', () async {
    try {
      await auth.login(email, 'senha-errada-${DateTime.now().millisecondsSinceEpoch}');
    } on ApiException catch (e) {
      if (e.status != 401) throw 'status ${e.status}, esperado 401';
      return '"${e.mensagem}"';
    }
    throw 'login com senha errada foi aceito';
  });
  await verificar('login sem campos responde 400', () async {
    try {
      await auth.login('', '');
    } on ApiException catch (e) {
      if (e.status != 400) throw 'status ${e.status}, esperado 400';
      return '"${e.mensagem}"';
    }
    throw 'login vazio foi aceito';
  });

  if (senha == null) {
    print('  --   login válido e /auth/me ignorados: informe a senha do usuário de '
        'desenvolvimento (back/auth/src/users.ts) como 2º argumento ou em SMOKE_SENHA.');
  } else {
    Sessao? sessao;
    await verificar('login válido devolve token e usuário', () async {
      sessao = await auth.login(email, senha);
      return '${sessao!.usuario.nome} (${sessao!.usuario.perfil})';
    });
    await verificar('GET /auth/me valida o token', () async {
      final usuario = await auth.me(sessao!.token);
      if (usuario.email != email) throw 'e-mail diferente: ${usuario.email}';
      return usuario.email;
    });
    await verificar('GET /auth/me com token inválido responde 401', () async {
      try {
        await auth.me('token.invalido.x');
      } on ApiException catch (e) {
        if (e.status != 401) throw 'status ${e.status}, esperado 401';
        return '"${e.mensagem}"';
      }
      throw 'token inválido foi aceito';
    });
  }

  print(falhas == 0 ? '\nTudo certo.' : '\n$falhas verificação(ões) falharam.');
  exit(falhas == 0 ? 0 : 1);
}
