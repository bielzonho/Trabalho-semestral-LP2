import 'package:flutter/material.dart';

import '../models/produto.dart';
import '../theme/app_theme.dart';
import 'formatar.dart';

class ProdutoCard extends StatelessWidget {
  final Produto produto;
  final VoidCallback onAdicionar;

  const ProdutoCard({
    super.key,
    required this.produto,
    required this.onAdicionar,
  });

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context).textTheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    produto.nome,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: tema.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                ),
                _BadgeEstoque(produto),
              ],
            ),
            const SizedBox(height: 6),
            Expanded(
              child: Text(
                produto.descricao,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: tema.bodySmall?.copyWith(color: AppCores.textoSuave),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Text(
                    formatarPreco(produto.preco),
                    style: tema.titleMedium?.copyWith(
                      color: AppCores.ouroEscuro,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                FilledButton.tonal(
                  onPressed: produto.ativo ? onAdicionar : null,
                  child: Text(produto.ativo ? 'Adicionar' : 'Indisponível'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _BadgeEstoque extends StatelessWidget {
  final Produto produto;
  const _BadgeEstoque(this.produto);

  @override
  Widget build(BuildContext context) {
    if (!produto.ativo) {
      return _pilula('Esgotado', AppCores.perigo, const Color(0xFFF9E8E8));
    }
    if (produto.estoqueBaixo) {
      return _pilula(
        'Restam ${produto.quantidadeEstoque}',
        AppCores.alerta,
        const Color(0xFFFFF3DC),
      );
    }
    return const SizedBox.shrink();
  }

  Widget _pilula(String texto, Color cor, Color fundo) => Container(
        margin: const EdgeInsets.only(left: 8),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: fundo,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          texto,
          style: TextStyle(
            color: cor,
            fontSize: 11,
            fontWeight: FontWeight.w700,
          ),
        ),
      );
}
