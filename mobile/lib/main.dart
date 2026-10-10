import 'package:flutter/material.dart';

import 'pages/catalogo_page.dart';
import 'theme/app_theme.dart';

void main() => runApp(const GraoCestaApp());

class GraoCestaApp extends StatelessWidget {
  const GraoCestaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Grão & Cesta',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const CatalogoPage(),
    );
  }
}
