// src/pages/Plano/Plano.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { criarAssinaturaMp } from '../../lib/api';
import './Plano.css';

export default function Plano() {
  const { user, perfil, planoAtivo, recarregarPerfil } = useAuth();
  const [carregando, setCarregando] = useState(false);
  const [erro,       setErro]       = useState('');

  const expira = perfil?.plano_expira_em
    ? new Date(perfil.plano_expira_em).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : null;

  async function handleAssinar() {
    setErro('');
    setCarregando(true);
    try {
      const dados = await criarAssinaturaMp({
        userId:    user.id,
        userEmail: user.email,
      });
      if (!dados.init_point) throw new Error('Link de assinatura não retornado.');
      window.location.href = dados.init_point;
    } catch (err) {
      setErro(err.message || 'Erro ao iniciar assinatura. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  if (planoAtivo) {
    return (
      <div className="plano-root">
        <div className="plano-card">
          <div className="plano-icon">⭐</div>
          <h1>Você é Pro!</h1>
          <p className="plano-sub">Sua assinatura está ativa e é renovada automaticamente todo mês.</p>
          {expira && (
            <div style={styles.infoExpira}>
              <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Próxima renovação</span>
              <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.9rem' }}>{expira}</span>
            </div>
          )}
          <div className="plano-features">
            {features.map((f) => (
              <div className="plano-feature" key={f}>
                <span className="feature-check">✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
          <div className="plano-badge" style={{ background: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.3)', color: '#34d399' }}>
            ✅ Assinatura ativa
          </div>
          <button onClick={recarregarPerfil} style={styles.btnSecundario}>Atualizar status</button>
        </div>
      </div>
    );
  }

  const aindaAtivo = !planoAtivo && perfil?.plano_expira_em && new Date(perfil.plano_expira_em) > new Date();
  if (aindaAtivo) {
    return (
      <div className="plano-root">
        <div className="plano-card">
          <div className="plano-icon">⏳</div>
          <h1>Acesso até {expira}</h1>
          <p className="plano-sub">Sua assinatura foi cancelada, mas você ainda tem acesso até o fim do período pago.</p>
          <div className="plano-features">
            {features.map((f) => (
              <div className="plano-feature" key={f}>
                <span className="feature-check">✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
          <button onClick={handleAssinar} disabled={carregando} style={{ ...styles.btnPrimario, opacity: carregando ? 0.7 : 1 }}>
            {carregando ? 'Aguarde...' : '🔄 Reativar assinatura'}
          </button>
          {erro && <p style={styles.erro}>{erro}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="plano-root">
      <div className="plano-card">
        <div className="plano-icon">⭐</div>
        <h1>Big Burguer Pro</h1>
        <p className="plano-sub">Comece grátis por 30 dias. Depois, apenas</p>
        <div style={styles.preco}>
          <span style={styles.precoValor}>R$ 149,90</span>
          <span style={styles.precoSufixo}>/mês</span>
        </div>
        <div style={styles.trialBadge}>🎁 Primeiro mês totalmente grátis</div>
        <div className="plano-features">
          {features.map((f) => (
            <div className="plano-feature" key={f}>
              <span className="feature-check">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
        {erro && <p style={styles.erro}>{erro}</p>}
        <button
          onClick={handleAssinar}
          disabled={carregando}
          style={{ ...styles.btnPrimario, opacity: carregando ? 0.7 : 1, cursor: carregando ? 'not-allowed' : 'pointer' }}
        >
          {carregando ? 'Aguarde...' : '🚀 Começar grátis'}
        </button>
        <p style={styles.rodape}>Cobrança automática mensal · Cancele quando quiser · Sem multa</p>
      </div>
    </div>
  );
}

const features = [
  'Histórico ilimitado de fechamentos',
  'Relatórios e gráficos mensais',
  'Gestão de equipe completa',
  'Exportação em PDF e Excel',
];

const styles = {
  preco:       { display: 'flex', alignItems: 'baseline', gap: 4, margin: '4px 0 8px' },
  precoValor:  { fontSize: '2.2rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.04em' },
  precoSufixo: { fontSize: '0.9rem', color: '#64748b' },
  trialBadge:  { background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399', borderRadius: 999, padding: '5px 16px', fontSize: '0.82rem', fontWeight: 600 },
  infoExpira:  { width: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left' },
  btnPrimario: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: 12, color: '#fff', fontSize: '1rem', fontWeight: 700, fontFamily: "'IBM Plex Sans', 'Inter', system-ui, sans-serif", transition: 'all 0.2s', marginTop: 4, cursor: 'pointer' },
  btnSecundario: { background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#64748b', padding: '8px 16px', fontSize: '0.82rem', fontFamily: "'IBM Plex Sans', 'Inter', system-ui, sans-serif", cursor: 'pointer' },
  erro:        { color: '#f87171', fontSize: '0.85rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '8px 12px', width: '100%', margin: 0 },
  rodape:      { fontSize: '0.75rem', color: '#475569', margin: 0 },
};
