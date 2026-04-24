// src/pages/Historico/Historico.jsx
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { listarFechamentos, deletarFechamento } from '../../lib/api';
import { fmt } from '../../lib/format';
import { useAuth } from '../../contexts/AuthContext';
import { ToastContext } from '../../App';
import './Historico.css';

const C = {
  ok:      '#34d399',
  alerta:  '#f87171',
  azul:    '#60a5fa',
  laranja: '#fb923c',
  grade:   'rgba(255,255,255,0.06)',
  texto:   '#94a3b8',
};

const n = v => Number(v) || 0;

function labelData(data_referencia, data_fechamento) {
  const raw = data_referencia || data_fechamento || '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw.slice(0, 5);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [, m, d] = raw.split('-');
    return `${d}/${m}`;
  }
  return raw.slice(0, 5);
}

function SkeletonLista() {
  return (
    <div className="hist-lista">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="sk-card" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}

function TooltipCustom({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: R$ {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

function CardMetrica({ titulo, valor, sub, cor, icone }) {
  return (
    <div className="hist-metrica-card">
      <div className="hist-metrica-icone">{icone}</div>
      <div>
        <p className="hist-metrica-titulo">{titulo}</p>
        <p className="hist-metrica-valor" style={{ color: cor }}>{valor}</p>
        {sub && <p className="hist-metrica-sub">{sub}</p>}
      </div>
    </div>
  );
}

function ModalDetalhe({ f, onFechar, podeDeletar, onDeletar, deletando }) {
  const positivo = Math.abs(n(f.total_geral)) < 1;
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
            <div className="hist-linha"><span>Esperado</span><span>R$ {fmt(n(f.venda_web) + n(f.venda_app))}</span></div>
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
                <span className="hist-moto-total">R$ {fmt(n(m.maq) + n(m.din) + n(m.gas))}</span>
              </div>
            ))}
          </div>
        )}
        <div className="hist-modal-acoes">
          {podeDeletar && (
            <button className="hist-btn-deletar" onClick={() => onDeletar(f.id)} disabled={deletando}>
              {deletando ? 'Removendo…' : '🗑 Remover fechamento'}
            </button>
          )}
          <button className="hist-fechar" onClick={onFechar}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

export default function Historico() {
  const { user, isAdmin, isGerente, isFuncionario } = useAuth();
  const addToast = useContext(ToastContext);

  const [fechamentos, setFechamentos] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [erro,        setErro]        = useState('');
  const [pagina,      setPagina]      = useState(0);
  const [temMais,     setTemMais]     = useState(false);
  const [selecionado, setSelecionado] = useState(null);
  const [deletando,   setDeletando]   = useState(false);
  const [aba,         setAba]         = useState('lista');
  const [filtro,      setFiltro]      = useState('30d');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const LIMITE = 100;

  const hoje = new Date().toISOString().split('T')[0];
  const isAdminOuGerente = isAdmin || isGerente;

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

  function podeDeletar(f) {
    if (isAdmin || isGerente) return true;
    if (isFuncionario && f.criado_por === user?.id && f.data_fechamento === hoje) return true;
    return false;
  }

  async function handleDeletar(id) {
    setDeletando(true);
    try {
      await deletarFechamento(id);
      addToast('Fechamento removido.', 'ok');
      setSelecionado(null);
      carregar(0);
    } catch (err) {
      addToast(err.message || 'Erro ao remover fechamento.', 'erro');
    } finally {
      setDeletando(false);
    }
  }

  const fechamentosFiltrados = useMemo(() => {
    let dados = [...fechamentos];
    if (filtro !== 'todos') {
      const dias = filtro === '7d' ? 7 : filtro === '30d' ? 30 : 90;
      const corte = new Date();
      corte.setDate(corte.getDate() - dias);
      dados = dados.filter(f => {
        const raw = f.data_fechamento || f.data_referencia;
        if (!raw) return true;
        let d;
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) d = new Date(raw);
        else if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
          const [dd, mm, aaaa] = raw.split('/');
          d = new Date(`${aaaa}-${mm}-${dd}`);
        } else return true;
        return d >= corte;
      });
    }
    if (filtroStatus === 'ok')     dados = dados.filter(f => Math.abs(n(f.total_geral)) < 1);
    if (filtroStatus === 'alerta') dados = dados.filter(f => Math.abs(n(f.total_geral)) >= 1);
    return dados;
  }, [fechamentos, filtro, filtroStatus]);

  const dadosLinha = useMemo(() =>
    [...fechamentosFiltrados].reverse().map(f => {
      // Total recebido = real_salao (maq + din - inicial + excedente + maqRetirada)
      //                + real_deliv_liq (maq + din + gas de cada motoboy)
      // Pix automático já está embutido no real_salao via maq_retirada
      const recebidoSalao = n(f.real_salao);
      const recebidoDeliv = n(f.real_deliv_liq);
      return {
        data:    labelData(f.data_referencia, f.data_fechamento),
        'Total Recebido': recebidoSalao + recebidoDeliv,
        'Salão':          recebidoSalao,
        'Delivery':       recebidoDeliv,
      };
    }),
  [fechamentosFiltrados]);

  const dadosBarras = useMemo(() =>
    [...fechamentosFiltrados].reverse().map(f => ({
      data:      labelData(f.data_referencia, f.data_fechamento),
      'Salão':   n(f.real_salao),
      'Delivery': n(f.real_deliv_liq),
    })),
  [fechamentosFiltrados]);

  const dadosPizza = useMemo(() => {
    const totalSalao = fechamentosFiltrados.reduce((s, f) => s + n(f.real_salao),    0);
    const totalDeliv = fechamentosFiltrados.reduce((s, f) => s + n(f.real_deliv_liq), 0);
    return [
      { name: '🏠 Salão',    value: totalSalao },
      { name: '🛵 Delivery', value: totalDeliv },
    ];
  }, [fechamentosFiltrados]);

  const metricas = useMemo(() => {
    if (!fechamentosFiltrados.length) return null;
    const totais    = fechamentosFiltrados.map(f => n(f.total_geral));
    const recebidos = fechamentosFiltrados.map(f => n(f.real_salao) + n(f.real_deliv_liq));
    const media     = totais.reduce((a, b) => a + b, 0) / totais.length;
    const melhor    = Math.max(...recebidos);
    const pior      = Math.min(...recebidos);
    const qtdOk     = fechamentosFiltrados.filter(f => Math.abs(n(f.total_geral)) < 1).length;
    const pctOk     = Math.round((qtdOk / fechamentosFiltrados.length) * 100);
    const meio      = Math.floor(totais.length / 2);
    const mIni      = totais.slice(0, meio).reduce((a, b) => a + b, 0) / (meio || 1);
    const mFim      = totais.slice(meio).reduce((a, b) => a + b, 0) / ((totais.length - meio) || 1);
    const tendencia = mFim > mIni ? '↑ Melhorando' : mFim < mIni ? '↓ Piorando' : '→ Estável';
    return { media, melhor, pior, pctOk, qtdOk, tendencia, total: fechamentosFiltrados.length };
  }, [fechamentosFiltrados]);

  const rankingMotoboys = useMemo(() => {
    const mapa = {};
    fechamentosFiltrados.forEach(f => {
      if (!Array.isArray(f.motoboys)) return;
      f.motoboys.forEach(m => {
        if (!m.nome) return;
        if (!mapa[m.nome]) mapa[m.nome] = { nome: m.nome, qtd: 0, total: 0, dias: 0 };
        mapa[m.nome].qtd   += n(m.qtd);
        mapa[m.nome].total += n(m.maq) + n(m.din) + n(m.gas);
        mapa[m.nome].dias  += 1;
      });
    });
    return Object.values(mapa).sort((a, b) => b.total - a.total);
  }, [fechamentosFiltrados]);

  const maxTotal = rankingMotoboys.length ? rankingMotoboys[0].total : 1;

  return (
    <div className="hist-root">
      <div className="hist-cabecalho">
        <h1>Histórico de fechamentos</h1>
        {isAdminOuGerente && <span className="hist-badge-admin">Todos os fechamentos</span>}
      </div>

      {erro && <div className="hist-erro">{erro}</div>}

      <div className="hist-abas">
        {[
          { id: 'lista',    label: '📋 Lista' },
          { id: 'graficos', label: '📊 Gráficos' },
          { id: 'motoboys', label: '🏍️ Motoboys' },
        ].map(a => (
          <button
            key={a.id}
            className={`hist-aba ${aba === a.id ? 'hist-aba--ativa' : ''}`}
            onClick={() => setAba(a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="hist-filtros">
        <div className="hist-filtro-grupo">
          {[
            { id: '7d',    label: '7 dias' },
            { id: '30d',   label: '30 dias' },
            { id: '90d',   label: '90 dias' },
            { id: 'todos', label: 'Todos' },
          ].map(f => (
            <button
              key={f.id}
              className={`hist-filtro-btn ${filtro === f.id ? 'hist-filtro-btn--ativo' : ''}`}
              onClick={() => setFiltro(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="hist-filtro-grupo">
          {[
            { id: 'todos',  label: 'Todos' },
            { id: 'ok',     label: '✓ Ok' },
            { id: 'alerta', label: '⚠ Alerta' },
          ].map(f => (
            <button
              key={f.id}
              className={`hist-filtro-btn ${filtroStatus === f.id ? 'hist-filtro-btn--ativo' : ''}`}
              onClick={() => setFiltroStatus(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {metricas && (
        <div className="hist-metricas">
          <CardMetrica icone="📅" titulo="Fechamentos" valor={metricas.total}
            sub={`${metricas.pctOk}% sem diferença`} cor={C.azul} />
          <CardMetrica icone="📉" titulo="Média geral" valor={`R$ ${fmt(metricas.media)}`}
            sub={metricas.tendencia} cor={Math.abs(metricas.media) < 1 ? C.ok : C.alerta} />
          <CardMetrica icone="✅" titulo="Melhor dia (receita)" valor={`R$ ${fmt(metricas.melhor)}`} cor={C.ok} />
          <CardMetrica icone="⚠️" titulo="Pior dia (receita)"   valor={`R$ ${fmt(metricas.pior)}`}  cor={C.alerta} />
        </div>
      )}

      {/* ── ABA LISTA ── */}
      {aba === 'lista' && (
        <>
          {loading && fechamentos.length === 0 && <SkeletonLista />}
          {!loading && fechamentosFiltrados.length === 0 && !erro && (
            <div className="hist-vazio">
              <p>Nenhum fechamento encontrado.</p>
              <p className="hist-vazio-sub">Tente ajustar os filtros.</p>
            </div>
          )}
          {fechamentosFiltrados.length > 0 && (
            <div className="hist-lista">
              {fechamentosFiltrados.map((f, idx) => {
                const positivo = Math.abs(n(f.total_geral)) < 1;
                return (
                  <button key={f.id} className="hist-item" onClick={() => setSelecionado(f)}
                    style={{ animationDelay: `${Math.min(idx, 8) * 0.04}s` }}>
                    <div className={`hist-indicador ${positivo ? 'hist-indicador--ok' : 'hist-indicador--alerta'}`} />
                    <div className="hist-item-info">
                      <span className="hist-item-data">{f.data_referencia || f.data_fechamento}</span>
                      {isAdminOuGerente && f.criador_nome && (
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
        </>
      )}

      {/* ── ABA GRÁFICOS ── */}
      {aba === 'graficos' && (
        <div className="hist-graficos">
          <div className="hist-grafico-card">
            <p className="hist-grafico-titulo">📈 Total Recebido por Dia</p>
            <p className="hist-grafico-sub">Soma do que entrou no caixa (maquininhas + dinheiro + pix automático)</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dadosLinha} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grade} />
                <XAxis dataKey="data" tick={{ fill: C.texto, fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: C.texto, fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<TooltipCustom />} />
                <Legend wrapperStyle={{ fontSize: 12, color: C.texto }} />
                <Line type="monotone" dataKey="Total Recebido"    stroke={C.azul}    strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Salão"    stroke={C.ok}      strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="Delivery" stroke={C.laranja} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="hist-grafico-card">
            <p className="hist-grafico-titulo">📊 Salão vs Delivery — Realizado</p>
            <p className="hist-grafico-sub">Valor realizado por canal a cada dia</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosBarras} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grade} />
                <XAxis dataKey="data" tick={{ fill: C.texto, fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: C.texto, fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<TooltipCustom />} />
                <Legend wrapperStyle={{ fontSize: 12, color: C.texto }} />
                <Bar dataKey="Salão"    fill={C.azul}    radius={[4, 4, 0, 0]} />
                <Bar dataKey="Delivery" fill={C.laranja} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="hist-grafico-card hist-grafico-card--pizza">
            <p className="hist-grafico-titulo">🍕 Divisão de Receita</p>
            <p className="hist-grafico-sub">Proporção total do período selecionado</p>
            <div className="hist-pizza-wrap">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={dadosPizza} cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    <Cell fill={C.azul} />
                    <Cell fill={C.laranja} />
                  </Pie>
                  <Tooltip
                    formatter={v => [`R$ ${fmt(v)}`, '']}
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    labelStyle={{ color: '#f1f5f9' }}
                    itemStyle={{ color: '#94a3b8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="hist-pizza-legenda">
                {dadosPizza.map((d, i) => {
                  const total = dadosPizza.reduce((s, x) => s + x.value, 0);
                  const pct   = total > 0 ? Math.round((d.value / total) * 100) : 0;
                  return (
                    <div key={i} className="hist-pizza-item">
                      <span className="hist-pizza-cor" style={{ background: i === 0 ? C.azul : C.laranja }} />
                      <div>
                        <p className="hist-pizza-nome">{d.name}</p>
                        <p className="hist-pizza-val">R$ {fmt(d.value)}</p>
                        <p className="hist-pizza-pct">{pct}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ABA MOTOBOYS ── */}
      {aba === 'motoboys' && (
        <div className="hist-ranking">
          {rankingMotoboys.length === 0 ? (
            <div className="hist-vazio">
              <p>Nenhum motoboy encontrado no período.</p>
              <p className="hist-vazio-sub">Ajuste os filtros para ver dados.</p>
            </div>
          ) : (
            <>
              <p className="hist-ranking-titulo">🏆 Ranking do período</p>
              {rankingMotoboys.map((m, i) => (
                <div key={m.nome} className="hist-ranking-item">
                  <div className="hist-ranking-pos">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}
                  </div>
                  <div className="hist-avatar hist-avatar--lg">{m.nome.charAt(0).toUpperCase()}</div>
                  <div className="hist-ranking-info">
                    <p className="hist-ranking-nome">{m.nome}</p>
                    <p className="hist-ranking-detalhe">{m.qtd} entregas · {m.dias} dia{m.dias !== 1 ? 's' : ''}</p>
                    <div className="hist-barra-bg">
                      <div className="hist-barra-fill" style={{ width: `${(m.total / maxTotal) * 100}%` }} />
                    </div>
                  </div>
                  <p className="hist-ranking-total">R$ {fmt(m.total)}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {selecionado && createPortal(
        <ModalDetalhe
          f={selecionado}
          onFechar={() => setSelecionado(null)}
          podeDeletar={podeDeletar(selecionado)}
          onDeletar={handleDeletar}
          deletando={deletando}
        />,
        document.body
      )}
    </div>
  );
}
