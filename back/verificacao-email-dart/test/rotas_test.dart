import 'dart:convert';

import 'package:shelf/shelf.dart';
import 'package:test/test.dart';
import 'package:verificacao_email_dart/email_service.dart';
import 'package:verificacao_email_dart/otp_repository.dart';
import 'package:verificacao_email_dart/rotas.dart';

class _Registro {
  final String email;
  final String codigo;
  final DateTime expiraEm;
  bool usado = false;
  final String id;

  _Registro(this.id, this.email, this.codigo, this.expiraEm);
}

class RepositorioFalso implements OtpRepository {
  final registros = <_Registro>[];
  final DateTime Function() agora;
  bool falharAoInserir = false;
  int _seq = 0;

  RepositorioFalso(this.agora);

  @override
  Future<void> invalidarAnteriores(String email) async {
    for (final r in registros.where((r) => r.email == email && !r.usado)) {
      r.usado = true;
    }
  }

  @override
  Future<void> inserir({
    required String email,
    required String codigo,
    required DateTime expiraEm,
  }) async {
    if (falharAoInserir) throw Exception('banco indisponível');
    registros.add(_Registro('${++_seq}', email, codigo, expiraEm));
  }

  @override
  Future<String?> buscarValido(String email, String codigo) async {
    final validos = registros.where((r) =>
        r.email == email &&
        r.codigo == codigo &&
        !r.usado &&
        !r.expiraEm.isBefore(agora()));
    return validos.isEmpty ? null : validos.last.id;
  }

  @override
  Future<void> marcarUsado(String id) async {
    registros.firstWhere((r) => r.id == id).usado = true;
  }
}

class EmailFalso implements EmailService {
  final enviados = <(String, String)>[];
  bool falhar = false;

  @override
  Future<void> enviarCodigo(String email, String codigo) async {
    if (falhar) throw Exception('SMTP fora do ar');
    enviados.add((email, codigo));
  }
}

void main() {
  late DateTime relogio;
  late RepositorioFalso repo;
  late EmailFalso email;
  late Handler handler;

  setUp(() {
    relogio = DateTime.utc(2026, 1, 1, 12);
    repo = RepositorioFalso(() => relogio);
    email = EmailFalso();
    handler = Rotas(
      repositorio: repo,
      emailService: email,
      agora: () => relogio,
    ).handler;
  });

  Future<Response> post(String caminho, Object? corpo, {Map<String, String>? headers}) =>
      Future.value(handler(Request(
        'POST',
        Uri.parse('http://localhost$caminho'),
        body: corpo is String ? corpo : jsonEncode(corpo),
        headers: headers,
      )));

  Future<Map<String, dynamic>> json(Response r) async =>
      jsonDecode(await r.readAsString()) as Map<String, dynamic>;

  group('gerarCodigo', () {
    test('sempre tem 6 dígitos', () {
      for (var i = 0; i < 500; i++) {
        final c = gerarCodigo();
        expect(c, matches(RegExp(r'^[1-9]\d{5}$')));
      }
    });
  });

  group('GET /', () {
    test('informa que o serviço está online', () async {
      final r = await handler(Request('GET', Uri.parse('http://localhost/')));
      expect(r.statusCode, 200);
      expect((await json(r))['status'], 'online');
    });
  });

  group('POST /verificacao/enviar', () {
    test('rejeita e-mail ausente ou vazio com 400', () async {
      for (final corpo in [{}, {'email': ''}, {'email': '  '}, {'email': 5}]) {
        final r = await post('/verificacao/enviar', corpo);
        expect(r.statusCode, 400);
        expect((await json(r))['mensagem'], 'E-mail é obrigatório.');
      }
    });

    test('corpo que não é JSON vira 400', () async {
      final r = await post('/verificacao/enviar', 'não é json');
      expect(r.statusCode, 400);
    });

    test('grava código, normaliza e-mail e envia', () async {
      final r = await post('/verificacao/enviar', {'email': '  Ana@Email.COM '});
      expect(r.statusCode, 200);
      expect((await json(r))['mensagem'], 'Código enviado para o e-mail.');

      expect(repo.registros, hasLength(1));
      final reg = repo.registros.single;
      expect(reg.email, 'ana@email.com');
      expect(reg.expiraEm, relogio.add(const Duration(minutes: 10)));
      expect(email.enviados.single, ('ana@email.com', reg.codigo));
    });

    test('invalida códigos anteriores do mesmo e-mail', () async {
      await post('/verificacao/enviar', {'email': 'a@a.com'});
      await post('/verificacao/enviar', {'email': 'a@a.com'});
      expect(repo.registros, hasLength(2));
      expect(repo.registros.first.usado, isTrue);
      expect(repo.registros.last.usado, isFalse);
    });

    test('falha do SMTP ainda responde 200 com aviso', () async {
      email.falhar = true;
      final r = await post('/verificacao/enviar', {'email': 'a@a.com'});
      expect(r.statusCode, 200);
      expect((await json(r))['mensagem'], contains('e-mail indisponível'));
      expect(repo.registros, hasLength(1));
    });

    test('falha ao salvar no banco responde 500 e não envia e-mail', () async {
      repo.falharAoInserir = true;
      final r = await post('/verificacao/enviar', {'email': 'a@a.com'});
      expect(r.statusCode, 500);
      expect(email.enviados, isEmpty);
    });
  });

  group('POST /verificacao/confirmar', () {
    Future<String> gerar(String endereco) async {
      await post('/verificacao/enviar', {'email': endereco});
      return repo.registros.last.codigo;
    }

    test('exige e-mail e código', () async {
      for (final corpo in [
        {},
        {'email': 'a@a.com'},
        {'codigo': '123456'},
      ]) {
        final r = await post('/verificacao/confirmar', corpo);
        expect(r.statusCode, 400);
        expect((await json(r))['mensagem'], 'E-mail e código são obrigatórios.');
      }
    });

    test('confirma o código correto e o marca como usado', () async {
      final codigo = await gerar('a@a.com');
      final r = await post('/verificacao/confirmar', {'email': 'A@a.com', 'codigo': codigo});
      expect(r.statusCode, 200);
      final corpo = await json(r);
      expect(corpo['verificado'], isTrue);
      expect(repo.registros.last.usado, isTrue);
    });

    test('aceita código numérico (não só string)', () async {
      final codigo = await gerar('a@a.com');
      final r = await post(
          '/verificacao/confirmar', {'email': 'a@a.com', 'codigo': int.parse(codigo)});
      expect(r.statusCode, 200);
    });

    test('código não pode ser reutilizado', () async {
      final codigo = await gerar('a@a.com');
      await post('/verificacao/confirmar', {'email': 'a@a.com', 'codigo': codigo});
      final r = await post('/verificacao/confirmar', {'email': 'a@a.com', 'codigo': codigo});
      expect(r.statusCode, 400);
      expect((await json(r))['mensagem'], 'Código inválido ou expirado.');
    });

    test('código errado é recusado', () async {
      await gerar('a@a.com');
      final r = await post('/verificacao/confirmar', {'email': 'a@a.com', 'codigo': '000000'});
      expect(r.statusCode, 400);
    });

    test('código de outro e-mail é recusado', () async {
      final codigo = await gerar('a@a.com');
      final r = await post('/verificacao/confirmar', {'email': 'b@b.com', 'codigo': codigo});
      expect(r.statusCode, 400);
    });

    test('código expira após 10 minutos', () async {
      final codigo = await gerar('a@a.com');
      relogio = relogio.add(const Duration(minutes: 10, seconds: 1));
      final r = await post('/verificacao/confirmar', {'email': 'a@a.com', 'codigo': codigo});
      expect(r.statusCode, 400);
    });

    test('um novo envio invalida o código anterior', () async {
      await gerar('a@a.com');
      final antigo = repo.registros.first;
      await gerar('a@a.com');
      final novo = repo.registros.last;
      expect(antigo.usado, isTrue);

      // Se o sorteio repetir o mesmo código, o novo ainda vale; senão o antigo é recusado.
      if (antigo.codigo != novo.codigo) {
        final r = await post(
            '/verificacao/confirmar', {'email': 'a@a.com', 'codigo': antigo.codigo});
        expect(r.statusCode, 400);
      }
    });
  });

  group('POST /eventos', () {
    test('aceita eventos conhecidos ou não e responde 200 ok', () async {
      for (final corpo in [
        {'tipo': 'PedidoEfetivado', 'dados': {}},
        {'tipo': 'Qualquer', 'dados': 1},
        {},
      ]) {
        final r = await post('/eventos', corpo);
        expect(r.statusCode, 200);
        expect(await json(r), {'msg': 'ok'});
      }
    });
  });

  group('middlewares', () {
    test('CORS libera origem permitida e não libera outra', () async {
      final ok = await handler(Request('GET', Uri.parse('http://localhost/'),
          headers: {'origin': 'http://localhost:5173'}));
      expect(ok.headers['access-control-allow-origin'], 'http://localhost:5173');

      final negada = await handler(Request('GET', Uri.parse('http://localhost/'),
          headers: {'origin': 'http://malicioso.com'}));
      expect(negada.headers.containsKey('access-control-allow-origin'), isFalse);
    });

    test('preflight OPTIONS responde 204', () async {
      final r = await handler(Request('OPTIONS', Uri.parse('http://localhost/verificacao/enviar'),
          headers: {'origin': 'http://localhost:5173'}));
      expect(r.statusCode, 204);
    });

    test('envia cabeçalhos de segurança', () async {
      final r = await handler(Request('GET', Uri.parse('http://localhost/')));
      expect(r.headers['x-content-type-options'], 'nosniff');
    });

    test('corpo acima de 100kb é recusado com 413', () async {
      final grande = jsonEncode({'email': 'a' * (101 * 1024)});
      final r = await post('/verificacao/enviar', grande,
          headers: {'content-length': '${grande.length}'});
      expect(r.statusCode, 413);
    });

    test('rota inexistente retorna 404', () async {
      final r = await handler(Request('GET', Uri.parse('http://localhost/nada')));
      expect(r.statusCode, 404);
    });
  });
}
