// Host padrão do back end por plataforma, sem depender do Flutter
// (assim `dart run tool/smoke.dart` continua funcionando).
export 'host_padrao_web.dart' if (dart.library.io) 'host_padrao_io.dart';
