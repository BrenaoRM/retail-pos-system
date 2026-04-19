// src/pages/Plano/Plano.jsx
// ─────────────────────────────────────────────────────────────
// Página reservada para assinatura de plano.
// Será implementada com Mercado Pago em versão futura.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import './Plano.css';

export default function Plano() {
  return (
    <div className="plano-root">
      <div className="plano-card">
        <div className="plano-icon">⭐</div>
        <h1>Big Burguer Pro</h1>
        <p className="plano-sub">
          Recursos avançados estão chegando em breve.
        </p>

        <div className="plano-features">
          <div className="plano-feature">
            <span className="feature-check">✓</span>
            <span>Histórico ilimitado de fechamentos</span>
          </div>
          <div className="plano-feature">
            <span className="feature-check">✓</span>
            <span>Relatórios e gráficos mensais</span>
          </div>
          <div className="plano-feature">
            <span className="feature-check">✓</span>
            <span>Gestão de equipe completa</span>
          </div>
          <div className="plano-feature">
            <span className="feature-check">✓</span>
            <span>Exportação em PDF e Excel</span>
          </div>
        </div>

        <div className="plano-badge">Em breve</div>
      </div>
    </div>
  );
}
