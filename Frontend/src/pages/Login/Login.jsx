// src/pages/Login/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, recuperarSenha } from '../../lib/supabase';
import './Login.css';

const IconBurguer = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6"  x2="21" y2="6"/>
    <path d="M3 12h18a6 6 0 0 1 0 12H3z"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const [modo,      setModo]      = useState('login');   // 'login' | 'recuperar'
  const [email,     setEmail]     = useState('');
  const [senha,     setSenha]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [erro,      setErro]      = useState('');
  const [sucesso,   setSucesso]   = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro(''); setLoading(true);
    try {
      await login(email, senha);
      navigate('/');
    } catch (err) {
      setErro(traduzirErro(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRecuperar = async (e) => {
    e.preventDefault();
    setErro(''); setLoading(true);
    try {
      await recuperarSenha(email);
      setSucesso('Email enviado! Verifique sua caixa de entrada.');
    } catch (err) {
      setErro(traduzirErro(err.message));
    } finally {
      setLoading(false);
    }
  };

  const traduzirErro = (msg) => {
    if (msg.includes('Invalid login'))     return 'Email ou senha incorretos.';
    if (msg.includes('Email not confirmed')) return 'Confirme seu email antes de entrar.';
    if (msg.includes('Too many requests')) return 'Muitas tentativas. Aguarde alguns minutos.';
    return 'Erro ao entrar. Tente novamente.';
  };

  return (
    <div className="login-root">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo-wrap">
          <div className="login-logo-icon"><IconBurguer /></div>
          <span className="login-logo-text">Big Burguer</span>
        </div>

        {modo === 'login' ? (
          <>
            <div className="login-header">
              <h1 className="login-titulo">Entrar</h1>
              <p className="login-sub">Acesse o sistema de fechamento</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="login-field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="login-field">
                <label>Senha</label>
                <div className="login-senha-wrap">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="btn-olho"
                    onClick={() => setMostrarSenha(v => !v)}
                    tabIndex={-1}
                  >
                    {mostrarSenha ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {erro && <div className="login-erro">{erro}</div>}

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <button
              className="btn-esqueci"
              onClick={() => { setModo('recuperar'); setErro(''); setSucesso(''); }}
            >
              Esqueci minha senha
            </button>
          </>
        ) : (
          <>
            <div className="login-header">
              <h1 className="login-titulo">Recuperar senha</h1>
              <p className="login-sub">Enviaremos um link para seu email</p>
            </div>

            <form onSubmit={handleRecuperar} className="login-form">
              <div className="login-field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>

              {erro    && <div className="login-erro">{erro}</div>}
              {sucesso && <div className="login-sucesso">{sucesso}</div>}

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>

            <button className="btn-esqueci" onClick={() => { setModo('login'); setErro(''); setSucesso(''); }}>
              ← Voltar ao login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
