import 'package:flutter/material.dart';

import 'pages/catalogo_page.dart';
import 'services/auth_service.dart';
import 'services/catalogo_service.dart';
import 'services/token_storage.dart';
import 'state/sessao_controller.dart';
import 'theme/app_theme.dart';

void main() {
  final sessao = SessaoController(HttpAuthService(), TokenStorage());
  // Restaura a sessão (token salvo) em segundo plano; a tela reage via ChangeNotifier.
  sessao.restaurar();

  runApp(GraoCestaApp(repositorio: HttpCatalogoRepository(), sessao: sessao));
}

class GraoCestaApp extends StatelessWidget {
  final CatalogoRepository repositorio;
  final SessaoController sessao;

  const GraoCestaApp({super.key, required this.repositorio, required this.sessao});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Grão & Cesta',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: CatalogoPage(repositorio: repositorio, sessao: sessao),
    );
  }
}
