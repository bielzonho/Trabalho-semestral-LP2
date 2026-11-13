import 'package:flutter/material.dart';

import 'pages/catalogo_page.dart';
import 'services/admin_catalogo_service.dart';
import 'services/auth_service.dart';
import 'services/cadastro_service.dart';
import 'services/catalogo_service.dart';
import 'services/pedidos_service.dart';
import 'services/token_storage.dart';
import 'services/verificacao_service.dart';
import 'state/sessao_controller.dart';
import 'theme/app_theme.dart';

void main() {
  final sessao = SessaoController(HttpAuthService(), TokenStorage());
  // Restaura a sessão (token salvo) em segundo plano; a tela reage via ChangeNotifier.
  sessao.restaurar();

  runApp(GraoCestaApp(
    repositorio: HttpCatalogoRepository(),
    sessao: sessao,
    verificacao: HttpVerificacaoService(),
  ));
}

class GraoCestaApp extends StatelessWidget {
  final CatalogoRepository repositorio;
  final SessaoController sessao;

  /// Opcional: sem ele o login não pede o código OTP (útil nos testes).
  final VerificacaoService? verificacao;
  final CadastroService? cadastro;
  final PedidosService? pedidos;
  final AdminCatalogoService? admin;

  const GraoCestaApp({
    super.key,
    required this.repositorio,
    required this.sessao,
    this.verificacao,
    this.cadastro,
    this.pedidos,
    this.admin,
  });

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Grão & Cesta',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: CatalogoPage(
        repositorio: repositorio,
        sessao: sessao,
        verificacao: verificacao,
        cadastro: cadastro ?? CadastroService(),
        pedidos: pedidos ?? PedidosService(),
        admin: admin ?? AdminCatalogoService(),
      ),
    );
  }
}
