
//teste
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import '../Login/Login.css';

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [senha, setSenha]     = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState('');
  const [pronto, setPronto]   = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const accessToken  = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type         = params.get('type');

    if (accessToken && type === 'recovery') {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) setErro('Link inválido ou expirado. Solicite um novo.');
        else setPronto(true);
      });
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setPronto(true);
        else setErro('Link inválido ou expirado. Solicite um novo.');
      });
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setErro('');
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) {
      setErro('Erro ao redefinir a senha. Tente solicitar um novo link.');
    } else {
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    }
    setLoading(false);
  }

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">🍔</span>
          <span className="login-logo-text">Big Burguer</span>
        </div>
        <div className="login-header">
          <h1>Definir senha</h1>
          <p>Escolha uma senha para acessar o sistema</p>
        </div>

        {erro && <div className="login-msg login-msg--erro">{erro}</div>}

        {!pronto && !erro && (
          <p style={{ textAlign: 'center', color: 'var(--muted)' }}>
            Verificando link…
          </p>
        )}

        {!pronto && erro && (
          <div className="login-links" style={{ marginTop: '1rem' }}>
            <button onClick={() => navigate('/login')}>Voltar ao login</button>
          </div>
        )}

        {pronto && (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label>Nova senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}