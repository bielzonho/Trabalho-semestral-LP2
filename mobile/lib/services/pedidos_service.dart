import '../config/api_config.dart';
import '../models/pedido.dart';
import 'api_client.dart';

/// Microsserviço de pedidos (:3011). Todas as rotas exigem token.
class PedidosService {
  final ApiClient _api;

  PedidosService([ApiClient? api]) : _api = api ?? ApiClient();

  String get _base => '${ApiConfig.pedidos}/pedidos';

  List<Pedido> _lista(dynamic dados) => (dados as List<dynamic>)
      .map((e) => Pedido.fromJson(e as Map<String, dynamic>))
      .toList();

  // ── Cliente ──────────────────────────────────────────────

  Future<Pedido> criar({
    required String token,
    required String cestaId,
    required List<PedidoItem> itens,
    required String clienteNome,
    required String telefone,
    required String enderecoEntrega,
    String observacoes = '',
  }) async {
    final dados = await _api.post(
      _base,
      {
        'cestaId': cestaId,
        'itens': itens.map((i) => i.toJson()).toList(),
        'clienteNome': clienteNome,
        'clienteTelefone': telefone,
        'enderecoEntrega': enderecoEntrega,
        'observacoes': observacoes,
      },
      token: token,
    );
    return Pedido.fromJson(dados as Map<String, dynamic>);
  }

  Future<List<Pedido>> meus(String token) async =>
      _lista(await _api.get('$_base/meus', token: token));

  // ── Admin ────────────────────────────────────────────────

  Future<List<Pedido>> todos(String token) async =>
      _lista(await _api.get(_base, token: token));

  Future<List<Pedido>> porStatus(String token, String status) async =>
      _lista(await _api.get('$_base/status/$status', token: token));

  Future<Pedido> buscar(String token, String id) async =>
      Pedido.fromJson(await _api.get('$_base/$id', token: token) as Map<String, dynamic>);

  Future<void> alterarStatus(String token, String id, String status) =>
      _api.patch('$_base/$id/status', {'status': status}, token: token);

  Future<void> atualizar(String token, Pedido p) => _api.put(
        '$_base/${p.id}',
        {
          'cestaId': p.cestaId,
          'valorTotal': p.valorTotal,
          'status': p.status,
          'clienteNome': p.clienteNome,
          'clienteTelefone': p.telefone,
          'enderecoEntrega': p.enderecoEntrega,
          'observacoes': p.observacoes,
        },
        token: token,
      );

  Future<void> excluir(String token, String id) => _api.delete('$_base/$id', token: token);
}
