// src/pages/Login/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, registrar, recuperarSenha } from '../../lib/api';
import './Login.css';

// ── Ícones inline ─────────────────────────────────────────────
const IconEye = ({ fechado }) => fechado ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

// ── Tradutor de erros ─────────────────────────────────────────
function traduzirErro(msg = '') {
  if (msg.includes('Invalid login'))       return 'Email ou senha incorretos.';
  if (msg.includes('Email not confirmed')) return 'Confirme seu email antes de entrar.';
  if (msg.includes('already registered'))  return 'Este email já está cadastrado.';
  if (msg.includes('Password should'))     return 'A senha deve ter pelo menos 6 caracteres.';
  if (msg.includes('Too many requests'))   return 'Muitas tentativas. Aguarde alguns minutos.';
  return 'Algo deu errado. Tente novamente.';
}

// ── Modos: 'login' | 'registro' | 'recuperar' ────────────────
export default function Login() {
  const navigate = useNavigate();
  const [modo,         setModo]         = useState('login');
  const [nome,         setNome]         = useState('');
  const [email,        setEmail]        = useState('');
  const [senha,        setSenha]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [erro,         setErro]         = useState('');
  const [sucesso,      setSucesso]      = useState('');
  const [verSenha,     setVerSenha]     = useState(false);

  function resetar() {
    setErro(''); setSucesso('');
  }

  async function handleLogin(e) {
    e.preventDefault(); resetar(); setLoading(true);
    try {
      await login(email, senha);
      navigate('/');
    } catch (err) {
      setErro(traduzirErro(err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegistro(e) {
    e.preventDefault(); resetar(); setLoading(true);
    try {
      await registrar(email, senha, nome);
      setSucesso('Conta criada! Verifique seu email para confirmar o cadastro.');
      setModo('login');
    } catch (err) {
      setErro(traduzirErro(err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleRecuperar(e) {
    e.preventDefault(); resetar(); setLoading(true);
    try {
      await recuperarSenha(email);
      setSucesso('Email enviado! Verifique sua caixa de entrada.');
    } catch (err) {
      setErro(traduzirErro(err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      <div className="login-card">

        {/* Logo */}
        <div className="login-logo">
          <span className="login-logo-icon">🍔</span>
          <span className="login-logo-text">Big Burguer</span>
        </div>

        {/* Título */}
        <div className="login-header">
          <h1>
            {modo === 'login'     && 'Entrar'}
            {modo === 'registro'  && 'Criar conta'}
            {modo === 'recuperar' && 'Recuperar senha'}
          </h1>
          <p>
            {modo === 'login'     && 'Sistema de fechamento de caixa'}
            {modo === 'registro'  && 'Preencha os dados abaixo'}
            {modo === 'recuperar' && 'Enviaremos um link para seu email'}
          </p>
        </div>

        {/* Feedback */}
        {erro    && <div className="login-msg login-msg--erro">{erro}</div>}
        {sucesso && <div className="login-msg login-msg--ok">{sucesso}</div>}

        {/* ── FORM LOGIN ── */}
        {modo === 'login' && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required autoFocus />
            </div>
            <div className="login-field">
              <label>Senha</label>
              <div className="input-senha-wrap">
                <input type={verSenha ? 'text' : 'password'} value={senha}
                  onChange={e => setSenha(e.target.value)} placeholder="••••••" required />
                <button type="button" className="btn-ver-senha" onClick={() => setVerSenha(v => !v)}>
                  <IconEye fechado={verSenha} />
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <div className="login-links">
              <button type="button" onClick={() => { resetar(); setModo('recuperar'); }}>
                Esqueci a senha
              </button>
              <button type="button" onClick={() => { resetar(); setModo('registro'); }}>
                Criar conta
              </button>
            </div>
          </form>
        )}

        {/* ── FORM REGISTRO ── */}
        {modo === 'registro' && (
          <form onSubmit={handleRegistro} className="login-form">
            <div className="login-field">
              <label>Nome</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                placeholder="Seu nome" required autoFocus />
            </div>
            <div className="login-field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required />
            </div>
            <div className="login-field">
              <label>Senha</label>
              <div className="input-senha-wrap">
                <input type={verSenha ? 'text' : 'password'} value={senha}
                  onChange={e => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" required />
                <button type="button" className="btn-ver-senha" onClick={() => setVerSenha(v => !v)}>
                  <IconEye fechado={verSenha} />
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
            <div className="login-links">
              <button type="button" onClick={() => { resetar(); setModo('login'); }}>
                Já tenho conta
              </button>
            </div>
          </form>
        )}

        {/* ── FORM RECUPERAR ── */}
        {modo === 'recuperar' && (
          <form onSubmit={handleRecuperar} className="login-form">
            <div className="login-field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required autoFocus />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link'}
            </button>
            <div className="login-links">
              <button type="button" onClick={() => { resetar(); setModo('login'); }}>
                Voltar ao login
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
