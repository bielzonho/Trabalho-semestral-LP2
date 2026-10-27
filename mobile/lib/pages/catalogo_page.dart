import 'package:flutter/material.dart';

import '../models/cesta.dart';
import '../models/produto.dart';
import '../services/api_client.dart';
import '../services/catalogo_service.dart';
import '../state/sessao_controller.dart';
import '../theme/app_theme.dart';
import '../widgets/cesta_card.dart';
import '../widgets/produto_card.dart';
import '../widgets/secao_titulo.dart';
import 'login_page.dart';

class CatalogoPage extends StatefulWidget {
  final CatalogoRepository repositorio;
  final SessaoController sessao;

  const CatalogoPage({
    super.key,
    required this.repositorio,
    required this.sessao,
  });

  @override
  State<CatalogoPage> createState() => _CatalogoPageState();
}

class _CatalogoPageState extends State<CatalogoPage> {
  int _itensNoPedido = 0;

  bool _carregando = true;
  String? _erro;
  List<Cesta> _cestas = const [];
  List<Produto> _produtos = const [];

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    setState(() {
      _carregando = true;
      _erro = null;
    });
    try {
      final resultados = await Future.wait([
        widget.repositorio.listarCestas(),
        widget.repositorio.listarProdutos(),
      ]);
      if (!mounted) return;
      setState(() {
        _cestas = resultados[0] as List<Cesta>;
        _produtos = resultados[1] as List<Produto>;
        _carregando = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _erro = e.mensagem;
        _carregando = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _erro = 'Não foi possível carregar o catálogo.';
        _carregando = false;
      });
    }
  }

  void _adicionar(String nome) {
    setState(() => _itensNoPedido++);
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text('$nome adicionado ao pedido')));
  }

  Future<void> _abrirLogin() async {
    final entrou = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => LoginPage(sessao: widget.sessao)),
    );
    if (entrou == true && mounted) {
      final nome = widget.sessao.usuario?.nome ?? '';
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text('Bem-vindo, $nome!')));
    }
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
          ListenableBuilder(
            listenable: widget.sessao,
            builder: (context, _) {
              final usuario = widget.sessao.usuario;
              if (usuario == null) {
                return TextButton.icon(
                  onPressed: _abrirLogin,
                  icon: const Icon(Icons.person_outline),
                  label: const Text('Entrar'),
                );
              }
              return Row(
                children: [
                  Text(
                    'Olá, ${usuario.nome.split(' ').first}',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  TextButton(
                    onPressed: widget.sessao.sair,
                    child: const Text('Sair'),
                  ),
                ],
              );
            },
          ),
          Padding(
            padding: const EdgeInsets.only(left: 4, right: 16),
            child: Badge(
              isLabelVisible: _itensNoPedido > 0,
              label: Text('$_itensNoPedido'),
              child: const Icon(Icons.shopping_basket_outlined),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _carregar,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1100),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _Banner(),
                    if (_carregando)
                      const _Carregando()
                    else if (_erro != null)
                      _Erro(mensagem: _erro!, onTentarDeNovo: _carregar)
                    else
                      ..._conteudo(),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _conteudo() => [
        const SecaoTitulo(
          'Catálogo de Cestas',
          subtitulo: 'Montadas com carinho para o seu café da manhã.',
        ),
        if (_cestas.isEmpty)
          const _Vazio('Nenhuma cesta disponível no momento.')
        else
          LayoutBuilder(
            builder: (context, c) => GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: _colunas(c.maxWidth, minimo: 300),
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              childAspectRatio: 0.82,
              children: [
                for (final cesta in _cestas)
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
        if (_produtos.isEmpty)
          const _Vazio('Nenhum produto disponível no momento.')
        else
          LayoutBuilder(
            builder: (context, c) => GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: _colunas(c.maxWidth, minimo: 280),
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              childAspectRatio: 1.6,
              children: [
                for (final p in _produtos)
                  ProdutoCard(
                    produto: p,
                    onAdicionar: () => _adicionar(p.nome),
                  ),
              ],
            ),
          ),
      ];
}

class _Carregando extends StatelessWidget {
  const _Carregando();

  @override
  Widget build(BuildContext context) => const Padding(
        padding: EdgeInsets.symmetric(vertical: 80),
        child: Center(child: CircularProgressIndicator(color: AppCores.ouro)),
      );
}

class _Vazio extends StatelessWidget {
  final String texto;
  const _Vazio(this.texto);

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Text(texto, style: const TextStyle(color: AppCores.textoSuave)),
      );
}

class _Erro extends StatelessWidget {
  final String mensagem;
  final VoidCallback onTentarDeNovo;

  const _Erro({required this.mensagem, required this.onTentarDeNovo});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Center(
        child: Column(
          children: [
            const Icon(Icons.cloud_off_outlined, size: 48, color: AppCores.textoSuave),
            const SizedBox(height: 12),
            Text(mensagem, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onTentarDeNovo,
              icon: const Icon(Icons.refresh),
              label: const Text('Tentar de novo'),
            ),
          ],
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
