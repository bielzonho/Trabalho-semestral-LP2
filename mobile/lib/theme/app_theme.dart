import 'package:flutter/material.dart';

class AppCores {
  static const ouro = Color(0xFFC59D5F);
  static const ouroEscuro = Color(0xFFA07840);
  static const creme = Color(0xFFFFF8F0);
  static const fundo = Color(0xFFF5E6CF);
  static const texto = Color(0xFF3A2A1A);
  static const textoSuave = Color(0xFF7A6A5A);
  static const borda = Color(0xFFE7D8C3);
  static const perigo = Color(0xFFC0392B);
  static const alerta = Color(0xFF8A6200);
}

ThemeData buildAppTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: AppCores.ouro,
    primary: AppCores.ouroEscuro,
    surface: AppCores.creme,
    brightness: Brightness.light,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: AppCores.fundo,
    textTheme: ThemeData.light().textTheme.apply(
          bodyColor: AppCores.texto,
          displayColor: AppCores.texto,
        ),
    cardTheme: CardThemeData(
      color: AppCores.creme,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: AppCores.borda),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppCores.ouro,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: AppCores.texto,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ),
  );
}
