import 'host_padrao.dart';

/// URLs dos microsserviços. O host pode ser trocado na execução:
/// `flutter run --dart-define=API_HOST=192.168.0.10` (ex.: celular físico na mesma rede).
/// Sem `API_HOST`: `localhost` na web/desktop e `10.0.2.2` no emulador Android.
class ApiConfig {
  static const _hostDefinido = String.fromEnvironment('API_HOST');

  static final host = _hostDefinido.isNotEmpty ? _hostDefinido : hostPadrao;

  static final cestas = 'http://$host:3010';
  static final produtos = 'http://$host:3012';
  static final auth = 'http://$host:3013';
  static final pedidos = 'http://$host:3011';

  /// Verificação de e-mail (OTP) usa a versão em Dart do microsserviço.
  static final verificacao = 'http://$host:3016';

  static const timeout = Duration(seconds: 10);
}
