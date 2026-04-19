// src/pages/Plano/Plano.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import './Plano.css';

/* ── Ícones ── */
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconBack = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);
const IconPix = () => (
  <svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor">
    <path d="M242.4 292.5C247.8 287.1 255.1 284.1 262.5 284.1C269.9 284.1 277.2 287 282.6 292.5L371.1 381C377.1 387 380.4 394.9 380.4 403.1C380.4 411.4 377.1 419.2 371.1 425.2L282.6 513.7C277.2 519.1 269.8 522.1 262.5 522.1C255.1 522.1 247.8 519.1 242.4 513.7L153.9 425.2C147.9 419.2 144.6 411.4 144.6 403.1C144.6 394.8 147.9 387 153.9 381L242.4 292.5zM262.5 468.1L324.5 406.1L262.5 344.1L200.5 406.1L262.5 468.1z"/>
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

// ─────────────────────────────────────────────────────────────────────
// Helper: lê query params do hash do HashRouter.
// Com HashRouter a URL fica: /#/plano?status=approved&...
// window.location.search fica vazio — os params estão depois do hash.
// ─────────────────────────────────────────────────────────────────────
const getHashParams = () => {
  const hash = window.location.hash; // ex: "#/plano?status=approved&external_reference=uuid"
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) return new URLSearchParams();
  return new URLSearchParams(hash.slice(queryIndex + 1));
};

const Plano = () => {
  const navigate = useNavigate();
  const { perfil, planoAtivo, recarregarPerfil } = useAuth();
  const [loading, setLoading] = useState(false);
  const [erro,    setErro]    = useState('');
  const [sucesso, setSucesso] = useState('');

  // Verifica retorno do Mercado Pago na URL (compatível com HashRouter)
  useEffect(() => {
    const params = getHashParams();
    const status = params.get('status');
    const extRef = params.get('external_reference');

    if (status === 'approved' && extRef) {
      setSucesso('Pagamento aprovado! Seu plano Pro está ativo. 🎉');
      recarregarPerfil();
      // Limpa os params sem recarregar
      window.history.replaceState(null, '', window.location.pathname + '#/plano');
    } else if (status === 'failure') {
      setErro('Pagamento recusado. Tente novamente ou use outro método.');
      window.history.replaceState(null, '', window.location.pathname + '#/plano');
    } else if (status === 'pending') {
      setSucesso('Pagamento pendente (PIX). Assim que confirmado seu plano será ativado.');
      window.history.replaceState(null, '', window.location.pathname + '#/plano');
    }
  }, []);

  const handleAssinar = async () => {
    setErro(''); setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('criar-preferencia-mp', {
        body: {
          titulo:    'Big Burguer Pro — Mensal',
          preco:     49.00,
          userId:    perfil?.id,
          userEmail: perfil?.email,
        },
      });

      if (error) throw error;
      if (!data?.init_point) throw new Error('Link de pagamento não retornado.');

      // Redireciona para o checkout do Mercado Pago
      window.location.href = data.init_point;

    } catch (e) {
      setErro('Erro ao gerar pagamento: ' + e.message);
      setLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (!confirm('Tem certeza? O acesso continua até o fim do período pago.')) return;
    setErro(''); setLoading(true);
    try {
      const { error } = await supabase
        .from('perfis')
        .update({ plano_ativo: false })
        .eq('id', perfil?.id);
      if (error) throw error;
      await recarregarPerfil();
      setSucesso('Plano cancelado. Sentiremos sua falta!');
    } catch (e) {
      setErro('Erro ao cancelar: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="plano-root">
      <div className="plano-main">

        <div className="plano-header">
          <button className="plano-btn-back" onClick={() => navigate('/')}>
            <IconBack /> Voltar
          </button>
        </div>

        {sucesso && <div className="plano-sucesso-banner"><IconCheck /> {sucesso}</div>}
        {erro    && <div className="plano-erro-banner">{erro}</div>}

        <div className={`plano-card ${planoAtivo ? 'plano-card--ativo' : ''}`}>
          <div className="plano-card-top">
            <div className="plano-badge"><IconStar /> Pro</div>
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

          <div className="plano-metodos">
            <span className="plano-metodo plano-metodo--pix"><IconPix /> PIX</span>
            <span className="plano-metodo">💳 Cartão de crédito</span>
            <span className="plano-metodo">🏦 Boleto</span>
          </div>

          <div className="plano-acao">
            {planoAtivo ? (
              <div className="plano-ativo-wrap">
                <div className="plano-ativo-badge">✓ Plano Pro ativo</div>
                <button className="plano-btn-cancelar" onClick={handleCancelar} disabled={loading}>
                  {loading ? 'Aguarde...' : 'Cancelar assinatura'}
                </button>
              </div>
            ) : (
              <button className="plano-btn-assinar" onClick={handleAssinar} disabled={loading}>
                {loading ? 'Gerando pagamento...' : 'Assinar agora — R$ 49/mês'}
              </button>
            )}
          </div>

          <div className="plano-mp-info">
            <img
              src="https://imgmp.mlstatic.com/org-img/MLB/MP/PDF/botoes/img/MP_RGB.png"
              alt="Mercado Pago"
              height="18"
              style={{ opacity: 0.5 }}
            />
            <span>Pagamento seguro via Mercado Pago · Cancele quando quiser</span>
          </div>
        </div>

        <div className="plano-faq">
          {[
            ['Preciso de CNPJ para assinar?',    'Não. Pode pagar com CPF via PIX, cartão de crédito ou boleto.'],
            ['Como funciona o PIX?',              'Você recebe um QR Code, paga em segundos e o plano é ativado automaticamente.'],
            ['Posso cancelar a qualquer momento?','Sim. O acesso continua até o fim do período pago e não há cobrança após o cancelamento.'],
            ['Os dados ficam salvos se cancelar?','Sim, seu histórico é mantido por 30 dias após o cancelamento.'],
          ].map(([p, r], i) => (
            <div key={i} className="plano-faq-item">
              <p className="plano-faq-p">{p}</p>
              <p className="plano-faq-r">{r}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Plano;
