import 'package:flutter/material.dart';

import '../models/cesta.dart';
import '../models/pedido.dart';
import '../models/produto.dart';
import '../services/admin_catalogo_service.dart';
import '../services/catalogo_service.dart';
import '../services/pedidos_service.dart';
import '../state/sessao_controller.dart';
import '../theme/app_theme.dart';
import '../widgets/estado_tela.dart';
import '../widgets/formatar.dart';
import '../widgets/pedido_tile.dart';

/// Painel do administrador: gestão de pedidos, produtos e cestas.
class AdminPage extends StatelessWidget {
  final SessaoController sessao;
  final PedidosService pedidos;
  final CatalogoRepository catalogo;
  final AdminCatalogoService admin;

  const AdminPage({
    super.key,
    required this.sessao,
    required this.pedidos,
    required this.catalogo,
    required this.admin,
  });

  @override
  Widget build(BuildContext context) {
    final token = sessao.token ?? '';
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: appBarPadrao(
          'Painel administrativo',
          bottom: const TabBar(
            labelColor: AppCores.ouroEscuro,
            indicatorColor: AppCores.ouro,
            tabs: [
              Tab(icon: Icon(Icons.receipt_long_outlined), text: 'Pedidos'),
              Tab(icon: Icon(Icons.inventory_2_outlined), text: 'Produtos'),
              Tab(icon: Icon(Icons.shopping_basket_outlined), text: 'Cestas'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _PedidosAdmin(token: token, pedidos: pedidos, catalogo: catalogo),
            _ProdutosAdmin(token: token, catalogo: catalogo, admin: admin),
            _CestasAdmin(token: token, catalogo: catalogo, admin: admin),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════ PEDIDOS ═══════════════════════════════

class _PedidosAdmin extends StatefulWidget {
  final String token;
  final PedidosService pedidos;
  final CatalogoRepository catalogo;

  const _PedidosAdmin({required this.token, required this.pedidos, required this.catalogo});

  @override
  State<_PedidosAdmin> createState() => _PedidosAdminState();
}

class _PedidosAdminState extends State<_PedidosAdmin> {
  String? _filtro; // null = todos
  bool _carregando = true;
  String? _erro;
  List<Pedido> _lista = const [];
  List<Cesta> _cestas = const [];

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
      final lista = _filtro == null
          ? await widget.pedidos.todos(widget.token)
          : await widget.pedidos.porStatus(widget.token, _filtro!);
      if (_cestas.isEmpty) _cestas = await widget.catalogo.listarCestas();
      if (!mounted) return;
      setState(() {
        _lista = lista;
        _carregando = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _erro = mensagemDeErro(e);
        _carregando = false;
      });
    }
  }

  Future<void> _executar(Future<void> Function() acao, String sucesso) async {
    try {
      await acao();
      if (!mounted) return;
      avisar(context, sucesso);
      _carregar();
    } catch (e) {
      if (mounted) avisar(context, mensagemDeErro(e));
    }
  }

  Future<void> _verDetalhes(Pedido p) async {
    try {
      final completo = await widget.pedidos.buscar(widget.token, p.id);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text('Pedido #${completo.id}'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Cesta: ${nomeDaCesta(_cestas, completo.cestaId)}'),
                Text('Cliente: ${completo.clienteNome}'),
                Text('Telefone: ${completo.telefone}'),
                Text('Endereço: ${completo.enderecoEntrega}'),
                Text('Status: ${rotuloStatus(completo.status)}'),
                Text('Total: ${formatarPreco(completo.valorTotal)}'),
                if (completo.observacoes.isNotEmpty) Text('Obs.: ${completo.observacoes}'),
                const SizedBox(height: 8),
                Text('Itens adicionais: ${completo.itens.isEmpty ? 'nenhum' : ''}'),
                for (final i in completo.itens)
                  Text('• Produto #${i.produtoId} × ${i.quantidade}'),
              ],
            ),
          ),
          actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Fechar'))],
        ),
      );
    } catch (e) {
      if (mounted) avisar(context, mensagemDeErro(e));
    }
  }

  Future<void> _editar(Pedido p) async {
    final editado = await showDialog<Pedido>(
      context: context,
      builder: (_) => _PedidoForm(pedido: p),
    );
    if (editado == null) return;
    _executar(() => widget.pedidos.atualizar(widget.token, editado), 'Pedido atualizado.');
  }

  Future<void> _excluir(Pedido p) async {
    if (!await confirmar(context, 'Excluir pedido', 'Excluir o pedido #${p.id}?')) return;
    _executar(() => widget.pedidos.excluir(widget.token, p.id), 'Pedido excluído.');
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 56,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            children: [
              _chip(null, 'Todos'),
              for (final e in statusPedido.entries) _chip(e.key, e.value),
            ],
          ),
        ),
        Expanded(
          child: _carregando
              ? const CarregandoTela()
              : _erro != null
                  ? ErroTela(mensagem: _erro!, onTentarDeNovo: _carregar)
                  : RefreshIndicator(
                      onRefresh: _carregar,
                      child: _lista.isEmpty
                          ? ListView(children: const [VazioTela('Nenhum pedido encontrado.')])
                          : ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              itemCount: _lista.length,
                              itemBuilder: (_, i) => _tile(_lista[i]),
                            ),
                    ),
        ),
      ],
    );
  }

  Widget _chip(String? valor, String rotulo) => Padding(
        padding: const EdgeInsets.only(right: 8),
        child: ChoiceChip(
          label: Text(rotulo),
          selected: _filtro == valor,
          onSelected: (_) {
            setState(() => _filtro = valor);
            _carregar();
          },
        ),
      );

  Widget _tile(Pedido p) => PedidoTile(
        pedido: p,
        nomeCesta: nomeDaCesta(_cestas, p.cestaId),
        acoes: Row(
          children: [
            Expanded(
              child: DropdownButton<String>(
                value: statusPedido.containsKey(p.status) ? p.status : null,
                isExpanded: true,
                underline: const SizedBox.shrink(),
                hint: const Text('Mudar status'),
                items: [
                  for (final e in statusPedido.entries)
                    DropdownMenuItem(value: e.key, child: Text(e.value)),
                ],
                onChanged: (novo) {
                  if (novo == null || novo == p.status) return;
                  _executar(() => widget.pedidos.alterarStatus(widget.token, p.id, novo),
                      'Status alterado para ${rotuloStatus(novo)}.');
                },
              ),
            ),
            IconButton(
                tooltip: 'Detalhes',
                onPressed: () => _verDetalhes(p),
                icon: const Icon(Icons.visibility_outlined)),
            IconButton(
                tooltip: 'Editar',
                onPressed: () => _editar(p),
                icon: const Icon(Icons.edit_outlined)),
            IconButton(
                tooltip: 'Excluir',
                onPressed: () => _excluir(p),
                icon: const Icon(Icons.delete_outline, color: AppCores.perigo)),
          ],
        ),
      );
}

class _PedidoForm extends StatefulWidget {
  final Pedido pedido;
  const _PedidoForm({required this.pedido});

  @override
  State<_PedidoForm> createState() => _PedidoFormState();
}

class _PedidoFormState extends State<_PedidoForm> {
  final _form = GlobalKey<FormState>();
  late final _nome = TextEditingController(text: widget.pedido.clienteNome);
  late final _telefone = TextEditingController(text: widget.pedido.telefone);
  late final _endereco = TextEditingController(text: widget.pedido.enderecoEntrega);
  late final _obs = TextEditingController(text: widget.pedido.observacoes);
  late final _valor =
      TextEditingController(text: widget.pedido.valorTotal.toStringAsFixed(2));

  @override
  void dispose() {
    for (final c in [_nome, _telefone, _endereco, _obs, _valor]) {
      c.dispose();
    }
    super.dispose();
  }

  void _salvar() {
    if (!_form.currentState!.validate()) return;
    final p = widget.pedido;
    Navigator.pop(
      context,
      Pedido(
        id: p.id,
        cestaId: p.cestaId,
        clienteNome: _nome.text.trim(),
        telefone: _telefone.text.trim(),
        enderecoEntrega: _endereco.text.trim(),
        status: p.status,
        valorTotal: lerNumero(_valor.text)!,
        observacoes: _obs.text.trim(),
        criadoEm: p.criadoEm,
        itens: p.itens,
      ),
    );
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
        title: Text('Editar pedido #${widget.pedido.id}'),
        content: Form(
          key: _form,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                campoForm(_nome, 'Cliente'),
                campoForm(_telefone, 'Telefone'),
                campoForm(_endereco, 'Endereço'),
                campoForm(_valor, 'Valor total (R\$)', numero: true, obrigatorio: true),
                campoForm(_obs, 'Observações', linhas: 2),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
          FilledButton(onPressed: _salvar, child: const Text('Salvar')),
        ],
      );
}

// ═══════════════════════════════ PRODUTOS ═══════════════════════════════

class _ProdutosAdmin extends StatefulWidget {
  final String token;
  final CatalogoRepository catalogo;
  final AdminCatalogoService admin;

  const _ProdutosAdmin({required this.token, required this.catalogo, required this.admin});

  @override
  State<_ProdutosAdmin> createState() => _ProdutosAdminState();
}

class _ProdutosAdminState extends State<_ProdutosAdmin> {
  late Future<List<Produto>> _futuro;

  @override
  void initState() {
    super.initState();
    _futuro = widget.catalogo.listarProdutos();
  }

  Future<void> _recarregar() async {
    setState(() => _futuro = widget.catalogo.listarProdutos());
    await _futuro.catchError((_) => <Produto>[]);
  }

  Future<void> _formulario([Produto? p]) async {
    final dados = await showDialog<_DadosProduto>(
      context: context,
      builder: (_) => _ProdutoForm(produto: p),
    );
    if (dados == null) return;
    try {
      if (p == null) {
        await widget.admin.criarProduto(widget.token,
            nome: dados.nome, descricao: dados.descricao, preco: dados.preco, estoque: dados.estoque);
      } else {
        await widget.admin.atualizarProduto(widget.token, p.id,
            nome: dados.nome, descricao: dados.descricao, preco: dados.preco, estoque: dados.estoque);
      }
      if (!mounted) return;
      avisar(context, p == null ? 'Produto criado.' : 'Produto atualizado.');
      _recarregar();
    } catch (e) {
      if (mounted) avisar(context, mensagemDeErro(e));
    }
  }

  Future<void> _excluir(Produto p) async {
    if (!await confirmar(context, 'Excluir produto', 'Excluir "${p.nome}"?')) return;
    try {
      await widget.admin.excluirProduto(widget.token, p.id);
      if (!mounted) return;
      avisar(context, 'Produto excluído.');
      _recarregar();
    } catch (e) {
      if (mounted) avisar(context, mensagemDeErro(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _formulario(),
        icon: const Icon(Icons.add),
        label: const Text('Novo produto'),
      ),
      body: FutureBuilder<List<Produto>>(
        future: _futuro,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const CarregandoTela();
          if (snap.hasError) {
            return ErroTela(mensagem: mensagemDeErro(snap.error!), onTentarDeNovo: _recarregar);
          }
          final lista = snap.data!;
          return RefreshIndicator(
            onRefresh: _recarregar,
            child: lista.isEmpty
                ? ListView(children: const [VazioTela('Nenhum produto cadastrado.')])
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(12, 12, 12, 88),
                    itemCount: lista.length,
                    itemBuilder: (_, i) {
                      final p = lista[i];
                      return Card(
                        child: ListTile(
                          title: Text(p.nome, style: const TextStyle(fontWeight: FontWeight.w700)),
                          subtitle: Text(
                              '${formatarPreco(p.preco)} • Estoque: ${p.quantidadeEstoque}'
                              '${p.descricao.isEmpty ? '' : '\n${p.descricao}'}'),
                          isThreeLine: p.descricao.isNotEmpty,
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                  tooltip: 'Editar',
                                  onPressed: () => _formulario(p),
                                  icon: const Icon(Icons.edit_outlined)),
                              IconButton(
                                  tooltip: 'Excluir',
                                  onPressed: () => _excluir(p),
                                  icon: const Icon(Icons.delete_outline, color: AppCores.perigo)),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          );
        },
      ),
    );
  }
}

class _DadosProduto {
  final String nome;
  final String descricao;
  final double preco;
  final int estoque;
  const _DadosProduto(this.nome, this.descricao, this.preco, this.estoque);
}

class _ProdutoForm extends StatefulWidget {
  final Produto? produto;
  const _ProdutoForm({this.produto});

  @override
  State<_ProdutoForm> createState() => _ProdutoFormState();
}

class _ProdutoFormState extends State<_ProdutoForm> {
  final _form = GlobalKey<FormState>();
  late final _nome = TextEditingController(text: widget.produto?.nome);
  late final _descricao = TextEditingController(text: widget.produto?.descricao);
  late final _preco = TextEditingController(text: widget.produto?.preco.toStringAsFixed(2));
  late final _estoque =
      TextEditingController(text: widget.produto?.quantidadeEstoque.toString() ?? '1');

  @override
  void dispose() {
    for (final c in [_nome, _descricao, _preco, _estoque]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
        title: Text(widget.produto == null ? 'Novo produto' : 'Editar produto'),
        content: Form(
          key: _form,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                campoForm(_nome, 'Nome', obrigatorio: true),
                campoForm(_descricao, 'Descrição', linhas: 2),
                campoForm(_preco, 'Preço (R\$)', numero: true, obrigatorio: true),
                campoForm(_estoque, 'Quantidade em estoque', inteiro: true, obrigatorio: true),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
          FilledButton(
            onPressed: () {
              if (!_form.currentState!.validate()) return;
              Navigator.pop(
                context,
                _DadosProduto(_nome.text, _descricao.text, lerNumero(_preco.text)!,
                    int.parse(_estoque.text.trim())),
              );
            },
            child: const Text('Salvar'),
          ),
        ],
      );
}

// ═══════════════════════════════ CESTAS ═══════════════════════════════

class _CestasAdmin extends StatefulWidget {
  final String token;
  final CatalogoRepository catalogo;
  final AdminCatalogoService admin;

  const _CestasAdmin({required this.token, required this.catalogo, required this.admin});

  @override
  State<_CestasAdmin> createState() => _CestasAdminState();
}

class _CestasAdminState extends State<_CestasAdmin> {
  late Future<List<Cesta>> _futuro;
  List<Produto> _produtos = const [];

  @override
  void initState() {
    super.initState();
    _futuro = _buscar();
  }

  Future<List<Cesta>> _buscar() async {
    _produtos = await widget.catalogo.listarProdutos();
    return widget.catalogo.listarCestas();
  }

  Future<void> _recarregar() async {
    setState(() => _futuro = _buscar());
    await _futuro.catchError((_) => <Cesta>[]);
  }

  Future<void> _rodar(Future<void> Function() acao, String sucesso) async {
    try {
      await acao();
      if (!mounted) return;
      avisar(context, sucesso);
      _recarregar();
    } catch (e) {
      if (mounted) avisar(context, mensagemDeErro(e));
    }
  }

  Future<void> _formulario([Cesta? c]) async {
    final dados = await showDialog<_DadosCesta>(
      context: context,
      builder: (_) => _CestaForm(cesta: c, produtos: _produtos),
    );
    if (dados == null) return;
    if (c == null) {
      _rodar(
          () => widget.admin.criarCesta(widget.token,
              nome: dados.nome,
              descricao: dados.descricao,
              preco: dados.preco,
              produtoIds: dados.produtoIds),
          'Cesta criada.');
    } else {
      _rodar(
          () => widget.admin.atualizarCesta(widget.token, c.id,
              nome: dados.nome, descricao: dados.descricao, preco: dados.preco),
          'Cesta atualizada.');
    }
  }

  Future<void> _excluir(Cesta c) async {
    if (!await confirmar(context, 'Excluir cesta', 'Excluir "${c.nome}"?')) return;
    _rodar(() => widget.admin.excluirCesta(widget.token, c.id), 'Cesta excluída.');
  }

  Future<void> _itens(Cesta c) async {
    await showDialog<void>(
      context: context,
      builder: (_) => _ItensCestaDialog(
        cestaId: c.id,
        token: widget.token,
        admin: widget.admin,
        produtos: _produtos,
      ),
    );
    _recarregar();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _formulario(),
        icon: const Icon(Icons.add),
        label: const Text('Nova cesta'),
      ),
      body: FutureBuilder<List<Cesta>>(
        future: _futuro,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const CarregandoTela();
          if (snap.hasError) {
            return ErroTela(mensagem: mensagemDeErro(snap.error!), onTentarDeNovo: _recarregar);
          }
          final lista = snap.data!;
          return RefreshIndicator(
            onRefresh: _recarregar,
            child: lista.isEmpty
                ? ListView(children: const [VazioTela('Nenhuma cesta cadastrada.')])
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(12, 12, 12, 88),
                    itemCount: lista.length,
                    itemBuilder: (_, i) {
                      final c = lista[i];
                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(c.nome,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w800, fontSize: 16)),
                              if (c.descricao.isNotEmpty)
                                Text(c.descricao,
                                    style: const TextStyle(color: AppCores.textoSuave)),
                              const SizedBox(height: 4),
                              Text('${formatarPreco(c.preco)} • ${c.totalItens} item(ns)'),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  TextButton.icon(
                                    onPressed: () => _itens(c),
                                    icon: const Icon(Icons.list_alt),
                                    label: const Text('Itens'),
                                  ),
                                  IconButton(
                                      tooltip: 'Editar',
                                      onPressed: () => _formulario(c),
                                      icon: const Icon(Icons.edit_outlined)),
                                  IconButton(
                                      tooltip: 'Excluir',
                                      onPressed: () => _excluir(c),
                                      icon: const Icon(Icons.delete_outline,
                                          color: AppCores.perigo)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          );
        },
      ),
    );
  }
}

class _DadosCesta {
  final String nome;
  final String descricao;
  final double preco;
  final List<String> produtoIds;
  const _DadosCesta(this.nome, this.descricao, this.preco, this.produtoIds);
}

class _CestaForm extends StatefulWidget {
  final Cesta? cesta;
  final List<Produto> produtos;
  const _CestaForm({this.cesta, required this.produtos});

  @override
  State<_CestaForm> createState() => _CestaFormState();
}

class _CestaFormState extends State<_CestaForm> {
  final _form = GlobalKey<FormState>();
  late final _nome = TextEditingController(text: widget.cesta?.nome);
  late final _descricao = TextEditingController(text: widget.cesta?.descricao);
  late final _preco = TextEditingController(text: widget.cesta?.preco.toStringAsFixed(2));
  final Set<String> _selecionados = {};

  bool get _nova => widget.cesta == null;

  @override
  void dispose() {
    for (final c in [_nome, _descricao, _preco]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
        title: Text(_nova ? 'Nova cesta' : 'Editar cesta'),
        content: SizedBox(
          width: 420,
          child: Form(
            key: _form,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  campoForm(_nome, 'Nome', obrigatorio: true),
                  campoForm(_descricao, 'Descrição', linhas: 2),
                  campoForm(_preco, 'Preço base (R\$)', numero: true, obrigatorio: true),
                  if (_nova) ...[
                    const Padding(
                      padding: EdgeInsets.only(top: 4, bottom: 4),
                      child: Text('Produtos da cesta',
                          style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                    for (final p in widget.produtos)
                      CheckboxListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        value: _selecionados.contains(p.id),
                        title: Text(p.nome),
                        onChanged: (v) => setState(() =>
                            v == true ? _selecionados.add(p.id) : _selecionados.remove(p.id)),
                      ),
                  ] else
                    const Text('Para alterar os produtos use o botão "Itens".',
                        style: TextStyle(color: AppCores.textoSuave)),
                ],
              ),
            ),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
          FilledButton(
            onPressed: () {
              if (!_form.currentState!.validate()) return;
              Navigator.pop(
                context,
                _DadosCesta(_nome.text, _descricao.text, lerNumero(_preco.text)!,
                    _selecionados.toList()),
              );
            },
            child: const Text('Salvar'),
          ),
        ],
      );
}

/// Adiciona e remove produtos de uma cesta existente.
class _ItensCestaDialog extends StatefulWidget {
  final String cestaId;
  final String token;
  final AdminCatalogoService admin;
  final List<Produto> produtos;

  const _ItensCestaDialog({
    required this.cestaId,
    required this.token,
    required this.admin,
    required this.produtos,
  });

  @override
  State<_ItensCestaDialog> createState() => _ItensCestaDialogState();
}

class _ItensCestaDialogState extends State<_ItensCestaDialog> {
  Cesta? _cesta;
  String? _erro;
  bool _ocupado = false;
  String? _novoProduto;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    try {
      final c = await widget.admin.buscarCesta(widget.cestaId);
      if (mounted) setState(() => _cesta = c);
    } catch (e) {
      if (mounted) setState(() => _erro = mensagemDeErro(e));
    }
  }

  String _nomeProduto(String id) {
    for (final p in widget.produtos) {
      if (p.id == id) return p.nome;
    }
    return 'Produto #$id';
  }

  Future<void> _rodar(Future<void> Function() acao) async {
    setState(() => _ocupado = true);
    try {
      await acao();
      await _carregar();
    } catch (e) {
      if (mounted) avisar(context, mensagemDeErro(e));
    } finally {
      if (mounted) setState(() => _ocupado = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cesta = _cesta;
    return AlertDialog(
      title: Text(cesta == null ? 'Itens da cesta' : 'Itens — ${cesta.nome}'),
      content: SizedBox(
        width: 420,
        child: _erro != null
            ? Text(_erro!)
            : cesta == null
                ? const SizedBox(height: 80, child: Center(child: CircularProgressIndicator()))
                : Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (cesta.itens.isEmpty)
                        const Padding(
                          padding: EdgeInsets.all(8),
                          child: Text('Cesta sem produtos.'),
                        ),
                      Flexible(
                        child: ListView(
                          shrinkWrap: true,
                          children: [
                            for (final item in cesta.itens)
                              ListTile(
                                dense: true,
                                title: Text(_nomeProduto(item.produtoId)),
                                trailing: IconButton(
                                  tooltip: 'Remover da cesta',
                                  onPressed: _ocupado
                                      ? null
                                      : () => _rodar(() => widget.admin.removerItemCesta(
                                          widget.token, cesta.id, item.id)),
                                  icon: const Icon(Icons.remove_circle_outline,
                                      color: AppCores.perigo),
                                ),
                              ),
                          ],
                        ),
                      ),
                      const Divider(),
                      Row(
                        children: [
                          Expanded(
                            child: DropdownButton<String>(
                              value: _novoProduto,
                              isExpanded: true,
                              hint: const Text('Adicionar produto'),
                              items: [
                                for (final p in widget.produtos)
                                  DropdownMenuItem(value: p.id, child: Text(p.nome)),
                              ],
                              onChanged: (v) => setState(() => _novoProduto = v),
                            ),
                          ),
                          IconButton.filled(
                            tooltip: 'Adicionar',
                            onPressed: _ocupado || _novoProduto == null
                                ? null
                                : () => _rodar(() => widget.admin.adicionarItemCesta(
                                    widget.token, cesta.id, _novoProduto!)),
                            icon: const Icon(Icons.add),
                          ),
                        ],
                      ),
                    ],
                  ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Fechar')),
      ],
    );
  }
}

// ═══════════════════════════════ HELPERS ═══════════════════════════════

/// Aceita "12,50" ou "12.50".
double? lerNumero(String texto) => double.tryParse(texto.trim().replaceAll(',', '.'));

Widget campoForm(
  TextEditingController c,
  String rotulo, {
  bool obrigatorio = false,
  bool numero = false,
  bool inteiro = false,
  int linhas = 1,
}) =>
    Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: c,
        maxLines: linhas,
        keyboardType: numero || inteiro
            ? const TextInputType.numberWithOptions(decimal: true)
            : null,
        decoration: InputDecoration(labelText: rotulo, border: const OutlineInputBorder()),
        validator: (v) {
          final t = v?.trim() ?? '';
          if (obrigatorio && t.isEmpty) return 'Campo obrigatório.';
          if (t.isNotEmpty && numero && (lerNumero(t) == null || lerNumero(t)! < 0)) {
            return 'Número inválido.';
          }
          if (t.isNotEmpty && inteiro && (int.tryParse(t) == null || int.parse(t) < 0)) {
            return 'Número inteiro inválido.';
          }
          return null;
        },
      ),
    );
