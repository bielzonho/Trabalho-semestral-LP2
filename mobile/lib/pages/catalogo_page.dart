import 'package:flutter/material.dart';

import '../data/mock_dados.dart';
import '../theme/app_theme.dart';
import '../widgets/cesta_card.dart';
import '../widgets/produto_card.dart';
import '../widgets/secao_titulo.dart';

class CatalogoPage extends StatefulWidget {
  const CatalogoPage({super.key});

  @override
  State<CatalogoPage> createState() => _CatalogoPageState();
}

class _CatalogoPageState extends State<CatalogoPage> {
  int _itensNoPedido = 0;

  void _adicionar(String nome) {
    setState(() => _itensNoPedido++);
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text('$nome adicionado ao pedido')));
  }

  /// Número de colunas conforme a largura disponível.
  int _colunas(double largura, {required double minimo}) =>
      (largura / minimo).floor().clamp(1, 4);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppCores.creme,
        surfaceTintColor: Colors.transparent,
        title: const Text(
          'Grão & Cesta',
          style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: 0.3),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Badge(
              isLabelVisible: _itensNoPedido > 0,
              label: Text('$_itensNoPedido'),
              child: const Icon(Icons.shopping_basket_outlined),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1100),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const _Banner(),
                  const SecaoTitulo(
                    'Catálogo de Cestas',
                    subtitulo: 'Montadas com carinho para o seu café da manhã.',
                  ),
                  LayoutBuilder(
                    builder: (context, c) => GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: _colunas(c.maxWidth, minimo: 300),
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 16,
                      childAspectRatio: 0.82,
                      children: [
                        for (final cesta in cestasMock)
                          CestaCard(
                            cesta: cesta,
                            onAdicionar: () => _adicionar(cesta.nome),
                          ),
                      ],
                    ),
                  ),
                  const SecaoTitulo(
                    'Produtos Disponíveis',
                    subtitulo: 'Complete a sua cesta com itens avulsos.',
                  ),
                  LayoutBuilder(
                    builder: (context, c) => GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: _colunas(c.maxWidth, minimo: 280),
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 16,
                      childAspectRatio: 1.6,
                      children: [
                        for (final p in produtosMock)
                          ProdutoCard(
                            produto: p,
                            onAdicionar: () => _adicionar(p.nome),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Banner extends StatelessWidget {
  const _Banner();

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context).textTheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: const LinearGradient(
          colors: [AppCores.ouro, AppCores.ouroEscuro],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Café da manhã especial',
            style: tema.headlineMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Escolha uma cesta pronta ou monte o seu pedido com produtos frescos.',
            style: tema.bodyLarge?.copyWith(color: Colors.white70),
          ),
        ],
      ),
    );
  }
}
