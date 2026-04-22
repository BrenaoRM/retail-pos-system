// src/pages/Plano/Plano.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { criarAssinaturaMp } from '../../lib/api';
import './Plano.css';

const features = [
  'Histórico ilimitado de fechamentos',
  'Relatórios e gráficos mensais',
  'Gestão de equipe completa',
  'Exportação em PDF e Excel',
];

function ListaFeatures() {
  return (
    <div className="plano-features">
      {features.map((f) => (
        <div className="plano-feature" key={f}>
          <span className="feature-check">✓</span>
          <span>{f}</span>
        </div>
      ))}
    </div>
  );
}

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
      const dados = await criarAssinaturaMp({ userId: user.id, userEmail: user.email });
      if (!dados.init_point) throw new Error('Link de assinatura não retornado.');
      window.location.href = dados.init_point;
    } catch (err) {
      setErro(err.message || 'Erro ao iniciar assinatura. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  // ── Plano ativo ──
  if (planoAtivo) {
    return (
      <div className="plano-root">
        <div className="plano-card">
          <div className="plano-icon">⭐</div>
          <h1>Você é Pro!</h1>
          <p className="plano-sub">Sua assinatura está ativa e é renovada automaticamente todo mês.</p>
          {expira && (
            <div className="plano-info-expira">
              <span>Próxima renovação</span>
              <strong>{expira}</strong>
            </div>
          )}
          <ListaFeatures />
          <div className="plano-badge plano-badge--ativo">✅ Assinatura ativa</div>
          <button className="plano-btn plano-btn--secundario" onClick={recarregarPerfil}>
            Atualizar status
          </button>
        </div>
      </div>
    );
  }

  // ── Cancelado mas dentro do prazo ──
  const aindaAtivo = !planoAtivo && perfil?.plano_expira_em && new Date(perfil.plano_expira_em) > new Date();
  if (aindaAtivo) {
    return (
      <div className="plano-root">
        <div className="plano-card">
          <div className="plano-icon">⏳</div>
          <h1>Acesso até {expira}</h1>
          <p className="plano-sub">Sua assinatura foi cancelada, mas você ainda tem acesso até o fim do período pago.</p>
          <ListaFeatures />
          <button className="plano-btn plano-btn--primario" onClick={handleAssinar} disabled={carregando}>
            {carregando ? 'Aguarde...' : '🔄 Reativar assinatura'}
          </button>
          {erro && <p className="plano-erro">{erro}</p>}
        </div>
      </div>
    );
  }

  // ── Sem plano ──
  return (
    <div className="plano-root">
      <div className="plano-card">
        <div className="plano-icon">⭐</div>
        <h1>Big Burguer Pro</h1>
        <p className="plano-sub">Comece grátis por 30 dias. Depois, apenas</p>
        <div className="plano-preco">
          <span className="plano-preco-valor">R$ 79,90</span>
          <span className="plano-preco-sufixo">/mês</span>
        </div>
        <div className="plano-trial-badge">🎁 Primeiro mês totalmente grátis</div>
        <ListaFeatures />
        {erro && <p className="plano-erro">{erro}</p>}
        <button className="plano-btn plano-btn--primario" onClick={handleAssinar} disabled={carregando}>
          {carregando ? 'Aguarde...' : '🚀 Começar grátis'}
        </button>
        <p className="plano-rodape">Cobrança automática mensal · Cancele quando quiser · Sem multa</p>
      </div>
    </div>
  );
}
