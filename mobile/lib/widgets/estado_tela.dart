import 'package:flutter/material.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';

/// Peças de interface reaproveitadas pelas telas (carregando, erro, vazio).
class CarregandoTela extends StatelessWidget {
  const CarregandoTela({super.key});

  @override
  Widget build(BuildContext context) => const Padding(
        padding: EdgeInsets.symmetric(vertical: 80),
        child: Center(child: CircularProgressIndicator(color: AppCores.ouro)),
      );
}

class VazioTela extends StatelessWidget {
  final String texto;
  final IconData icone;

  const VazioTela(this.texto, {super.key, this.icone = Icons.inbox_outlined});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 24),
        child: Center(
          child: Column(
            children: [
              Icon(icone, size: 48, color: AppCores.textoSuave),
              const SizedBox(height: 12),
              Text(texto,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppCores.textoSuave)),
            ],
          ),
        ),
      );
}

class ErroTela extends StatelessWidget {
  final String mensagem;
  final VoidCallback onTentarDeNovo;

  const ErroTela({super.key, required this.mensagem, required this.onTentarDeNovo});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
        child: Center(
          child: Column(
            children: [
              const Icon(Icons.cloud_off_outlined, size: 48, color: AppCores.textoSuave),
              const SizedBox(height: 12),
              Text(mensagem, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: onTentarDeNovo,
                icon: const Icon(Icons.refresh),
                label: const Text('Tentar de novo'),
              ),
            ],
          ),
        ),
      );
}

/// Mensagem rápida no rodapé.
void avisar(BuildContext context, String texto) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(texto)));
}

/// Converte qualquer erro em texto amigável.
String mensagemDeErro(Object erro) =>
    erro is ApiException ? erro.mensagem : 'Algo deu errado. Tente novamente.';

/// Pergunta de confirmação (ex.: antes de excluir). Devolve true se confirmou.
Future<bool> confirmar(BuildContext context, String titulo, String texto) async {
  final ok = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(titulo),
      content: Text(texto),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: AppCores.perigo),
          onPressed: () => Navigator.pop(ctx, true),
          child: const Text('Confirmar'),
        ),
      ],
    ),
  );
  return ok ?? false;
}

AppBar appBarPadrao(String titulo, {List<Widget>? actions, PreferredSizeWidget? bottom}) => AppBar(
      backgroundColor: AppCores.creme,
      surfaceTintColor: Colors.transparent,
      title: Text(titulo, style: const TextStyle(fontWeight: FontWeight.w800)),
      actions: actions,
      bottom: bottom,
    );
