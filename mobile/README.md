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

## APK pelo GitHub, sem SDK no computador

O workflow **Gerar APK Android** em `.github/workflows/android-apk.yml` compila um APK universal, executa a análise/testes Flutter e disponibiliza o arquivo no artefato **grao-cesta-android**. Ele roda ao atualizar a branch `ci/gerar-apk-android` e também pode ser iniciado manualmente por **Actions → Gerar APK Android → Run workflow**, depois que o workflow estiver na branch principal.

Para instalar, abra a execução concluída no GitHub, baixe o artefato, extraia o ZIP e abra `grao-cesta-teste.apk` no Android. Autorize a instalação pelo aplicativo usado para abrir o APK, quando o Android solicitar.

O backend de teste usa o IP `192.168.0.57`. Mantenha o computador com os serviços ligados e o celular na mesma rede Wi-Fi. Para usar outro IP, informe `api_host` ao iniciar manualmente o workflow ou configure a variável de repositório `ANDROID_API_HOST` e gere um novo APK. O IP fica incorporado ao arquivo no momento da compilação.

O APK de release usa a assinatura de desenvolvimento definida no Gradle, adequada para testes. Não são incluídos `.env` nem credenciais do Supabase no aplicativo. Para publicar em loja, configure uma assinatura própria.

## Testes

```bash
flutter analyze
flutter test
dart run tool/smoke.dart cliente@email.com <senha-de-dev>   # integração com o back end real
```
