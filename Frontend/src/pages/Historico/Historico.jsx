// src/pages/Historico/Historico.jsx
import React, { useState, useEffect } from 'react';
import { listarFechamentos } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import './Historico.css';

const fmt = (v) => (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Skeleton ──────────────────────────────────────────────────
function SkeletonLista() {
  return (
    <div className="hist-lista">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="sk-card" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}

// ── Modal de detalhe ──────────────────────────────────────────
function ModalDetalhe({ f, onFechar }) {
  const positivo = Math.abs(f.total_geral) < 1;

  return (
    <div className="hist-overlay" onClick={onFechar}>
      <div className="hist-modal" onClick={e => e.stopPropagation()}>
        <div className="hist-modal-topo">
          <div>
            <p className="hist-modal-data">{f.data_referencia || f.data_fechamento}</p>
            {f.criador_nome && <p className="hist-modal-autor">por {f.criador_nome}</p>}
          </div>
          <span className={`hist-total ${positivo ? 'hist-total--ok' : 'hist-total--alerta'}`}>
            R$ {fmt(f.total_geral)}
          </span>
        </div>

        <div className="hist-modal-grid">
          <div className="hist-secao">
            <p className="hist-secao-titulo">🏠 Salão</p>
            <div className="hist-linha"><span>Esperado</span><span>R$ {fmt(f.venda_sist)}</span></div>
            <div className="hist-linha"><span>Realizado</span><span>R$ {fmt(f.real_salao)}</span></div>
            <div className="hist-linha sub"><span>Excedente</span><span>R$ {fmt(f.excedente)}</span></div>
            <div className="hist-divider" />
            <div className="hist-linha destaque"><span>Diferença</span><span>R$ {fmt(f.dif_salao)}</span></div>
          </div>

          <div className="hist-secao">
            <p className="hist-secao-titulo">🛵 Delivery</p>
            <div className="hist-linha"><span>Esperado</span><span>R$ {fmt(f.venda_web + (f.venda_app || 0))}</span></div>
            <div className="hist-linha"><span>Realizado</span><span>R$ {fmt(f.real_deliv_liq)}</span></div>
            <div className="hist-linha sub"><span>Gasolina</span><span>R$ {fmt(f.total_gas)}</span></div>
            <div className="hist-divider" />
            <div className="hist-linha destaque"><span>Diferença</span><span>R$ {fmt(f.dif_deliv)}</span></div>
          </div>
        </div>

        {Array.isArray(f.motoboys) && f.motoboys.length > 0 && (
          <div className="hist-motoboys">
            <p className="hist-secao-titulo">Motoboys</p>
            {f.motoboys.map((m, i) => (
              <div key={i} className="hist-motoboy-linha">
                <div className="hist-avatar">{m.nome?.charAt(0).toUpperCase()}</div>
                <span className="hist-moto-nome">{m.nome}</span>
                <span className="hist-moto-qtd">{m.qtd} entregas</span>
                <span className="hist-moto-total">R$ {fmt((m.maq || 0) + (m.din || 0) + (m.gas || 0))}</span>
              </div>
            ))}
          </div>
        )}

        <button className="hist-fechar" onClick={onFechar}>Fechar</button>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function Historico() {
  const { isAdmin } = useAuth();
  const [fechamentos, setFechamentos] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [erro,        setErro]        = useState('');
  const [pagina,      setPagina]      = useState(0);
  const [temMais,     setTemMais]     = useState(false);
  const [selecionado, setSelecionado] = useState(null);
  const LIMITE = 20;

  async function carregar(pag = 0) {
    setLoading(true); setErro('');
    try {
      const { fechamentos: dados } = await listarFechamentos({ pagina: pag, limite: LIMITE });
      if (pag === 0) setFechamentos(dados);
      else setFechamentos(prev => [...prev, ...dados]);
      setTemMais(dados.length === LIMITE);
      setPagina(pag);
    } catch {
      setErro('Erro ao carregar fechamentos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(0); }, []);

  return (
    <div className="hist-root">
      <div className="hist-cabecalho">
        <h1>Histórico de fechamentos</h1>
        {isAdmin && <span className="hist-badge-admin">Visualização: todos</span>}
      </div>

      {erro && <div className="hist-erro">{erro}</div>}

      {/* Skeleton no loading inicial */}
      {loading && fechamentos.length === 0 && <SkeletonLista />}

      {!loading && fechamentos.length === 0 && !erro && (
        <div className="hist-vazio">
          <p>Nenhum fechamento encontrado.</p>
          <p className="hist-vazio-sub">Os fechamentos registrados aparecerão aqui.</p>
        </div>
      )}

      {fechamentos.length > 0 && (
        <div className="hist-lista">
          {fechamentos.map((f, idx) => {
            const positivo = Math.abs(f.total_geral) < 1;
            return (
              <button
                key={f.id}
                className="hist-item"
                onClick={() => setSelecionado(f)}
                style={{ animationDelay: `${Math.min(idx, 8) * 0.04}s` }}
              >
                <div className={`hist-indicador ${positivo ? 'hist-indicador--ok' : 'hist-indicador--alerta'}`} />
                <div className="hist-item-info">
                  <span className="hist-item-data">{f.data_referencia || f.data_fechamento}</span>
                  {isAdmin && f.criador_nome && (
                    <span className="hist-item-autor">{f.criador_nome}</span>
                  )}
                </div>
                <div className="hist-item-valores">
                  <span className="hist-item-salao">Salão R$ {fmt(f.dif_salao)}</span>
                  <span className="hist-item-deliv">Delivery R$ {fmt(f.dif_deliv)}</span>
                </div>
                <span className={`hist-item-total ${positivo ? 'hist-item-total--ok' : 'hist-item-total--alerta'}`}>
                  R$ {fmt(f.total_geral)}
                </span>
                <span className="hist-item-seta">›</span>
              </button>
            );
          })}
        </div>
      )}

      {temMais && (
        <button className="hist-mais" onClick={() => carregar(pagina + 1)} disabled={loading}>
          {loading ? 'Carregando...' : 'Carregar mais'}
        </button>
      )}

      {selecionado && (
        <ModalDetalhe f={selecionado} onFechar={() => setSelecionado(null)} />
      )}
    </div>
  );
}
