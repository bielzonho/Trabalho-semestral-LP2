import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:grao_cesta/data/mock_dados.dart';
import 'package:grao_cesta/main.dart';

void main() {
  Future<void> abrir(WidgetTester tester) async {
    tester.view.physicalSize = const Size(1200, 4000);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const GraoCestaApp());
  }

  testWidgets('renderiza cestas e produtos mockados', (tester) async {
    await abrir(tester);

    expect(find.text('Catálogo de Cestas'), findsOneWidget);
    expect(find.text('Produtos Disponíveis'), findsOneWidget);
    for (final c in cestasMock) {
      expect(find.text(c.nome), findsOneWidget);
    }
    for (final p in produtosMock) {
      expect(find.text(p.nome), findsOneWidget);
    }
  });

  testWidgets('produto sem estoque aparece como indisponível', (tester) async {
    await abrir(tester);

    expect(find.text('Esgotado'), findsOneWidget);
    final botao = tester.widget<FilledButton>(
      find.widgetWithText(FilledButton, 'Indisponível'),
    );
    expect(botao.onPressed, isNull);
    expect(find.text('Restam 6'), findsOneWidget);
  });

  testWidgets('adicionar produto mostra SnackBar e contador', (tester) async {
    await abrir(tester);

    await tester.tap(find.widgetWithText(FilledButton, 'Adicionar').first);
    await tester.pump();

    expect(find.text('Café Premium adicionado ao pedido'), findsOneWidget);
    expect(find.text('1'), findsOneWidget);
  });
}
