/// Espelha o formato retornado por GET /cestas (back/catalogo-cestas, mapCesta).
class Cesta {
  final String id;
  final String nome;
  final String descricao;
  final double preco;
  final int totalItens;
  final String imagem;

  const Cesta({
    required this.id,
    required this.nome,
    required this.descricao,
    required this.preco,
    required this.totalItens,
    required this.imagem,
  });
}
