import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:grao_cesta/models/pedido.dart';
import 'package:grao_cesta/services/api_client.dart';
import 'package:grao_cesta/services/pedidos_service.dart';

void main() {
  test('criação envia produtos e quantidades e usa o total retornado pela API', () async {
    final client = MockClient((request) async {
      final corpo = jsonDecode(request.body) as Map<String, dynamic>;
      expect(request.method, 'POST');
      expect(request.headers['Authorization'], 'Bearer token-cliente');
      expect(corpo.containsKey('valorTotal'), isFalse);
      expect(corpo.containsKey('status'), isFalse);
      expect(corpo.containsKey('pago'), isFalse);
      expect(corpo['cestaId'], '1');
      expect(corpo['itens'], [
        {'produtoId': '2', 'quantidade': 2},
      ]);
      return http.Response(jsonEncode({
        'id': '10',
        'cestaId': '1',
        'valorTotal': 90.8,
        'status': 'pendente',
        'pago': false,
      }), 201, headers: {'content-type': 'application/json'});
    });
    addTearDown(client.close);

    final pedido = await PedidosService(ApiClient(client)).criar(
      token: 'token-cliente',
      cestaId: '1',
      itens: [const PedidoItem(produtoId: '2', quantidade: 2)],
      clienteNome: 'Ana',
      telefone: '11999999999',
      enderecoEntrega: 'Rua Teste, 1',
    );
    expect(pedido.valorTotal, 90.8);
    expect(pedido.status, 'pendente');
  });
}
