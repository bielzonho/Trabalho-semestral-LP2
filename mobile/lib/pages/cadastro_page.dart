import 'package:flutter/material.dart';

import '../services/cadastro_service.dart';
import '../widgets/estado_tela.dart';

/// Criação de conta de cliente (POST /auth/registrar).
/// Ao concluir, volta para o login devolvendo o e-mail cadastrado.
class CadastroPage extends StatefulWidget {
  final CadastroService cadastro;

  const CadastroPage({super.key, required this.cadastro});

  @override
  State<CadastroPage> createState() => _CadastroPageState();
}

class _CadastroPageState extends State<CadastroPage> {
  final _formKey = GlobalKey<FormState>();
  final _nome = TextEditingController();
  final _email = TextEditingController();
  final _senha = TextEditingController();
  final _confirmacao = TextEditingController();
  bool _enviando = false;

  @override
  void dispose() {
    for (final c in [_nome, _email, _senha, _confirmacao]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _salvar() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _enviando = true);
    try {
      await widget.cadastro.registrar(_nome.text, _email.text, _senha.text);
      if (!mounted) return;
      Navigator.of(context).pop(_email.text.trim().toLowerCase());
    } catch (e) {
      if (!mounted) return;
      setState(() => _enviando = false);
      avisar(context, mensagemDeErro(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context).textTheme;
    return Scaffold(
      appBar: appBarPadrao('Criar conta'),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('Bem-vindo à Grão & Cesta',
                          textAlign: TextAlign.center,
                          style: tema.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                      const SizedBox(height: 20),
                      TextFormField(
                        controller: _nome,
                        enabled: !_enviando,
                        textCapitalization: TextCapitalization.words,
                        decoration: const InputDecoration(
                          labelText: 'Nome completo',
                          prefixIcon: Icon(Icons.person_outline),
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) =>
                            (v == null || v.trim().length < 3) ? 'Informe o seu nome.' : null,
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _email,
                        enabled: !_enviando,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'E-mail',
                          prefixIcon: Icon(Icons.mail_outline),
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) {
                          final valor = v?.trim() ?? '';
                          if (valor.isEmpty) return 'Informe o e-mail.';
                          if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(valor)) {
                            return 'E-mail inválido.';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _senha,
                        enabled: !_enviando,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Senha (mín. 6 caracteres)',
                          prefixIcon: Icon(Icons.lock_outline),
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) =>
                            (v == null || v.length < 6) ? 'A senha precisa de 6 caracteres.' : null,
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _confirmacao,
                        enabled: !_enviando,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Confirme a senha',
                          prefixIcon: Icon(Icons.lock_outline),
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) => v != _senha.text ? 'As senhas não conferem.' : null,
                      ),
                      const SizedBox(height: 22),
                      FilledButton(
                        onPressed: _enviando ? null : _salvar,
                        style: FilledButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16)),
                        child: _enviando
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2.5, color: Colors.white),
                              )
                            : const Text('Criar conta'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
