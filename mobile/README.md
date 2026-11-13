# Grão & Cesta — app Flutter

App mobile (Android) e web do **Grão & Cesta**, integrado aos microsserviços do back end por HTTP: catálogo, cadastro, login com código por e-mail, pedidos, *Meus pedidos* e painel administrativo.

A descrição completa do projeto, a lista de funcionalidades e as instruções do back end estão no [README da raiz](../README.md#app-flutter-mobile).

## Pré-requisitos
- Flutter SDK estável no PATH (`flutter --version`).
- Back end no ar: `npm run dev:back` e `npm run dev:verificacao-dart` (na raiz), ou Docker/Kubernetes.

## Executar

```bash
flutter pub get

# Android (emulador ou celular)
flutter devices
flutter run -d <id-do-dispositivo>
# celular físico: informe o IP do PC na rede
flutter run --dart-define=API_HOST=192.168.0.10

# Web (a porta 5500 é obrigatória por causa do CORS do back end)
flutter run -d edge --web-port=5500
```

Sem `API_HOST`, o app usa `localhost` na web/desktop e `10.0.2.2` no emulador Android.

## Testes

```bash
flutter analyze
flutter test
dart run tool/smoke.dart cliente@email.com <senha-de-dev>   # integração com o back end real
```
