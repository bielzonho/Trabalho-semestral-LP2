/// URLs dos microsserviços. O host pode ser trocado na execução:
/// `flutter run -d edge --dart-define=API_HOST=192.168.0.10`
class ApiConfig {
  static const host = String.fromEnvironment('API_HOST', defaultValue: 'localhost');

  static const cestas = 'http://$host:3010';
  static const produtos = 'http://$host:3012';
  static const auth = 'http://$host:3013';

  static const timeout = Duration(seconds: 10);
}
