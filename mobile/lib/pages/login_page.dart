import 'package:flutter/material.dart';

import '../services/api_client.dart';
import '../state/sessao_controller.dart';
import '../theme/app_theme.dart';

/// Tela de login (e-mail e senha) integrada ao microsserviço auth.
class LoginPage extends StatefulWidget {
  final SessaoController sessao;

  const LoginPage({super.key, required this.sessao});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _senha = TextEditingController();
  bool _ocultarSenha = true;
  String? _erro;

  @override
  void dispose() {
    _email.dispose();
    _senha.dispose();
    super.dispose();
  }

  Future<void> _entrar() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _erro = null);

    try {
      await widget.sessao.entrar(_email.text, _senha.text);
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _erro = e.mensagem);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppCores.creme,
        surfaceTintColor: Colors.transparent,
        title: const Text(
          'Grão & Cesta',
          style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: 0.3),
        ),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(28, 32, 28, 28),
                child: ListenableBuilder(
                  listenable: widget.sessao,
                  builder: (context, _) {
                    final carregando = widget.sessao.carregando;
                    return Form(
                      key: _formKey,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            'Entrar',
                            textAlign: TextAlign.center,
                            style: tema.headlineMedium
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Acesse com o seu e-mail e senha.',
                            textAlign: TextAlign.center,
                            style: tema.bodyMedium
                                ?.copyWith(color: AppCores.textoSuave),
                          ),
                          const SizedBox(height: 24),
                          if (_erro != null) ...[
                            _CaixaErro(_erro!),
                            const SizedBox(height: 16),
                          ],
                          TextFormField(
                            controller: _email,
                            enabled: !carregando,
                            keyboardType: TextInputType.emailAddress,
                            autofillHints: const [AutofillHints.email],
                            textInputAction: TextInputAction.next,
                            decoration: const InputDecoration(
                              labelText: 'E-mail',
                              prefixIcon: Icon(Icons.mail_outline),
                              border: OutlineInputBorder(),
                            ),
                            validator: (v) {
                              final valor = v?.trim() ?? '';
                              if (valor.isEmpty) return 'Informe o e-mail.';
                              if (!valor.contains('@')) return 'E-mail inválido.';
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _senha,
                            enabled: !carregando,
                            obscureText: _ocultarSenha,
                            autofillHints: const [AutofillHints.password],
                            textInputAction: TextInputAction.done,
                            onFieldSubmitted: (_) => _entrar(),
                            decoration: InputDecoration(
                              labelText: 'Senha',
                              prefixIcon: const Icon(Icons.lock_outline),
                              border: const OutlineInputBorder(),
                              suffixIcon: IconButton(
                                tooltip: _ocultarSenha ? 'Mostrar senha' : 'Ocultar senha',
                                icon: Icon(_ocultarSenha
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined),
                                onPressed: () =>
                                    setState(() => _ocultarSenha = !_ocultarSenha),
                              ),
                            ),
                            validator: (v) =>
                                (v == null || v.isEmpty) ? 'Informe a senha.' : null,
                          ),
                          const SizedBox(height: 24),
                          FilledButton(
                            onPressed: carregando ? null : _entrar,
                            style: FilledButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                            child: carregando
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Text('Entrar'),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _CaixaErro extends StatelessWidget {
  final String mensagem;
  const _CaixaErro(this.mensagem);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF0F0),
        border: Border.all(color: const Color(0xFFF5C6C6)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, size: 18, color: AppCores.perigo),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              mensagem,
              style: const TextStyle(color: Color(0xFFB00000), fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}
