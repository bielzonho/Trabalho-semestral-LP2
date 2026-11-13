import 'package:flutter/foundation.dart';

import '../models/cesta.dart';
import '../models/pedido.dart';
import '../models/produto.dart';

/// Pedido em montagem: uma cesta (exigida pelo back end) + produtos avulsos.
class CarrinhoController extends ChangeNotifier {
  Cesta? _cesta;
  final Map<String, Produto> _produtos = {};
  final Map<String, int> _quantidades = {};

  Cesta? get cesta => _cesta;
  bool get vazio => _cesta == null && _quantidades.isEmpty;

  List<Produto> get produtos => _produtos.values.toList();
  int quantidade(Produto p) => _quantidades[p.id] ?? 0;

  /// Total de itens (badge do ícone).
  int get totalItens =>
      (_cesta == null ? 0 : 1) + _quantidades.values.fold(0, (a, b) => a + b);

  double get valorTotal =>
      (_cesta?.preco ?? 0) +
      _produtos.values.fold(0.0, (soma, p) => soma + p.preco * quantidade(p));

  List<PedidoItem> get itens => [
        for (final p in _produtos.values)
          PedidoItem(produtoId: p.id, quantidade: quantidade(p)),
      ];

  void escolherCesta(Cesta? cesta) {
    _cesta = cesta;
    notifyListeners();
  }

  void adicionar(Produto p) {
    _produtos[p.id] = p;
    _quantidades[p.id] = quantidade(p) + 1;
    notifyListeners();
  }

  void remover(Produto p) {
    final q = quantidade(p) - 1;
    if (q <= 0) {
      _produtos.remove(p.id);
      _quantidades.remove(p.id);
    } else {
      _quantidades[p.id] = q;
    }
    notifyListeners();
  }

  void limpar() {
    _cesta = null;
    _produtos.clear();
    _quantidades.clear();
    notifyListeners();
  }
}
