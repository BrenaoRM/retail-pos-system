// src/pages/Plano/Plano.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { criarPreferenciaMp } from '../../lib/api';
import './Plano.css';

const PRECO  = 29.90;   // ← altere o valor aqui quando quiser
const TITULO = 'Big Burguer Pro — Mensal';

export default function Plano() {
  const { user, perfil, planoAtivo, recarregarPerfil } = useAuth();
  const [carregando, setCarregando] = useState(false);
  const [erro,       setErro]       = useState('');

  async function handleAssinar() {
    setErro('');
    setCarregando(true);
    try {
      const dados = await criarPreferenciaMp({
        titulo:    TITULO,
        preco:     PRECO,
        userId:    user.id,
        userEmail: user.email,
      });

      // Redireciona para o checkout do Mercado Pago
      // Em produção use dados.init_point
      // Em teste use dados.sandbox_point
      const url = dados.sandbox_point || dados.init_point;
      if (!url) throw new Error('Link de pagamento não retornado.');
      window.location.href = url;

    } catch (err) {
      setErro(err.message || 'Erro ao iniciar pagamento. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  // ── Plano já ativo ────────────────────────────────────────
  if (planoAtivo) {
    return (
      <div className="plano-root">
        <div className="plano-card">
          <div className="plano-icon">⭐</div>
          <h1>Você é Pro!</h1>
          <p className="plano-sub">
            Sua assinatura está ativa. Aproveite todos os recursos do Big Burguer.
          </p>

          <div className="plano-features">
            {features.map((f) => (
              <div className="plano-feature" key={f}>
                <span className="feature-check">✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>

          <div className="plano-badge" style={{ background: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.3)', color: '#34d399' }}>
            ✅ Plano ativo
          </div>

          <button
            onClick={recarregarPerfil}
            style={styles.btnSecundario}
          >
            Atualizar status
          </button>
        </div>
      </div>
    );
  }

  // ── Plano não ativo — tela de assinatura ──────────────────
  return (
    <div className="plano-root">
      <div className="plano-card">
        <div className="plano-icon">⭐</div>
        <h1>Big Burguer Pro</h1>
        <p className="plano-sub">
          Desbloqueie todos os recursos avançados por apenas
        </p>

        <div style={styles.preco}>
          <span style={styles.precoValor}>R$ {PRECO.toFixed(2).replace('.', ',')}</span>
          <span style={styles.precoSufixo}>/mês</span>
        </div>

        <div className="plano-features">
          {features.map((f) => (
            <div className="plano-feature" key={f}>
              <span className="feature-check">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>

        {erro && (
          <p style={styles.erro}>{erro}</p>
        )}

        <button
          onClick={handleAssinar}
          disabled={carregando}
          style={{
            ...styles.btnPrimario,
            opacity: carregando ? 0.7 : 1,
            cursor:  carregando ? 'not-allowed' : 'pointer',
          }}
        >
          {carregando ? 'Aguarde...' : '💳 Assinar agora'}
        </button>

        <p style={styles.rodape}>
          Pagamento seguro via Mercado Pago · Cancele quando quiser
        </p>
      </div>
    </div>
  );
}

// ── Dados ────────────────────────────────────────────────────
const features = [
  'Histórico ilimitado de fechamentos',
  'Relatórios e gráficos mensais',
  'Gestão de equipe completa',
  'Exportação em PDF e Excel',
];

// ── Estilos inline (sem alterar o CSS existente) ─────────────
const styles = {
  preco: {
    display:    'flex',
    alignItems: 'baseline',
    gap:        4,
    margin:     '4px 0 8px',
  },
  precoValor: {
    fontSize:   '2.2rem',
    fontWeight: 800,
    color:      '#f1f5f9',
    letterSpacing: '-0.04em',
  },
  precoSufixo: {
    fontSize: '0.9rem',
    color:    '#64748b',
  },
  btnPrimario: {
    width:        '100%',
    padding:      '14px',
    background:   'linear-gradient(135deg, #3b82f6, #2563eb)',
    border:       'none',
    borderRadius: 12,
    color:        '#fff',
    fontSize:     '1rem',
    fontWeight:   700,
    fontFamily:   "'IBM Plex Sans', 'Inter', system-ui, sans-serif",
    transition:   'all 0.2s',
    marginTop:    4,
  },
  btnSecundario: {
    background:   'transparent',
    border:       '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color:        '#64748b',
    padding:      '8px 16px',
    fontSize:     '0.82rem',
    fontFamily:   "'IBM Plex Sans', 'Inter', system-ui, sans-serif",
    cursor:       'pointer',
  },
  erro: {
    color:      '#f87171',
    fontSize:   '0.85rem',
    background: 'rgba(248,113,113,0.1)',
    border:     '1px solid rgba(248,113,113,0.2)',
    borderRadius: 8,
    padding:    '8px 12px',
    width:      '100%',
    margin:     0,
  },
  rodape: {
    fontSize: '0.75rem',
    color:    '#475569',
    margin:   0,
  },
};
