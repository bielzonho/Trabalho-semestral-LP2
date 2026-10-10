import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class SecaoTitulo extends StatelessWidget {
  final String titulo;
  final String? subtitulo;

  const SecaoTitulo(this.titulo, {super.key, this.subtitulo});

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.only(top: 32, bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            titulo,
            style: tema.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          Container(
            width: 48,
            height: 3,
            decoration: BoxDecoration(
              color: AppCores.ouro,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          if (subtitulo != null) ...[
            const SizedBox(height: 8),
            Text(
              subtitulo!,
              style: tema.bodyMedium?.copyWith(color: AppCores.textoSuave),
            ),
          ],
        ],
      ),
    );
  }
}
