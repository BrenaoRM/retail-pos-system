// src/pages/Historico/Historico.jsx
// ─────────────────────────────────────────────────────────────────────
// Página dedicada ao histórico de fechamentos.
// Admin/Gerente veem todos; Funcionário vê apenas os próprios.
// ─────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { buscarFechamentos, deletarFechamento } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import './Historico.css';

/* ── Ícones ── */
const IconCheck  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconTrash  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IconEye    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconBack   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IconStore  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconBike   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 0 0-1 1v5.5l-5-3.5"/><path d="M9 6h5l3 5.5"/></svg>;

const formatBRL = (val) =>
  (Number(val) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ── Modal de detalhes ── */
const ModalDetalhe = ({ fechamento, onFechar }) => {
  if (!fechamento) return null;
  const ok = Math.abs(fechamento.total_geral) < 1;

  return (
    <div className="hist-modal-overlay" onClick={onFechar}>
      <div className="hist-modal-card" onClick={e => e.stopPropagation()}>
        <div className={`hist-detalhe-banner ${ok ? 'banner--ok' : 'banner--alerta'}`}>
          <span className="hist-detalhe-status">{ok ? <IconCheck /> : <IconAlert />}</span>
          <div>
            <p className="hist-detalhe-titulo">{ok ? 'Caixa fechado' : 'Divergência'}</p>
            <p className="hist-detalhe-data">{fechamento.data_referencia}</p>
            {fechamento.nome_usuario && (
              <p className="hist-detalhe-quem">por {fechamento.nome_usuario}</p>
            )}
          </div>
          <span className={`hist-detalhe-total ${ok ? 'val--ok' : 'val--alerta'}`}>
            R$ {formatBRL(fechamento.total_geral)}
          </span>
        </div>

        <div className="hist-detalhe-grid">
          {/* Salão */}
          <div className="hist-detalhe-bloco hist-bloco--salao">
            <div className="hist-bloco-header">
              <IconStore /> Salão
            </div>
            <div className="hist-linha"><span>Esperado</span><span>R$ {formatBRL(fechamento.venda_sist)}</span></div>
            <div className="hist-linha"><span>Realizado</span><span>R$ {formatBRL(fechamento.real_salao)}</span></div>
            <div className="hist-linha sub"><span>Excedente func.</span><span>R$ {formatBRL(fechamento.excedente)}</span></div>
            <div className="hist-divider" />
            <div className="hist-linha accent"><span>Diferença</span><span>R$ {formatBRL(fechamento.dif_salao)}</span></div>
          </div>

          {/* Delivery */}
          <div className="hist-detalhe-bloco hist-bloco--delivery">
            <div className="hist-bloco-header">
              <IconBike /> Delivery
            </div>
            <div className="hist-linha"><span>Esperado</span><span>R$ {formatBRL(Number(fechamento.venda_web) + Number(fechamento.venda_app))}</span></div>
            <div className="hist-linha"><span>Realizado (líq.)</span><span>R$ {formatBRL(fechamento.real_deliv_liq)}</span></div>
            <div className="hist-linha sub"><span>Gasolina</span><span>R$ {formatBRL(fechamento.total_gas)}</span></div>
            <div className="hist-divider" />
            <div className="hist-linha accent"><span>Diferença</span><span>R$ {formatBRL(fechamento.dif_deliv)}</span></div>
          </div>
        </div>

        {/* Motoboys */}
        {fechamento.motoboys?.length > 0 && (
          <div className="hist-motoboys">
            <p className="hist-moto-titulo">Motoboys</p>
            {fechamento.motoboys.map((m, i) => (
              <div key={i} className="hist-moto-row">
                <span className="hist-moto-avatar">{m.nome?.charAt(0).toUpperCase()}</span>
                <span className="hist-moto-nome">{m.nome}</span>
                <span className="hist-moto-qtd">{m.qtd} entregas</span>
                <span className="hist-moto-total">R$ {formatBRL(m.maq + m.din + m.gas)}</span>
              </div>
            ))}
          </div>
        )}

        <button className="hist-btn-fechar" onClick={onFechar}>Fechar</button>
      </div>
    </div>
  );
};

/* ── Modal de confirmação ── */
const ModalConfirmar = ({ onConfirmar, onCancelar }) => (
  <div className="hist-modal-overlay" onClick={onCancelar}>
    <div className="hist-modal-card hist-modal-sm" onClick={e => e.stopPropagation()}>
      <p className="hist-confirmar-titulo">Excluir fechamento?</p>
      <p className="hist-confirmar-sub">Esta ação não pode ser desfeita.</p>
      <div className="hist-confirmar-btns">
        <button className="hist-btn-ghost" onClick={onCancelar}>Cancelar</button>
        <button className="hist-btn-danger" onClick={onConfirmar}>Excluir</button>
      </div>
    </div>
  </div>
);

/* ── Componente principal ── */
const Historico = () => {
  const navigate  = useNavigate();
  const { isAdmin, isGerente } = useAuth();

  const [fechamentos,  setFechamentos]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [erro,         setErro]         = useState('');
  const [detalhe,      setDetalhe]      = useState(null);
  const [deletandoId,  setDeletandoId]  = useState(null);
  const [filtro,       setFiltro]       = useState('');
  const [pagina,       setPagina]       = useState(0);
  const [temMais,      setTemMais]      = useState(false);
  const LIMITE = 20;

  const carregar = useCallback(async (pag = 0) => {
    setLoading(true); setErro('');
    try {
      const dados = await buscarFechamentos({ limite: LIMITE + 1, pagina: pag });
      if (pag === 0) setFechamentos(dados.slice(0, LIMITE));
      else           setFechamentos(prev => [...prev, ...dados.slice(0, LIMITE)]);
      setTemMais(dados.length > LIMITE);
      setPagina(pag);
    } catch (e) {
      setErro('Erro ao carregar fechamentos: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(0); }, [carregar]);

  const handleDeletar = async () => {
    try {
      await deletarFechamento(deletandoId);
      setFechamentos(prev => prev.filter(f => f.id !== deletandoId));
    } catch (e) {
      setErro('Erro ao excluir: ' + e.message);
    } finally {
      setDeletandoId(null);
    }
  };

  const filtrados = fechamentos.filter(f =>
    !filtro || f.data_referencia?.toLowerCase().includes(filtro.toLowerCase()) ||
    f.nome_usuario?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="hist-root">
      <div className="hist-main">

        {/* Header */}
        <div className="hist-header">
          <button className="hist-btn-back" onClick={() => navigate('/')}>
            <IconBack /> Voltar
          </button>
          <div>
            <h1 className="hist-titulo">Fechamentos</h1>
            <p className="hist-sub">
              {isAdmin || isGerente ? 'Todos os fechamentos da empresa' : 'Seus fechamentos'}
            </p>
          </div>
        </div>

        {/* Filtro */}
        <input
          className="hist-filtro"
          type="text"
          placeholder="Filtrar por data ou funcionário..."
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
        />

        {/* Lista */}
        {loading && pagina === 0 ? (
          <div className="hist-loading">Carregando...</div>
        ) : erro ? (
          <div className="hist-erro">{erro}</div>
        ) : filtrados.length === 0 ? (
          <div className="hist-vazio">Nenhum fechamento encontrado.</div>
        ) : (
          <div className="hist-lista">
            {filtrados.map(f => {
              const ok = Math.abs(f.total_geral) < 1;
              return (
                <div key={f.id} className="hist-item">
                  <span className={`hist-dot ${ok ? 'hist-dot--ok' : 'hist-dot--alerta'}`} />
                  <div className="hist-item-info">
                    <span className="hist-item-data">{f.data_referencia}</span>
                    {(isAdmin || isGerente) && f.nome_usuario && (
                      <span className="hist-item-quem">{f.nome_usuario}</span>
                    )}
                  </div>
                  <span className={`hist-item-total ${ok ? 'hist-total--ok' : 'hist-total--alerta'}`}>
                    R$ {formatBRL(f.total_geral)}
                  </span>
                  <div className="hist-item-acoes">
                    <button className="hist-btn-acao" onClick={() => setDetalhe(f)} title="Ver detalhes">
                      <IconEye />
                    </button>
                    {isAdmin && (
                      <button className="hist-btn-acao hist-btn-del" onClick={() => setDeletandoId(f.id)} title="Excluir">
                        <IconTrash />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginação */}
        {temMais && !loading && (
          <button className="hist-btn-mais" onClick={() => carregar(pagina + 1)}>
            Carregar mais
          </button>
        )}
        {loading && pagina > 0 && <div className="hist-loading">Carregando...</div>}

      </div>

      {detalhe    && <ModalDetalhe fechamento={detalhe} onFechar={() => setDetalhe(null)} />}
      {deletandoId && <ModalConfirmar onConfirmar={handleDeletar} onCancelar={() => setDeletandoId(null)} />}
    </div>
  );
};

export default Historico;
