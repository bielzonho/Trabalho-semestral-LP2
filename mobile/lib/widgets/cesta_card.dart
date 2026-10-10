import 'package:flutter/material.dart';

import '../models/cesta.dart';
import '../theme/app_theme.dart';
import 'formatar.dart';

class CestaCard extends StatelessWidget {
  final Cesta cesta;
  final VoidCallback onAdicionar;

  const CestaCard({super.key, required this.cesta, required this.onAdicionar});

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context).textTheme;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 16 / 10,
            child: Image.asset(cesta.imagem, fit: BoxFit.cover),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  cesta.nome,
                  style: tema.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 6),
                Text(
                  cesta.descricao,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: tema.bodySmall?.copyWith(color: AppCores.textoSuave),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            formatarPreco(cesta.preco),
                            style: tema.titleLarge?.copyWith(
                              color: AppCores.ouroEscuro,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text(
                            '${cesta.totalItens} itens',
                            style: tema.bodySmall
                                ?.copyWith(color: AppCores.textoSuave),
                          ),
                        ],
                      ),
                    ),
                    FilledButton(
                      onPressed: onAdicionar,
                      child: const Text('Pedir'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
