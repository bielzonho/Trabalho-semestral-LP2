import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  fazerLogin,
  enviarCodigoVerificacao,
  confirmarCodigoVerificacao,
} from '../api/api';

const STEPS = { LOGIN: 'login', OTP: 'otp', CADASTRO: 'cadastro' };

export default function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.LOGIN);

  // Estado compartilhado entre steps
  const [pendente, setPendente] = useState({ token: null, usuario: null, email: null });

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [loginErro, setLoginErro] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // OTP
  const [codigo, setCodigo] = useState('');
  const [otpErro, setOtpErro] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Cadastro
  const [cadNome, setCadNome] = useState('');
  const [cadEmail, setCadEmail] = useState('');
  const [cadSenha, setCadSenha] = useState('');
  const [cadConfirmar, setCadConfirmar] = useState('');
  const [cadErro, setCadErro] = useState('');
  const [cadSucesso, setCadSucesso] = useState('');
  const [cadLoading, setCadLoading] = useState(false);

  // ── Login ──────────────────────────────────────────────────

  async function handleLogin(e) {
    e.preventDefault();
    setLoginErro('');
    setLoginLoading(true);
    try {
      const dados = await fazerLogin(loginEmail.trim(), loginSenha);
      setPendente({ token: dados.token, usuario: dados.usuario, email: loginEmail.trim() });

      try {
        await enviarCodigoVerificacao(loginEmail.trim());
        setStep(STEPS.OTP);
      } catch {
        setLoginErro('Serviço de verificação de e-mail indisponível. Verifique se o microserviço na porta 3014 está rodando.');
      }
    } catch (err) {
      setLoginErro(err.message || 'Erro ao realizar login.');
    } finally {
      setLoginLoading(false);
    }
  }

  // ── OTP ─────────────────────────────────────────────────────

  async function handleOTP(e) {
    e.preventDefault();
    setOtpErro('');
    setOtpLoading(true);
    try {
      await confirmarCodigoVerificacao(pendente.email, codigo.trim());
      localStorage.setItem('token', pendente.token);
      localStorage.setItem('usuario', JSON.stringify(pendente.usuario));
      localStorage.setItem('emailVerificado', 'true');
      navigate(pendente.usuario.perfil === 'admin' ? '/admin' : '/');
    } catch (err) {
      setOtpErro(err.message || 'Código inválido ou expirado.');
    } finally {
      setOtpLoading(false);
    }
  }

  async function reenviarCodigo() {
    try {
      await enviarCodigoVerificacao(pendente.email);
      alert('Novo código enviado para ' + pendente.email);
    } catch {
      alert('Erro ao reenviar código. Verifique o serviço na porta 3014.');
    }
  }

  function voltarLogin() {
    setPendente({ token: null, usuario: null, email: null });
    setCodigo('');
    setOtpErro('');
    setStep(STEPS.LOGIN);
  }

  // ── Cadastro ─────────────────────────────────────────────────

  async function handleCadastro(e) {
    e.preventDefault();
    setCadErro('');
    setCadSucesso('');
    if (cadSenha !== cadConfirmar) {
      setCadErro('As senhas não coincidem.');
      return;
    }
    setCadLoading(true);
    try {
      const res = await fetch('http://localhost:3013/auth/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: cadNome.trim(), email: cadEmail.trim(), senha: cadSenha }),
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.mensagem || 'Erro ao criar conta.');
      setCadSucesso('Conta criada com sucesso! Faça login para continuar.');
      setCadNome(''); setCadEmail(''); setCadSenha(''); setCadConfirmar('');
      setTimeout(() => setStep(STEPS.LOGIN), 2200);
    } catch (err) {
      setCadErro(err.message || 'Erro ao criar conta.');
    } finally {
      setCadLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{ background: 'var(--card-warm)', padding: '14px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-warm)', boxShadow: '0 2px 8px var(--shadow-warm)' }}>
        <h1 style={{ fontSize: 22, color: 'var(--text-warm)' }}>Grão &amp; Cesta</h1>
        <nav style={{ display: 'flex', gap: 20 }}>
          <Link to="/" style={{ color: 'var(--muted-warm)', fontWeight: 600, textDecoration: 'none' }}>Home</Link>
          <Link to="/login" style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
        </nav>
      </header>

      <div className="login-container">
        <div className="login-card">

          {/* ── STEP LOGIN ───────────────────────────────────── */}
          {step === STEPS.LOGIN && (
            <>
              <h2>Acessar Conta</h2>
              <p className="subtitulo">Grão &amp; Cesta — Gestão de cestas e pedidos</p>
              {loginErro && <div className="msg msg-erro">{loginErro}</div>}
              <form onSubmit={handleLogin}>
                <div className="login-form-group">
                  <label>E-mail</label>
                  <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required placeholder="seu@email.com" autoComplete="email" />
                </div>
                <div className="login-form-group">
                  <label>Senha</label>
                  <input type="password" value={loginSenha} onChange={e => setLoginSenha(e.target.value)} required placeholder="••••••••" autoComplete="current-password" />
                </div>
                <button type="submit" className="btn-login-primary" disabled={loginLoading}>
                  {loginLoading ? 'Entrando...' : 'ENTRAR'}
                </button>
              </form>
              <div className="divisor" />
              <div className="criar-conta-row">
                <span>Não tem uma conta?</span>
                <button className="btn-link" onClick={() => setStep(STEPS.CADASTRO)}>Criar conta</button>
              </div>
            </>
          )}

          {/* ── STEP OTP ─────────────────────────────────────── */}
          {step === STEPS.OTP && (
            <>
              <h2>Verificar E-mail</h2>
              <p className="subtitulo">Confirme seu acesso para continuar</p>
              {otpErro && <div className="msg msg-erro">{otpErro}</div>}
              <div className="otp-info">
                Um código foi enviado para <strong>{pendente.email}</strong>.<br />
                Verifique sua caixa de entrada (e spam).
              </div>
              <form onSubmit={handleOTP}>
                <div className="login-form-group">
                  <label>Código de verificação</label>
                  <input
                    type="text"
                    className="input-codigo"
                    value={codigo}
                    onChange={e => setCodigo(e.target.value)}
                    required
                    placeholder="000000"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                  />
                </div>
                <button type="submit" className="btn-login-primary" disabled={otpLoading}>
                  {otpLoading ? 'Verificando...' : 'CONFIRMAR CÓDIGO'}
                </button>
              </form>
              <div className="reenviar-row">
                Não recebeu? <button type="button" onClick={reenviarCodigo}>Reenviar código</button>
              </div>
              <button className="btn-login-ghost" onClick={voltarLogin}>Voltar ao login</button>
            </>
          )}

          {/* ── STEP CADASTRO ─────────────────────────────────── */}
          {step === STEPS.CADASTRO && (
            <>
              <h2>Criar Conta</h2>
              <p className="subtitulo">Preencha seus dados para se registrar</p>
              {cadErro && <div className="msg msg-erro">{cadErro}</div>}
              {cadSucesso && <div className="msg msg-sucesso">{cadSucesso}</div>}
              <form onSubmit={handleCadastro}>
                <div className="login-form-group">
                  <label>Nome completo</label>
                  <input type="text" value={cadNome} onChange={e => setCadNome(e.target.value)} required placeholder="Seu nome" />
                </div>
                <div className="login-form-group">
                  <label>E-mail</label>
                  <input type="email" value={cadEmail} onChange={e => setCadEmail(e.target.value)} required placeholder="seu@email.com" />
                </div>
                <div className="login-form-group">
                  <label>Senha</label>
                  <input type="password" value={cadSenha} onChange={e => setCadSenha(e.target.value)} required placeholder="Mínimo 6 caracteres" minLength={6} />
                </div>
                <div className="login-form-group">
                  <label>Confirmar senha</label>
                  <input type="password" value={cadConfirmar} onChange={e => setCadConfirmar(e.target.value)} required placeholder="Repita a senha" />
                </div>
                <button type="submit" className="btn-login-primary" disabled={cadLoading}>
                  {cadLoading ? 'Cadastrando...' : 'CRIAR CONTA'}
                </button>
              </form>
              <button className="btn-login-ghost" onClick={() => setStep(STEPS.LOGIN)}>Já tenho uma conta</button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
