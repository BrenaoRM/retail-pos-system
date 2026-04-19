import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import "./fechamento.css";
import logo from '/img/logo.png';
import html2canvas from 'html2canvas';
import { salvarFechamento } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

/* =====================================================================
   ÍCONES
===================================================================== */
const IconStore = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconBike = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/>
    <path d="M15 6a1 1 0 0 0-1 1v5.5l-5-3.5"/><path d="M9 6h5l3 5.5"/>
  </svg>
);
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-3.65"/>
  </svg>
);
const IconCamera = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);
const IconHistory = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconWarning = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

/* =====================================================================
   HELPERS — MOEDA
===================================================================== */
// Formata número para exibição: 1500.5 → "1.500,50"
const formatBRL = (val) => {
  const n = Number(val) || 0;
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Converte string formatada de volta para número: "1.500,50" → 1500.5
const parseBRL = (str) => {
  if (str === '' || str === null || str === undefined) return 0;
  // Remove pontos de milhar e troca vírgula por ponto
  const clean = String(str).replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
};

// Estado inicial padrão
const SALAO_INICIAL    = { vendaSist: 0, inicial: 0, maq: 0, din: 0, excedente: 0 };
const DELIVERY_INICIAL = { vendaWeb: 0, vendaBundi: 0, maqRetirada: 0 };
const MOTOBOYS_INICIAL = [{ nome: 'Entregador 1', qtd: 0, maq: 0, din: 0, gas: 0 }];
const MAX_HISTORICO    = 10;
const STORAGE_KEY      = 'fc_rascunho';
const HISTORICO_KEY    = 'fc_historico';

/* =====================================================================
   STEPPER
===================================================================== */
const STEPS    = ['Caixa', 'Resultado'];
const STEP_MAP = { formulario: 0, resultado: 1 };

const Stepper = ({ etapa }) => {
  const current = STEP_MAP[etapa] ?? 0;
  return (
    <div className="stepper">
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <div className={`step ${i < current ? 'done' : ''} ${i === current ? 'active' : ''}`}>
            <div className="step-dot">
              {i < current ? <IconCheck /> : <span>{i + 1}</span>}
            </div>
            <span className="step-label">{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`step-line ${i < current ? 'done' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/* =====================================================================
   FIELD COM FORMATAÇÃO DE MOEDA
   - Exibe valor formatado (R$ 1.500,00) quando fora do foco
   - Permite digitar número limpo quando dentro do foco
===================================================================== */
const Field = ({ label, hint, value, onChange, prefix = 'R$', error }) => {
  const [focused,      setFocused]      = useState(false);
  const [inputDisplay, setInputDisplay] = useState('');

  // Atualiza o display quando o valor externo muda e o campo não está focado
  useEffect(() => {
    if (!focused) {
      setInputDisplay(value ? formatBRL(value) : '');
    }
  }, [value, focused]);

  const handleFocus = () => {
    setFocused(true);
    // Ao focar, mostra o número cru para facilitar edição
    setInputDisplay(value ? String(value).replace('.', ',') : '');
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    setInputDisplay(raw);
    // Converte para número e repassa ao pai
    const num = parseBRL(raw);
    onChange(num);
  };

  const handleBlur = () => {
    setFocused(false);
    // Formata ao sair do campo
    setInputDisplay(value ? formatBRL(value) : '');
  };

  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {hint && <span className="field-hint">{hint}</span>}
      <div className={`field-input-wrap ${error ? 'field-error' : ''}`}>
        {prefix && <span className="field-prefix">{prefix}</span>}
        <input
          type="text"
          inputMode="decimal"
          value={inputDisplay}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="0,00"
        />
      </div>
      {error && <span className="field-error-msg">{error}</span>}
    </div>
  );
};

/* =====================================================================
   RESUMO ROW
===================================================================== */
const ResumoRow = ({ label, value, accent, sub }) => (
  <div className={`resumo-row ${sub ? 'sub' : ''} ${accent ? 'accent' : ''}`}>
    <span className="resumo-label">{label}</span>
    <span className="resumo-val">R$ {formatBRL(value)}</span>
  </div>
);

/* =====================================================================
   TOGGLE PILL
===================================================================== */
const SetorToggle = ({ aba, onChange, setores, totais }) => {
  const btnRefs = useRef([]);
  const pillRef = useRef(null);

  useLayoutEffect(() => {
    const idx  = setores.findIndex(s => s.id === aba);
    const btn  = btnRefs.current[idx];
    const pill = pillRef.current;
    if (!btn || !pill) return;
    pill.style.left  = `${btn.offsetLeft}px`;
    pill.style.width = `${btn.offsetWidth}px`;
  }, [aba, setores]);

  return (
    <div className="setor-toggle-wrap">
      <div className="setor-toggle">
        <div ref={pillRef} className={`toggle-pill toggle-pill--${aba}`} />
        {setores.map((s, i) => (
          <button
            key={s.id}
            ref={el => (btnRefs.current[i] = el)}
            className={`toggle-btn toggle-btn--${s.id} ${aba === s.id ? 'ativo' : ''}`}
            onClick={() => onChange(s.id)}
          >
            <span className="toggle-btn-main">{s.icone}{s.label}</span>
            {/* Subtotal parcial por setor */}
            {totais[s.id] > 0 && (
              <span className="toggle-sub">R$ {formatBRL(totais[s.id])}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

/* =====================================================================
   MODAL DE CONFIRMAÇÃO
===================================================================== */
const Modal = ({ titulo, mensagem, onConfirmar, onCancelar }) => (
  <div className="modal-overlay" onClick={onCancelar}>
    <div className="modal-card" onClick={e => e.stopPropagation()}>
      <p className="modal-titulo">{titulo}</p>
      <p className="modal-sub">{mensagem}</p>
      <div className="modal-btns">
        <button className="btn btn-ghost" onClick={onCancelar}>Cancelar</button>
        <button className="btn btn-confirmar" onClick={onConfirmar}>Confirmar</button>
      </div>
    </div>
  </div>
);

/* =====================================================================
   HISTÓRICO
===================================================================== */
const Historico = ({ historico, onSelecionar, onLimpar }) => {
  if (historico.length === 0) return null;

  return (
    <div className="historico-wrap">
      <p className="historico-titulo">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconHistory /> Últimos fechamentos
        </span>
        <button className="btn-limpar-historico" onClick={onLimpar}>Limpar</button>
      </p>
      <div className="historico-lista">
        {historico.map((item, i) => {
          const ok = Math.abs(item.totalGeral) < 1;
          return (
            <button key={i} className="historico-item" onClick={() => onSelecionar(item)}>
              <span className={`historico-dot ${ok ? 'historico-dot--ok' : 'historico-dot--alerta'}`} />
              <span className="historico-data">{item.dataFechamento}</span>
              <span className={`historico-total ${ok ? 'historico-total--ok' : 'historico-total--alerta'}`}>
                R$ {formatBRL(item.totalGeral)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* =====================================================================
   HELPERS — DATA
===================================================================== */
const obterDataFechamento = () => {
  const agora = new Date();
  const hora  = agora.getHours();
  const data  = hora < 17 ? new Date(agora.setDate(agora.getDate() - 1)) : agora;
  return data.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

/* =====================================================================
   COMPONENTE PRINCIPAL
===================================================================== */
const Fechamento = () => {
  const [etapa,    setEtapa]    = useState('formulario');
  const [aba,      setAba]      = useState('salao');
  const [salao,    setSalao]    = useState(SALAO_INICIAL);
  const [delivery, setDelivery] = useState(DELIVERY_INICIAL);
  const [dadosMotoboys, setDadosMotoboys] = useState(MOTOBOYS_INICIAL);
  const [relatorio, setRelatorio] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [erros,     setErros]     = useState({});
  const [copiando,  setCopiando]  = useState(false);
  const [copiado,   setCopiado]   = useState(false);
  const [modalNovoFechamento, setModalNovoFechamento] = useState(false);
  const [modalLimparHistorico, setModalLimparHistorico] = useState(false);
  const { user } = useAuth();

  // Touch / swipe
  const touchStartX = useRef(null);
  const resultadoRef = useRef(null);
  const conteudoRef  = useRef(null);

  const SETORES = [
    { id: 'salao',    label: 'Salão',    icone: <IconStore /> },
    { id: 'delivery', label: 'Delivery', icone: <IconBike />  },
  ];

  /* ------------------------------------------------------------------
     PERSISTÊNCIA — carrega rascunho e histórico ao montar
  ------------------------------------------------------------------ */
  useEffect(() => {
    try {
      const rascunho = localStorage.getItem(STORAGE_KEY);
      if (rascunho) {
        const d = JSON.parse(rascunho);
        if (d.salao)         setSalao(d.salao);
        if (d.delivery)      setDelivery(d.delivery);
        if (d.dadosMotoboys) setDadosMotoboys(d.dadosMotoboys);
      }
    } catch { /* ignora erros de parse */ }

    try {
      const hist = localStorage.getItem(HISTORICO_KEY);
      if (hist) setHistorico(JSON.parse(hist));
    } catch { /* ignora */ }
  }, []);

  /* ------------------------------------------------------------------
     PERSISTÊNCIA — salva rascunho sempre que os dados mudam
  ------------------------------------------------------------------ */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ salao, delivery, dadosMotoboys }));
    } catch { /* storage cheio */ }
  }, [salao, delivery, dadosMotoboys]);

  /* ------------------------------------------------------------------
     SUBTOTAIS PARA O TOGGLE
  ------------------------------------------------------------------ */
  const totaisToggle = {
    salao: salao.maq + Math.max(0, salao.din - salao.inicial),
    delivery: delivery.vendaWeb + delivery.vendaBundi + delivery.maqRetirada +
              dadosMotoboys.reduce((a, m) => a + m.maq + m.din, 0),
  };

  /* ------------------------------------------------------------------
     SWIPE (mobile) — troca aba arrastando
  ------------------------------------------------------------------ */
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 50) return; // limiar mínimo
    const idx    = SETORES.findIndex(s => s.id === aba);
    if (diff > 0 && idx < SETORES.length - 1) setAba(SETORES[idx + 1].id);
    if (diff < 0 && idx > 0)                  setAba(SETORES[idx - 1].id);
    touchStartX.current = null;
  };

  /* ------------------------------------------------------------------
     MOTOBOY HANDLERS
  ------------------------------------------------------------------ */
  const handleMotoboyChange = (index, campo, valor) => {
    setDadosMotoboys(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [campo]: Number(valor) || 0 };
      return next;
    });
  };

  /* ------------------------------------------------------------------
     VALIDAÇÃO
  ------------------------------------------------------------------ */
  const validar = () => {
    const novosErros = {};

    if (!salao.vendaSist || salao.vendaSist <= 0)
      novosErros.vendaSist = 'Informe as vendas do salão';

    const totalDelivery = delivery.vendaWeb + delivery.vendaBundi;
    if (totalDelivery <= 0)
      novosErros.vendaDelivery = 'Informe ao menos uma venda de delivery';

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  /* ------------------------------------------------------------------
     CÁLCULO
  ------------------------------------------------------------------ */
  const calcularTudo = async () => {
    if (!validar()) return;

    const realSalao    = (salao.din - salao.inicial) + salao.maq;
    const difSalao     = (realSalao - salao.excedente) - salao.vendaSist;
    const sistDeliv    = delivery.vendaWeb + delivery.vendaBundi;
    const totalMaqEnt  = dadosMotoboys.reduce((a, m) => a + m.maq, 0);
    const totalDinEnt  = dadosMotoboys.reduce((a, m) => a + m.din, 0);
    const totalGasEnt  = dadosMotoboys.reduce((a, m) => a + m.gas, 0);
    const realDelivLiq = delivery.maqRetirada + totalMaqEnt + totalDinEnt;
    const realDeliv    = realDelivLiq + totalGasEnt;
    const difDeliv     = realDeliv - sistDeliv;

    const novoRelatorio = {
      sistSalao: salao.vendaSist,
      realSalao, excedente: salao.excedente, difSalao,
      sistDeliv, realDelivLiq, totalGasEnt, difDeliv,
      totalGeral: difSalao + difDeliv,
      motoboys: dadosMotoboys,
      dataFechamento: obterDataFechamento(),
      timestamp: Date.now(),
    };

    setRelatorio(novoRelatorio);
    setEtapa('resultado');
    try {
      await salvarFechamento(novoRelatorio, user.id);
    } catch (e) {
      console.error('Erro ao salvar fechamento:', e);
    }
  };

  /* ------------------------------------------------------------------
     COPIAR COMO IMAGEM
  ------------------------------------------------------------------ */
  const copiarComoImagem = async () => {
    const elemento = conteudoRef.current;
    if (!elemento) return;
    setCopiando(true);
    try {
      const canvas = await html2canvas(elemento, {
        backgroundColor: '#0f172a', scale: 2, useCORS: true, logging: false,
      });
      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 3000);
        } catch {
          const url = URL.createObjectURL(blob);
          const a   = document.createElement('a');
          a.href = url; a.download = 'fechamento.png'; a.click();
          URL.revokeObjectURL(url);
        } finally { setCopiando(false); }
      });
    } catch { setCopiando(false); }
  };

  /* ------------------------------------------------------------------
     NOVO FECHAMENTO (com confirmação)
  ------------------------------------------------------------------ */
  const confirmarNovoFechamento = () => {
    setSalao(SALAO_INICIAL);
    setDelivery(DELIVERY_INICIAL);
    setDadosMotoboys(MOTOBOYS_INICIAL);
    setRelatorio(null);
    setErros({});
    setEtapa('formulario');
    setAba('salao');
    setModalNovoFechamento(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  /* ------------------------------------------------------------------
     SCROLL PARA RESULTADO
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (etapa === 'resultado' && resultadoRef.current) {
      setTimeout(() => resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [etapa]);

  const positivo  = relatorio && Math.abs(relatorio.totalGeral) < 1;
  const abaIndex  = SETORES.findIndex(s => s.id === aba);
  const temErros  = Object.keys(erros).length > 0;

  /* ==================================================================
     RENDER
  ================================================================== */
  return (
    <div className="fc-root">
      <header className="fc-header">
        <img src={logo} alt="Logo" className="fc-logo" />
        <Stepper etapa={etapa} />
      </header>

      <main className="fc-main">

        {/* ============================================================
            FORMULÁRIO
        ============================================================ */}
        {etapa === 'formulario' && (
          <div className="anima-fade" style={{ width: '100%' }}>

            {/* Toggle pill */}
            <SetorToggle
              aba={aba}
              onChange={setAba}
              setores={SETORES}
              totais={totaisToggle}
            />

            {/* Viewport com suporte a swipe */}
            <div
              className="setor-viewport"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="setor-track"
                style={{
                  width: `${SETORES.length * 100}%`,
                  transform: `translateX(-${(abaIndex * 100) / SETORES.length}%)`,
                }}
              >

                {/* ---- SLIDE SALÃO ---- */}
                <div className="setor-slide" style={{ width: `${100 / SETORES.length}%` }}>
                  <div className="fc-card fc-card--salao">
                    <div className="setor-header setor-header--salao">
                      <span className="setor-icon"><IconStore /></span>
                      <span className="setor-title">Salão</span>
                    </div>
                    <div className="section-block">
                      <p className="section-label">Sistema</p>
                      <Field
                        label="Vendas totais (mesas)"
                        value={salao.vendaSist}
                        error={erros.vendaSist}
                        onChange={v => { setSalao(s => ({ ...s, vendaSist: v })); setErros(e => ({ ...e, vendaSist: null })); }}
                      />
                    </div>
                    <div className="section-divider" />
                    <div className="section-block">
                      <p className="section-label">Caixa físico</p>
                      <Field label="Troco inicial" hint="valor que estava na gaveta ao abrir"
                        value={salao.inicial}
                        onChange={v => setSalao(s => ({ ...s, inicial: v }))} />
                      <Field label="Maquininha"
                        value={salao.maq}
                        onChange={v => setSalao(s => ({ ...s, maq: v }))} />
                      <Field label="Dinheiro na gaveta"
                        value={salao.din}
                        onChange={v => setSalao(s => ({ ...s, din: v }))} />
                    </div>
                    <div className="section-divider" />
                    <div className="section-block">
                      <p className="section-label">Deduções</p>
                      <Field label="Excedente funcionários"
                        value={salao.excedente}
                        onChange={v => setSalao(s => ({ ...s, excedente: v }))} />
                    </div>
                  </div>
                </div>

                {/* ---- SLIDE DELIVERY ---- */}
                <div className="setor-slide" style={{ width: `${100 / SETORES.length}%` }}>
                  <div className="fc-card fc-card--delivery">
                    <div className="setor-header setor-header--delivery">
                      <span className="setor-icon"><IconBike /></span>
                      <span className="setor-title">Delivery / Retirada</span>
                    </div>
                    <div className="section-block">
                      <p className="section-label">Vendas online</p>
                      <Field
                        label="Web Cardápio"
                        value={delivery.vendaWeb}
                        error={erros.vendaDelivery}
                        onChange={v => { setDelivery(d => ({ ...d, vendaWeb: v })); setErros(e => ({ ...e, vendaDelivery: null })); }}
                      />
                      <Field label="App Brendi"
                        value={delivery.vendaBundi}
                        onChange={v => setDelivery(d => ({ ...d, vendaBundi: v }))} />
                    </div>
                    <div className="section-divider" />
                    <div className="section-block">
                      <p className="section-label">Retirada no balcão</p>
                      <Field label="Maquininha balcão"
                        value={delivery.maqRetirada}
                        onChange={v => setDelivery(d => ({ ...d, maqRetirada: v }))} />
                    </div>
                    <div className="section-divider" />
                    <div className="section-block">
                      <div className="motoboy-section-header">
                        <p className="section-label" style={{ margin: 0 }}>Acerto dos motoboys</p>
                        <div className="motoboy-counter">
                          <button className="counter-btn"
                            onClick={() => { if (dadosMotoboys.length <= 1) return; setDadosMotoboys(p => p.slice(0, -1)); }}
                            disabled={dadosMotoboys.length <= 1}>−</button>
                          <span className="counter-val">{dadosMotoboys.length}</span>
                          <button className="counter-btn"
                            onClick={() => setDadosMotoboys(p => [
                              ...p, { nome: `Entregador ${p.length + 1}`, qtd: 0, maq: 0, din: 0, gas: 0 }
                            ])}>+</button>
                        </div>
                      </div>
                      {dadosMotoboys.map((m, i) => (
                        <div key={i} className="motoboy-card">
                          <div className="motoboy-header">
                            <div className="motoboy-avatar">{m.nome.charAt(0).toUpperCase()}</div>
                            <input
                              type="text"
                              className="motoboy-nome-input"
                              value={m.nome}
                              placeholder={`Entregador ${i + 1}`}
                              onChange={e => {
                                setDadosMotoboys(prev => {
                                  const next = [...prev];
                                  next[i] = { ...next[i], nome: e.target.value };
                                  return next;
                                });
                              }}
                            />
                          </div>
                          <div className="motoboy-fields">
                            {[['qtd','Entregas'],['maq','Maquininha'],['din','Dinheiro'],['gas','Gasolina']].map(([campo, lbl]) => (
                              <div key={campo} className="moto-field">
                                <span className="moto-lbl">{lbl}</span>
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={m[campo] || ''}
                                  onChange={e => handleMotoboyChange(i, campo, e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Toast de validação */}
            {temErros && (
              <div className="validacao-toast">
                <IconWarning />
                {erros.vendaSist || erros.vendaDelivery}
              </div>
            )}

            <button
              className="btn btn-calcular"
              onClick={calcularTudo}
            >
              Calcular fechamento
            </button>

            {/* Histórico de fechamentos anteriores */}
            <Historico
              historico={historico}
              onSelecionar={(item) => { setRelatorio(item); setEtapa('resultado'); }}
              onLimpar={() => setModalLimparHistorico(true)}
            />
          </div>
        )}

        {/* ============================================================
            RESULTADO
        ============================================================ */}
        {etapa === 'resultado' && relatorio && (
          <div ref={resultadoRef} className="anima-fade" style={{ width: '100%' }}>
            <div ref={conteudoRef} style={{ padding: '16px', background: '#0f172a', borderRadius: '14px' }}>

              <div className={`resultado-banner ${positivo ? 'banner--ok' : 'banner--alerta'}`}>
                <span className="banner-icon">{positivo ? <IconCheck /> : <IconAlert />}</span>
                <div className="banner-info">
                  <p className="banner-titulo">{positivo ? 'Caixa fechado!' : 'Divergência encontrada'}</p>
                  <p className="banner-sub">{positivo ? 'Tudo confere.' : 'Verifique os valores abaixo.'}</p>
                  <p className="banner-data">{relatorio.dataFechamento}</p>
                </div>
                <span className={`banner-valor ${positivo ? 'val--ok' : 'val--alerta'}`}>
                  R$ {formatBRL(relatorio.totalGeral)}
                </span>
              </div>

              <div className="fc-grid" style={{ marginTop: 16 }}>
                {/* Resumo Salão */}
                <div className="fc-card fc-card--salao">
                  <div className="setor-header setor-header--salao">
                    <span className="setor-icon"><IconStore /></span>
                    <span className="setor-title">Salão</span>
                  </div>
                  <div className="resumo-block">
                    <ResumoRow label="Esperado (sistema)" value={relatorio.sistSalao} />
                    <ResumoRow label="Realizado (caixa)"  value={relatorio.realSalao} />
                    <ResumoRow label="Excedente funcionários" value={relatorio.excedente} sub />
                    <div className="resumo-divider" />
                    <ResumoRow label="Diferença" value={relatorio.difSalao} accent />
                  </div>
                </div>

                {/* Resumo Delivery */}
                <div className="fc-card fc-card--delivery">
                  <div className="setor-header setor-header--delivery">
                    <span className="setor-icon"><IconBike /></span>
                    <span className="setor-title">Delivery</span>
                  </div>
                  <div className="resumo-block">
                    <ResumoRow label="Esperado (sistema)"  value={relatorio.sistDeliv} />
                    <ResumoRow label="Realizado (líquido)" value={relatorio.realDelivLiq} />
                    <ResumoRow label="Gasolina adicionada" value={relatorio.totalGasEnt} sub />
                    <div className="resumo-divider" />
                    <ResumoRow label="Diferença" value={relatorio.difDeliv} accent />
                  </div>
                  {relatorio.motoboys.length > 0 && (
                    <>
                      <div className="section-divider" style={{ margin: '16px 0' }} />
                      <p className="section-label">Por motoboy</p>
                      {relatorio.motoboys.map((m, i) => (
                        <div key={i} className="motoboy-resumo">
                          <div className="motoboy-avatar sm">{m.nome.charAt(0).toUpperCase()}</div>
                          <span className="motoboy-nome">{m.nome}</span>
                          <span className="motoboy-qtd">{m.qtd} entregas</span>
                          <span className="motoboy-total">R$ {formatBRL(m.maq + m.din + m.gas)}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
              <button className="btn btn-ghost btn-icon" onClick={() => setEtapa('formulario')}>
                ← Voltar e editar
              </button>
              <button
                className={`btn btn-icon ${copiado ? 'btn-copiado' : 'btn-copiar'}`}
                onClick={copiarComoImagem}
                disabled={copiando}
              >
                {copiando
                  ? <>⏳ Gerando imagem...</>
                  : copiado
                    ? <><IconCheck /> Copiado!</>
                    : <><IconCamera /> Copiar para WhatsApp</>}
              </button>
              {/* Botão novo fechamento — abre confirmação antes de limpar */}
              <button className="btn btn-ghost btn-icon" onClick={() => setModalNovoFechamento(true)}>
                <IconRefresh /> Novo fechamento
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ============================================================
          MODAIS
      ============================================================ */}
      {modalNovoFechamento && (
        <Modal
          titulo="Iniciar novo fechamento?"
          mensagem="Todos os valores preenchidos serão apagados. O fechamento atual já foi salvo no histórico."
          onConfirmar={confirmarNovoFechamento}
          onCancelar={() => setModalNovoFechamento(false)}
        />
      )}

      {modalLimparHistorico && (
        <Modal
          titulo="Limpar histórico?"
          mensagem="Todos os fechamentos anteriores serão removidos permanentemente."
          onConfirmar={() => {
            setHistorico([]);
            try { localStorage.removeItem(HISTORICO_KEY); } catch {}
            setModalLimparHistorico(false);
          }}
          onCancelar={() => setModalLimparHistorico(false)}
        />
      )}
    </div>
  );
};

export default Fechamento;