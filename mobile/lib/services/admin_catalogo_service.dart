import '../config/api_config.dart';
import '../models/cesta.dart';
import 'api_client.dart';

/// Operações de administrador sobre produtos (:3012) e cestas (:3010).
class AdminCatalogoService {
  final ApiClient _api;

  AdminCatalogoService([ApiClient? api]) : _api = api ?? ApiClient();

  String get _produtos => '${ApiConfig.produtos}/produtos';
  String get _cestas => '${ApiConfig.cestas}/cestas';

  // ── Produtos ─────────────────────────────────────────────

  Map<String, dynamic> _produto(String nome, String descricao, double preco, int estoque) => {
        'nome': nome.trim(),
        'descricao': descricao.trim(),
        'preco': preco,
        'quantidadeEstoque': estoque,
        'ativo': estoque > 0,
      };

  Future<void> criarProduto(String token,
          {required String nome, required String descricao, required double preco, required int estoque}) =>
      _api.post(_produtos, _produto(nome, descricao, preco, estoque), token: token);

  Future<void> atualizarProduto(String token, String id,
          {required String nome, required String descricao, required double preco, required int estoque}) =>
      _api.put('$_produtos/$id', _produto(nome, descricao, preco, estoque), token: token);

  Future<void> excluirProduto(String token, String id) =>
      _api.delete('$_produtos/$id', token: token);

  // ── Cestas ───────────────────────────────────────────────

  /// GET /cestas/:id traz a cesta com a lista de itens.
  Future<Cesta> buscarCesta(String id) async =>
      Cesta.fromJson(await _api.get('$_cestas/$id') as Map<String, dynamic>);

  Future<void> criarCesta(String token,
          {required String nome, required String descricao, required double preco, required List<String> produtoIds}) =>
      _api.post(
        _cestas,
        {
          'nome': nome.trim(),
          'descricao': descricao.trim(),
          'precoBase': preco,
          'itens': [for (final id in produtoIds) {'produtoId': id}],
        },
        token: token,
      );

  /// Atualiza só os dados básicos (itens são geridos por adicionar/remover).
  Future<void> atualizarCesta(String token, String id,
          {required String nome, required String descricao, required double preco}) =>
      _api.put(
        '$_cestas/$id',
        {'nome': nome.trim(), 'descricao': descricao.trim(), 'precoBase': preco},
        token: token,
      );

  Future<void> excluirCesta(String token, String id) => _api.delete('$_cestas/$id', token: token);

  Future<void> adicionarItemCesta(String token, String cestaId, String produtoId) =>
      _api.post('$_cestas/$cestaId/itens', {'produtoId': produtoId}, token: token);

  Future<void> removerItemCesta(String token, String cestaId, String itemId) =>
      _api.delete('$_cestas/$cestaId/itens/$itemId', token: token);
}
