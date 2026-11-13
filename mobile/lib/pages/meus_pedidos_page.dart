import 'package:flutter/material.dart';

import '../models/cesta.dart';
import '../models/pedido.dart';
import '../services/pedidos_service.dart';
import '../state/sessao_controller.dart';
import '../widgets/estado_tela.dart';
import '../widgets/pedido_tile.dart';

/// Histórico de pedidos do cliente logado (GET /pedidos/meus).
class MeusPedidosPage extends StatefulWidget {
  final SessaoController sessao;
  final PedidosService pedidos;
  final List<Cesta> cestas;

  const MeusPedidosPage({
    super.key,
    required this.sessao,
    required this.pedidos,
    required this.cestas,
  });

  @override
  State<MeusPedidosPage> createState() => _MeusPedidosPageState();
}

class _MeusPedidosPageState extends State<MeusPedidosPage> {
  late Future<List<Pedido>> _futuro;

  @override
  void initState() {
    super.initState();
    _futuro = _buscar();
  }

  Future<List<Pedido>> _buscar() => widget.pedidos.meus(widget.sessao.token ?? '');

  Future<void> _recarregar() async {
    setState(() => _futuro = _buscar());
    await _futuro.catchError((_) => <Pedido>[]);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: appBarPadrao('Meus pedidos'),
      body: FutureBuilder<List<Pedido>>(
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
                ? ListView(children: const [
                    VazioTela('Você ainda não fez nenhum pedido.',
                        icone: Icons.receipt_long_outlined),
                  ])
                : ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: lista.length,
                    itemBuilder: (_, i) => PedidoTile(
                      pedido: lista[i],
                      nomeCesta: nomeDaCesta(widget.cestas, lista[i].cestaId),
                    ),
                  ),
          );
        },
      ),
    );
  }
}
