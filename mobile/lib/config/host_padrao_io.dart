import 'dart:io';

/// No emulador Android, `localhost` é o próprio emulador; o PC fica em 10.0.2.2.
/// Nas demais plataformas nativas (Windows, Dart VM) o back end está em localhost.
String get hostPadrao => Platform.isAndroid ? '10.0.2.2' : 'localhost';
