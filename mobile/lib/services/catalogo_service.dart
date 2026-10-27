import '../config/api_config.dart';
import '../models/cesta.dart';
import '../models/produto.dart';
import 'api_client.dart';

/// Fonte de dados do catálogo (a tela depende desta interface, não do HTTP).
abstract class CatalogoRepository {
  Future<List<Cesta>> listarCestas();
  Future<List<Produto>> listarProdutos();
}

class HttpCatalogoRepository implements CatalogoRepository {
  final ApiClient _api;

  HttpCatalogoRepository([ApiClient? api]) : _api = api ?? ApiClient();

  @override
  Future<List<Cesta>> listarCestas() async {
    final dados = await _api.get('${ApiConfig.cestas}/cestas') as List<dynamic>;
    return dados.map((e) => Cesta.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<List<Produto>> listarProdutos() async {
    final dados = await _api.get('${ApiConfig.produtos}/produtos') as List<dynamic>;
    return dados.map((e) => Produto.fromJson(e as Map<String, dynamic>)).toList();
  }
}
