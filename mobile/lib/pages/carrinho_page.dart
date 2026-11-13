import 'package:flutter/material.dart';

import '../models/cesta.dart';
import '../services/pedidos_service.dart';
import '../state/carrinho_controller.dart';
import '../state/sessao_controller.dart';
import '../theme/app_theme.dart';
import '../widgets/estado_tela.dart';
import '../widgets/formatar.dart';

/// Revisão do pedido e finalização (POST /pedidos).
class CarrinhoPage extends StatefulWidget {
  final CarrinhoController carrinho;
  final SessaoController sessao;
  final PedidosService pedidos;
  final List<Cesta> cestas;

  /// Abre o login; devolve true se o usuário entrou.
  final Future<bool> Function() pedirLogin;

  const CarrinhoPage({
    super.key,
    required this.carrinho,
    required this.sessao,
    required this.pedidos,
    required this.cestas,
    required this.pedirLogin,
  });

  @override
  State<CarrinhoPage> createState() => _CarrinhoPageState();
}

class _CarrinhoPageState extends State<CarrinhoPage> {
  final _formKey = GlobalKey<FormState>();
  final _nome = TextEditingController();
  final _telefone = TextEditingController();
  final _endereco = TextEditingController();
  final _observacoes = TextEditingController();
  bool _enviando = false;

  @override
  void initState() {
    super.initState();
    _nome.text = widget.sessao.usuario?.nome ?? '';
  }

  @override
  void dispose() {
    for (final c in [_nome, _telefone, _endereco, _observacoes]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _finalizar() async {
    final carrinho = widget.carrinho;
    if (carrinho.cesta == null) {
      avisar(context, 'Escolha uma cesta para o pedido.');
      return;
    }
    if (!_formKey.currentState!.validate()) return;

    if (!widget.sessao.logado) {
      final entrou = await widget.pedirLogin();
      if (!entrou || !mounted) return;
      if (_nome.text.isEmpty) _nome.text = widget.sessao.usuario?.nome ?? '';
    }

    setState(() => _enviando = true);
    try {
      final pedido = await widget.pedidos.criar(
        token: widget.sessao.token!,
        cestaId: carrinho.cesta!.id,
        valorTotal: double.parse(carrinho.valorTotal.toStringAsFixed(2)),
        itens: carrinho.itens,
        clienteNome: _nome.text.trim(),
        telefone: _telefone.text.trim(),
        enderecoEntrega: _endereco.text.trim(),
        observacoes: _observacoes.text.trim(),
      );
      if (!mounted) return;
      carrinho.limpar();
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          icon: const Icon(Icons.check_circle, color: Colors.green, size: 48),
          title: const Text('Pedido realizado!'),
          content: Text('Pedido nº ${pedido.id} registrado. '
              'Acompanhe o status em "Meus pedidos".'),
          actions: [
            FilledButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
          ],
        ),
      );
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      setState(() => _enviando = false);
      avisar(context, mensagemDeErro(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: appBarPadrao('Meu pedido'),
      body: ListenableBuilder(
        listenable: widget.carrinho,
        builder: (context, _) {
          final carrinho = widget.carrinho;
          return Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 640),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _secao('Cesta'),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      child: DropdownButtonFormField<String>(
                        key: ValueKey(carrinho.cesta?.id),
                        initialValue: carrinho.cesta?.id,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          hintText: 'Escolha a cesta base',
                        ),
                        items: [
                          for (final c in widget.cestas)
                            DropdownMenuItem(
                              value: c.id,
                              child: Text('${c.nome} — ${formatarPreco(c.preco)}',
                                  overflow: TextOverflow.ellipsis),
                            ),
                        ],
                        onChanged: _enviando
                            ? null
                            : (id) => carrinho.escolherCesta(
                                widget.cestas.firstWhere((c) => c.id == id)),
                      ),
                    ),
                  ),
                  _secao('Itens adicionais'),
                  if (carrinho.produtos.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: Text('Nenhum item avulso. Adicione produtos pelo catálogo.',
                          style: TextStyle(color: AppCores.textoSuave)),
                    )
                  else
                    Card(
                      child: Column(
                        children: [
                          for (final p in carrinho.produtos)
                            ListTile(
                              title: Text(p.nome),
                              subtitle: Text(formatarPreco(p.preco)),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    tooltip: 'Remover um',
                                    onPressed: _enviando ? null : () => carrinho.remover(p),
                                    icon: const Icon(Icons.remove_circle_outline),
                                  ),
                                  Text('${carrinho.quantidade(p)}',
                                      style: const TextStyle(fontWeight: FontWeight.w700)),
                                  IconButton(
                                    tooltip: 'Adicionar um',
                                    onPressed: _enviando ||
                                            carrinho.quantidade(p) >= p.quantidadeEstoque
                                        ? null
                                        : () => carrinho.adicionar(p),
                                    icon: const Icon(Icons.add_circle_outline),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                  _secao('Entrega'),
                  Form(
                    key: _formKey,
                    child: Column(
                      children: [
                        _campo(_nome, 'Nome de quem recebe', Icons.person_outline,
                            obrigatorio: true),
                        _campo(_telefone, 'Telefone', Icons.phone_outlined,
                            obrigatorio: true, teclado: TextInputType.phone),
                        _campo(_endereco, 'Endereço de entrega', Icons.home_outlined,
                            obrigatorio: true),
                        _campo(_observacoes, 'Observações (opcional)', Icons.notes,
                            linhas: 2),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Card(
                    color: AppCores.creme,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          const Text('Total',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                          const Spacer(),
                          Text(formatarPreco(carrinho.valorTotal),
                              style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w800,
                                  color: AppCores.ouroEscuro)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: _enviando ? null : _finalizar,
                    style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16)),
                    icon: _enviando
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child:
                                CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                        : const Icon(Icons.check),
                    label: Text(widget.sessao.logado
                        ? 'Finalizar pedido'
                        : 'Entrar e finalizar pedido'),
                  ),
                  if (!carrinho.vazio)
                    TextButton(
                      onPressed: _enviando ? null : carrinho.limpar,
                      child: const Text('Esvaziar pedido'),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _secao(String titulo) => Padding(
        padding: const EdgeInsets.only(top: 12, bottom: 8),
        child: Text(titulo,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
      );

  Widget _campo(
    TextEditingController c,
    String rotulo,
    IconData icone, {
    bool obrigatorio = false,
    TextInputType? teclado,
    int linhas = 1,
  }) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TextFormField(
          controller: c,
          enabled: !_enviando,
          keyboardType: teclado,
          maxLines: linhas,
          decoration: InputDecoration(
            labelText: rotulo,
            prefixIcon: Icon(icone),
            border: const OutlineInputBorder(),
            filled: true,
            fillColor: Colors.white,
          ),
          validator: obrigatorio
              ? (v) => (v == null || v.trim().isEmpty) ? 'Campo obrigatório.' : null
              : null,
        ),
      );
}
