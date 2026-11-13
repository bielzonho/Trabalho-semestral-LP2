/// Status possíveis de um pedido (back/pedidos/src/types/pedido.ts).
const statusPedido = <String, String>{
  'pendente': 'Pendente',
  'confirmado': 'Confirmado',
  'em_preparacao': 'Em preparação',
  'saiu_para_entrega': 'Saiu para entrega',
  'entregue': 'Entregue',
  'cancelado': 'Cancelado',
};

String rotuloStatus(String status) => statusPedido[status] ?? status;

class PedidoItem {
  final String produtoId;
  final int quantidade;

  const PedidoItem({required this.produtoId, required this.quantidade});

  factory PedidoItem.fromJson(Map<String, dynamic> json) => PedidoItem(
        produtoId: json['produtoId'].toString(),
        quantidade: (json['quantidade'] as num?)?.toInt() ?? 1,
      );

  Map<String, dynamic> toJson() => {'produtoId': produtoId, 'quantidade': quantidade};
}

/// Espelha o formato de mapPedido em back/pedidos.
class Pedido {
  final String id;
  final String cestaId;
  final String clienteNome;
  final String telefone;
  final String enderecoEntrega;
  final String status;
  final double valorTotal;
  final String observacoes;
  final String criadoEm;
  final List<PedidoItem> itens;

  const Pedido({
    required this.id,
    required this.cestaId,
    required this.clienteNome,
    required this.telefone,
    required this.enderecoEntrega,
    required this.status,
    required this.valorTotal,
    required this.observacoes,
    required this.criadoEm,
    this.itens = const [],
  });

  factory Pedido.fromJson(Map<String, dynamic> json) {
    final itens = json['itens'];
    return Pedido(
      id: json['id'].toString(),
      cestaId: (json['cestaId'] ?? '').toString(),
      clienteNome: (json['clienteNome'] as String?) ?? '',
      telefone: (json['clienteTelefone'] ?? json['telefone'] ?? '').toString(),
      enderecoEntrega: (json['enderecoEntrega'] as String?) ?? '',
      status: (json['status'] as String?) ?? 'pendente',
      valorTotal: ((json['valorTotal'] ?? 0) as num).toDouble(),
      observacoes: (json['observacoes'] as String?) ?? '',
      criadoEm: (json['criadoEm'] as String?) ?? '',
      itens: itens is List
          ? itens.map((e) => PedidoItem.fromJson(e as Map<String, dynamic>)).toList()
          : const [],
    );
  }

  /// Data no formato dd/mm/aaaa hh:mm (ou vazio se a API não mandou).
  String get dataFormatada {
    final d = DateTime.tryParse(criadoEm)?.toLocal();
    if (d == null) return '';
    String dois(int n) => n.toString().padLeft(2, '0');
    return '${dois(d.day)}/${dois(d.month)}/${d.year} ${dois(d.hour)}:${dois(d.minute)}';
  }
}
