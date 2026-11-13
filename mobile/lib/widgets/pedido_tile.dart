import 'package:flutter/material.dart';

import '../models/cesta.dart';
import '../models/pedido.dart';
import '../theme/app_theme.dart';
import 'formatar.dart';

String nomeDaCesta(List<Cesta> cestas, String id) {
  for (final c in cestas) {
    if (c.id == id) return c.nome;
  }
  return 'Cesta #$id';
}

Color corDoStatus(String status) => switch (status) {
      'pendente' => AppCores.alerta,
      'confirmado' => Colors.blue.shade700,
      'em_preparacao' => Colors.deepPurple,
      'saiu_para_entrega' => Colors.teal.shade700,
      'entregue' => Colors.green.shade700,
      'cancelado' => AppCores.perigo,
      _ => AppCores.textoSuave,
    };

class StatusChip extends StatelessWidget {
  final String status;
  const StatusChip(this.status, {super.key});

  @override
  Widget build(BuildContext context) {
    final cor = corDoStatus(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: cor.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(rotuloStatus(status),
          style: TextStyle(color: cor, fontWeight: FontWeight.w700, fontSize: 12)),
    );
  }
}

/// Cartão de um pedido. [acoes] aparece embaixo (usado no painel admin).
class PedidoTile extends StatelessWidget {
  final Pedido pedido;
  final String nomeCesta;
  final Widget? acoes;

  const PedidoTile({super.key, required this.pedido, required this.nomeCesta, this.acoes});

  @override
  Widget build(BuildContext context) {
    final p = pedido;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text('Pedido #${p.id}',
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                const Spacer(),
                StatusChip(p.status),
              ],
            ),
            const SizedBox(height: 6),
            Text(nomeCesta, style: const TextStyle(fontWeight: FontWeight.w600)),
            if (p.itens.isNotEmpty)
              Text('+ ${p.itens.length} item(ns) adicional(is)',
                  style: const TextStyle(color: AppCores.textoSuave)),
            if (p.clienteNome.isNotEmpty)
              Text('Para: ${p.clienteNome}${p.telefone.isEmpty ? '' : ' • ${p.telefone}'}',
                  style: const TextStyle(color: AppCores.textoSuave)),
            if (p.enderecoEntrega.isNotEmpty)
              Text(p.enderecoEntrega, style: const TextStyle(color: AppCores.textoSuave)),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(p.dataFormatada, style: const TextStyle(color: AppCores.textoSuave)),
                const Spacer(),
                Text(formatarPreco(p.valorTotal),
                    style: const TextStyle(
                        fontWeight: FontWeight.w800, color: AppCores.ouroEscuro)),
              ],
            ),
            if (acoes != null) ...[const Divider(), acoes!],
          ],
        ),
      ),
    );
  }
}
