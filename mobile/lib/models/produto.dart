/// Espelha o formato retornado por GET /produtos (back/produtos, mapProduto).
class Produto {
  final String id;
  final String nome;
  final String descricao;
  final double preco;
  final int quantidadeEstoque;

  const Produto({
    required this.id,
    required this.nome,
    required this.descricao,
    required this.preco,
    required this.quantidadeEstoque,
  });

  bool get ativo => quantidadeEstoque > 0;
  bool get estoqueBaixo => ativo && quantidadeEstoque < 10;

  factory Produto.fromJson(Map<String, dynamic> json) => Produto(
        id: json['id'].toString(),
        nome: json['nome'] as String,
        descricao: (json['descricao'] as String?) ?? '',
        preco: (json['preco'] as num).toDouble(),
        quantidadeEstoque: (json['quantidadeEstoque'] as num?)?.toInt() ?? 0,
      );
}
