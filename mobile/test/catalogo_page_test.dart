import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:grao_cesta/data/mock_dados.dart';
import 'package:grao_cesta/main.dart';
import 'package:grao_cesta/models/cesta.dart';
import 'package:grao_cesta/models/produto.dart';
import 'package:grao_cesta/models/usuario.dart';
import 'package:grao_cesta/services/api_client.dart';
import 'package:grao_cesta/services/auth_service.dart';
import 'package:grao_cesta/services/catalogo_service.dart';
import 'package:grao_cesta/services/token_storage.dart';
import 'package:grao_cesta/state/sessao_controller.dart';

class CatalogoFalso implements CatalogoRepository {
  int chamadas = 0;
  bool falhar = false;

  @override
  Future<List<Cesta>> listarCestas() async {
    chamadas++;
    if (falhar) throw const ApiException('Não foi possível conectar ao servidor.');
    return cestasMock;
  }

  @override
  Future<List<Produto>> listarProdutos() async => produtosMock;
}

class AuthFalso implements AuthService {
  @override
  Future<Sessao> login(String email, String senha) async {
    if (senha != 'certa') {
      throw const ApiException('Credenciais inválidas.', status: 401);
    }
    return const Sessao(
      'token-falso',
      Usuario(id: '1', nome: 'Ana Souza', email: 'ana@email.com', perfil: 'cliente'),
    );
  }

  @override
  Future<Usuario> me(String token) async => const Usuario(
        id: '1',
        nome: 'Ana Souza',
        email: 'ana@email.com',
        perfil: 'cliente',
      );
}

class ArmazenamentoFalso implements TokenStorage {
  String? token;

  @override
  String? ler() => token;

  @override
  void salvar(String t) => token = t;

  @override
  void limpar() => token = null;
}

void main() {
  late CatalogoFalso catalogo;
  late ArmazenamentoFalso storage;
  late SessaoController sessao;

  setUp(() {
    catalogo = CatalogoFalso();
    storage = ArmazenamentoFalso();
    sessao = SessaoController(AuthFalso(), storage);
  });

  Future<void> abrir(WidgetTester tester) async {
    tester.view.physicalSize = const Size(1200, 4000);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(GraoCestaApp(repositorio: catalogo, sessao: sessao));
    await tester.pumpAndSettle();
  }

  group('catálogo', () {
    testWidgets('mostra as cestas e produtos vindos do repositório', (tester) async {
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

    testWidgets('erro de rede mostra mensagem e permite tentar de novo', (tester) async {
      catalogo.falhar = true;
      await abrir(tester);

      expect(find.text('Não foi possível conectar ao servidor.'), findsOneWidget);
      expect(find.text('Catálogo de Cestas'), findsNothing);

      catalogo.falhar = false;
      await tester.tap(find.text('Tentar de novo'));
      await tester.pumpAndSettle();

      expect(find.text('Catálogo de Cestas'), findsOneWidget);
      expect(catalogo.chamadas, 2);
    });
  });

  group('login', () {
    Future<void> abrirLogin(WidgetTester tester) async {
      await abrir(tester);
      await tester.tap(find.text('Entrar'));
      await tester.pumpAndSettle();
    }

    testWidgets('abre a tela de login pelo botão Entrar', (tester) async {
      await abrirLogin(tester);

      expect(find.text('Acesse com o seu e-mail e senha.'), findsOneWidget);
      expect(find.byType(TextFormField), findsNWidgets(2));
    });

    testWidgets('valida campos vazios', (tester) async {
      await abrirLogin(tester);

      await tester.tap(find.widgetWithText(FilledButton, 'Entrar'));
      await tester.pump();

      expect(find.text('Informe o e-mail.'), findsOneWidget);
      expect(find.text('Informe a senha.'), findsOneWidget);
    });

    testWidgets('credenciais inválidas mostram a mensagem da API', (tester) async {
      await abrirLogin(tester);

      await tester.enterText(find.byType(TextFormField).at(0), 'ana@email.com');
      await tester.enterText(find.byType(TextFormField).at(1), 'errada');
      await tester.tap(find.widgetWithText(FilledButton, 'Entrar'));
      await tester.pumpAndSettle();

      expect(find.text('Credenciais inválidas.'), findsOneWidget);
      expect(sessao.logado, isFalse);
    });

    testWidgets('login válido volta ao catálogo com o nome do usuário', (tester) async {
      await abrirLogin(tester);

      await tester.enterText(find.byType(TextFormField).at(0), 'ana@email.com');
      await tester.enterText(find.byType(TextFormField).at(1), 'certa');
      await tester.tap(find.widgetWithText(FilledButton, 'Entrar'));
      await tester.pumpAndSettle();

      expect(find.text('Olá, Ana'), findsOneWidget);
      expect(find.text('Sair'), findsOneWidget);
      expect(storage.token, 'token-falso');
    });

    testWidgets('sair limpa a sessão', (tester) async {
      await sessao.entrar('ana@email.com', 'certa');
      await abrir(tester);

      await tester.tap(find.text('Sair'));
      await tester.pumpAndSettle();

      expect(find.text('Entrar'), findsOneWidget);
      expect(storage.token, isNull);
    });
  });

  group('SessaoController.restaurar', () {
    test('restaura o usuário a partir do token salvo', () async {
      storage.token = 'token-falso';
      await sessao.restaurar();
      expect(sessao.usuario?.nome, 'Ana Souza');
    });

    test('sem token não faz nada', () async {
      await sessao.restaurar();
      expect(sessao.logado, isFalse);
    });
  });
}
