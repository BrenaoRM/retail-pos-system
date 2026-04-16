// src/pages/Plano/Plano.jsx
// ─────────────────────────────────────────────────────────────────────
// Página de assinatura mensal via Stripe.
// O botão chama um Edge Function do Supabase que cria a sessão Stripe.
// ─────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import './Plano.css';

const IconCheck  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconBack   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IconStar   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const IconStripe = () => (
  <svg height="16" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M59.64 14.28h-8.06v-1.9h8.06v1.9zm-25.9-5.3c-1.07 0-1.9.86-1.9 1.9 0 1.06.83 1.9 1.9 1.9 1.06 0 1.9-.84 1.9-1.9 0-1.04-.84-1.9-1.9-1.9zm-9.5 0c-1.06 0-1.9.86-1.9 1.9 0 1.06.84 1.9 1.9 1.9 1.07 0 1.9-.84 1.9-1.9 0-1.04-.83-1.9-1.9-1.9z" fill="#635BFF"/>
  </svg>
);

const BENEFICIOS = [
  'Fechamentos ilimitados',
  'Histórico completo com filtros',
  'Múltiplos funcionários',
  'Exportar como imagem para WhatsApp',
  'Backup automático na nuvem',
  'Suporte prioritário',
];

const Plano = () => {
  const navigate  = useNavigate();
  const { perfil, planoAtivo, recarregarPerfil } = useAuth();
  const [loading,  setLoading]  = useState(false);
  const [erro,     setErro]     = useState('');

  const handleAssinar = async () => {
    setErro(''); setLoading(true);
    try {
      // Chama a Edge Function do Supabase que cria sessão Stripe Checkout
      const { data, error } = await supabase.functions.invoke('criar-checkout', {
        body: {
          priceId:    'price_1TLs66JnZPuDZA8i8tZ9G1He',          // ← Substitua pelo seu Price ID do Stripe
          successUrl: `${window.location.origin}/plano?sucesso=1`,
          cancelUrl:  `${window.location.origin}/plano`,
        },
      });
      if (error) throw error;
      // Redireciona para o Stripe Checkout
      window.location.href = data.url;
    } catch (e) {
      setErro('Erro ao iniciar pagamento: ' + e.message);
      setLoading(false);
    }
  };

  const handleCancelar = async () => {
    setErro(''); setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('cancelar-assinatura');
      if (error) throw error;
      await recarregarPerfil();
    } catch (e) {
      setErro('Erro ao cancelar: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Verifica retorno do Stripe (?sucesso=1)
  const sucesso = new URLSearchParams(window.location.search).get('sucesso') === '1';

  return (
    <div className="plano-root">
      <div className="plano-main">

        <div className="plano-header">
          <button className="plano-btn-back" onClick={() => navigate('/')}>
            <IconBack /> Voltar
          </button>
        </div>

        {sucesso && (
          <div className="plano-sucesso-banner">
            <IconCheck /> Plano ativado com sucesso! Bem-vindo ao Pro.
          </div>
        )}

        {/* Card do plano */}
        <div className={`plano-card ${planoAtivo ? 'plano-card--ativo' : ''}`}>
          <div className="plano-card-top">
            <div className="plano-badge">
              <IconStar /> Pro
            </div>
            <div className="plano-preco">
              <span className="plano-valor">R$ 49</span>
              <span className="plano-periodo">/mês</span>
            </div>
            <p className="plano-desc">
              Tudo que você precisa para fechar o caixa com segurança e histórico completo.
            </p>
          </div>

          <div className="plano-beneficios">
            {BENEFICIOS.map((b, i) => (
              <div key={i} className="plano-beneficio">
                <span className="plano-check"><IconCheck /></span>
                <span>{b}</span>
              </div>
            ))}
          </div>

          {erro && <div className="plano-erro">{erro}</div>}

          {planoAtivo ? (
            <div className="plano-ativo-wrap">
              <div className="plano-ativo-badge">✓ Plano ativo</div>
              <button className="plano-btn-cancelar" onClick={handleCancelar} disabled={loading}>
                {loading ? 'Aguarde...' : 'Cancelar assinatura'}
              </button>
            </div>
          ) : (
            <button className="plano-btn-assinar" onClick={handleAssinar} disabled={loading}>
              {loading ? 'Aguarde...' : (
                <>Assinar agora — R$ 49/mês</>
              )}
            </button>
          )}

          <div className="plano-stripe-info">
            <IconStripe /> Pagamento seguro via Stripe · Cancele quando quiser
          </div>
        </div>

        {/* FAQ */}
        <div className="plano-faq">
          <div className="plano-faq-item">
            <p className="plano-faq-p">Como funciona o pagamento?</p>
            <p className="plano-faq-r">Via cartão de crédito ou PIX, processado pelo Stripe. Você recebe um recibo por email.</p>
          </div>
          <div className="plano-faq-item">
            <p className="plano-faq-p">Posso cancelar a qualquer momento?</p>
            <p className="plano-faq-r">Sim. O acesso continua até o fim do período pago e não há cobrança após o cancelamento.</p>
          </div>
          <div className="plano-faq-item">
            <p className="plano-faq-p">Os dados ficam salvos se eu cancelar?</p>
            <p className="plano-faq-r">Sim, seu histórico é mantido por 30 dias após o cancelamento.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Plano;
