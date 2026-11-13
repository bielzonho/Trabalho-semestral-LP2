import 'package:flutter/material.dart';

import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../services/cadastro_service.dart';
import '../services/verificacao_service.dart';
import '../state/sessao_controller.dart';
import '../theme/app_theme.dart';
import 'cadastro_page.dart';

/// Login em duas etapas:
/// 1) e-mail e senha no microsserviço auth (:3013);
/// 2) código OTP enviado por e-mail pelo microsserviço Dart (:3016).
/// Se [verificacao] for nulo (ex.: testes), a etapa 2 é pulada.
class LoginPage extends StatefulWidget {
  final SessaoController sessao;
  final VerificacaoService? verificacao;
  final CadastroService? cadastro;

  const LoginPage({super.key, required this.sessao, this.verificacao, this.cadastro});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _senha = TextEditingController();
  final _codigo = TextEditingController();
  bool _ocultarSenha = true;
  String? _erro;

  /// Sessão validada na etapa 1, aguardando o código OTP.
  Sessao? _pendente;
  String? _avisoCodigo;
  bool _verificando = false;

  @override
  void dispose() {
    _email.dispose();
    _senha.dispose();
    _codigo.dispose();
    super.dispose();
  }

  Future<void> _entrar() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _erro = null);

    try {
      final sessao = await widget.sessao.autenticar(_email.text, _senha.text);
      final verificacao = widget.verificacao;
      if (verificacao == null) {
        _finalizar(sessao);
        return;
      }
      if (!mounted) return;
      setState(() => _verificando = true);
      final aviso = await verificacao.enviar(_email.text);
      if (!mounted) return;
      setState(() {
        _pendente = sessao;
        _avisoCodigo = aviso;
        _verificando = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _erro = e.mensagem;
        _verificando = false;
      });
    }
  }

  Future<void> _confirmarCodigo() async {
    final codigo = _codigo.text.trim();
    if (codigo.isEmpty) {
      setState(() => _erro = 'Informe o código recebido.');
      return;
    }
    setState(() {
      _erro = null;
      _verificando = true;
    });
    try {
      await widget.verificacao!.confirmar(_email.text, codigo);
      if (!mounted) return;
      _finalizar(_pendente!);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _erro = e.mensagem;
        _verificando = false;
      });
    }
  }

  void _finalizar(Sessao sessao) {
    widget.sessao.concluir(sessao);
    if (!mounted) return;
    Navigator.of(context).pop(true);
  }

  Future<void> _criarConta() async {
    final email = await Navigator.of(context).push<String>(
      MaterialPageRoute(
        builder: (_) => CadastroPage(cadastro: widget.cadastro ?? CadastroService()),
      ),
    );
    if (email != null && mounted) {
      _email.text = email;
      setState(() => _erro = null);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Conta criada! Agora é só entrar.')),
      );
    }
  }

  Widget _etapaCodigo(TextTheme tema) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Verificação',
          textAlign: TextAlign.center,
          style: tema.headlineMedium?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 6),
        Text(
          _avisoCodigo ?? 'Enviamos um código para o seu e-mail.',
          textAlign: TextAlign.center,
          style: tema.bodyMedium?.copyWith(color: AppCores.textoSuave),
        ),
        const SizedBox(height: 24),
        if (_erro != null) ...[
          _CaixaErro(_erro!),
          const SizedBox(height: 16),
        ],
        TextField(
          controller: _codigo,
          enabled: !_verificando,
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          maxLength: 6,
          style: const TextStyle(fontSize: 24, letterSpacing: 8),
          onSubmitted: (_) => _confirmarCodigo(),
          decoration: const InputDecoration(
            labelText: 'Código de 6 dígitos',
            border: OutlineInputBorder(),
            counterText: '',
          ),
        ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: _verificando ? null : _confirmarCodigo,
          style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
          child: _verificando
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                )
              : const Text('Confirmar código'),
        ),
        const SizedBox(height: 8),
        TextButton(
          onPressed: _verificando
              ? null
              : () => setState(() {
                    _pendente = null;
                    _codigo.clear();
                    _erro = null;
                  }),
          child: const Text('Voltar'),
        ),
      ],
    );
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
                    if (_pendente != null) return _etapaCodigo(tema);
                    final carregando = widget.sessao.carregando || _verificando;
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
                          const SizedBox(height: 12),
                          TextButton(
                            onPressed: carregando ? null : _criarConta,
                            child: const Text('Não tem conta? Criar conta'),
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
