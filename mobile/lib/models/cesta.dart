/// Item (produto) que compõe uma cesta: `id` é o vínculo cesta_itens.
class CestaItem {
  final String id;
  final String produtoId;

  const CestaItem({required this.id, required this.produtoId});

  factory CestaItem.fromJson(Map<String, dynamic> json) => CestaItem(
        id: json['id'].toString(),
        produtoId: json['produtoId'].toString(),
      );
}

/// Espelha o formato retornado por GET /cestas (back/catalogo-cestas, mapCesta).
class Cesta {
  final String id;
  final String nome;
  final String descricao;
  final double preco;
  final int totalItens;
  final String imagem;
  final List<CestaItem> itens;

  const Cesta({
    required this.id,
    required this.nome,
    required this.descricao,
    required this.preco,
    required this.totalItens,
    required this.imagem,
    this.itens = const [],
  });

  /// A API não traz imagem: escolhemos uma das fotos locais pelo nome.
  static String imagemPara(String nome) => nome.toLowerCase().contains('premium')
      ? 'assets/cesta_premium.jpg'
      : 'assets/cesta.jpg';

  factory Cesta.fromJson(Map<String, dynamic> json) {
    final nome = (json['nome'] as String?) ?? '';
    final preco = json['preco'] ?? json['precoBase'] ?? 0;
    final itens = json['itens'];
    return Cesta(
      id: json['id'].toString(),
      nome: nome,
      descricao: (json['descricao'] as String?) ?? '',
      preco: (preco as num).toDouble(),
      totalItens: (json['totalItens'] as num?)?.toInt() ??
          (itens is List ? itens.length : 0),
      imagem: imagemPara(nome),
      itens: itens is List
          ? itens.map((e) => CestaItem.fromJson(e as Map<String, dynamic>)).toList()
          : const [],
    );
  }
}
