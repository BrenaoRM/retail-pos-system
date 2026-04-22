/**
 * Calculadora
 * - Modo "Notas": contador de cédulas/moedas com total automático
 * - Modo "Normal": calculadora padrão com operações básicas
 *
 * Em telas >= 1060px aparece fixa à direita do formulário.
 * Em telas menores aparece como botão flutuante que abre overlay.
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { fmt } from '../../lib/format';
import './Calculadora.css';

// Cédulas e moedas usadas no dia a dia do caixa
const DENOMINACOES = [
  { v: 200,  label: 'R$ 200',  tipo: 'nota' },
  { v: 100,  label: 'R$ 100',  tipo: 'nota' },
  { v: 50,   label: 'R$ 50',   tipo: 'nota' },
  { v: 20,   label: 'R$ 20',   tipo: 'nota' },
  { v: 10,   label: 'R$ 10',   tipo: 'nota' },
  { v: 5,    label: 'R$ 5',    tipo: 'nota' },
  { v: 2,    label: 'R$ 2',    tipo: 'nota' },
  { v: 1,    label: 'R$ 1',    tipo: 'moeda' },
  { v: 0.5,  label: 'R$ 0,50', tipo: 'moeda' },
  { v: 0.25, label: 'R$ 0,25', tipo: 'moeda' },
  { v: 0.1,  label: 'R$ 0,10', tipo: 'moeda' },
  { v: 0.05, label: 'R$ 0,05', tipo: 'moeda' },
];

// ── Modo Notas ─────────────────────────────────────────────────
function ModoNotas() {
  const [quantidades, setQuantidades] = useState(() =>
    DENOMINACOES.reduce((acc, d) => ({ ...acc, [d.v]: 0 }), {})
  );

  const setQtd = useCallback((v, qtd) => {
    const n = Math.max(0, Math.floor(Number(qtd) || 0));
    setQuantidades(prev => ({ ...prev, [v]: n }));
  }, []);

  const total = useMemo(
    () => DENOMINACOES.reduce((s, d) => s + d.v * (quantidades[d.v] || 0), 0),
    [quantidades]
  );

  const totalNotas = useMemo(
    () => DENOMINACOES.reduce((s, d) => s + (quantidades[d.v] || 0), 0),
    [quantidades]
  );

  function limpar() {
    setQuantidades(DENOMINACOES.reduce((acc, d) => ({ ...acc, [d.v]: 0 }), {}));
  }

  return (
    <div className="calc-notas" data-testid="calc-notas">
      <div className="calc-notas-lista">
        {DENOMINACOES.map((d) => {
          const qtd = quantidades[d.v] || 0;
          const sub = d.v * qtd;
          return (
            <div key={d.v} className={`calc-nota-linha calc-nota-linha--${d.tipo}`}>
              <div className="calc-nota-chip">{d.label}</div>
              <div className="calc-nota-qtd">
                <button
                  type="button"
                  className="calc-nota-btn"
                  onClick={() => setQtd(d.v, qtd - 1)}
                  aria-label="Diminuir"
                  data-testid={`calc-dec-${d.v}`}
                >
                  −
                </button>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  className="calc-nota-input"
                  value={qtd === 0 ? '' : qtd}
                  placeholder="0"
                  onChange={(e) => setQtd(d.v, e.target.value)}
                  data-testid={`calc-qtd-${d.v}`}
                />
                <button
                  type="button"
                  className="calc-nota-btn"
                  onClick={() => setQtd(d.v, qtd + 1)}
                  aria-label="Aumentar"
                  data-testid={`calc-inc-${d.v}`}
                >
                  +
                </button>
              </div>
              <div className={`calc-nota-sub ${sub > 0 ? 'is-ativo' : ''}`}>
                R$ {fmt(sub)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="calc-notas-rodape">
        <div className="calc-notas-resumo">
          <span className="calc-notas-resumo-label">
            {totalNotas} {totalNotas === 1 ? 'peça' : 'peças'}
          </span>
          <span className="calc-notas-resumo-total" data-testid="calc-notas-total">
            R$ {fmt(total)}
          </span>
        </div>
        <button
          type="button"
          className="calc-acao-secundaria"
          onClick={limpar}
          data-testid="calc-notas-limpar"
        >
          Limpar
        </button>
      </div>
    </div>
  );
}

// ── Modo Normal ────────────────────────────────────────────────
// Parser seguro: aceita apenas dígitos, ponto, e +−×÷
function avaliar(expr) {
  if (!expr) return 0;
  const limpa = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '.')
    .replace(/−/g, '-');
  if (!/^[\d+\-*/.() ]+$/.test(limpa)) throw new Error('Expressão inválida');
  // eslint-disable-next-line no-new-func
  const r = Function(`"use strict"; return (${limpa});`)();
  if (!Number.isFinite(r)) throw new Error('Resultado inválido');
  return r;
}

function ModoNormal() {
  const [expr, setExpr] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(false);

  const append = useCallback((c) => {
    setErro(false);
    setExpr((prev) => {
      if (resultado !== null && /[+\-×÷]/.test(c)) {
        setResultado(null);
        return String(resultado) + c;
      }
      if (resultado !== null) {
        setResultado(null);
        return c;
      }
      if (/[+\-×÷]/.test(c) && /[+\-×÷]$/.test(prev)) {
        return prev.slice(0, -1) + c;
      }
      return prev + c;
    });
  }, [resultado]);

  const backspace = useCallback(() => {
    setErro(false);
    if (resultado !== null) {
      setResultado(null);
      setExpr('');
      return;
    }
    setExpr((p) => p.slice(0, -1));
  }, [resultado]);

  const limpar = useCallback(() => {
    setErro(false);
    setExpr('');
    setResultado(null);
  }, []);

  const igual = useCallback(() => {
    try {
      const r = avaliar(expr);
      setResultado(Math.round(r * 100) / 100);
      setErro(false);
    } catch {
      setErro(true);
    }
  }, [expr]);

  useEffect(() => {
    function onKey(e) {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (/^[0-9]$/.test(e.key)) return append(e.key);
      if (e.key === '.' || e.key === ',') return append('.');
      if (e.key === '+') return append('+');
      if (e.key === '-') return append('-');
      if (e.key === '*') return append('×');
      if (e.key === '/') return append('÷');
      if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); return igual(); }
      if (e.key === 'Backspace') return backspace();
      if (e.key === 'Escape')    return limpar();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [append, igual, backspace, limpar]);

  const BOTOES = [
    ['C',  '←', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '−'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  return (
    <div className="calc-normal" data-testid="calc-normal">
      <div className={`calc-display ${erro ? 'is-erro' : ''}`}>
        <div className="calc-display-expr" data-testid="calc-expr">
          {expr || '\u00A0'}
        </div>
        <div className="calc-display-res" data-testid="calc-resultado">
          {erro ? 'Erro' : resultado !== null ? `= R$ ${fmt(resultado)}` : '\u00A0'}
        </div>
      </div>

      <div className="calc-teclado">
        {BOTOES.flat().map((b) => {
          let cls = 'calc-tecla';
          if (['÷','×','−','+'].includes(b)) cls += ' calc-tecla--op';
          if (b === '=') cls += ' calc-tecla--igual';
          if (b === 'C' || b === '←') cls += ' calc-tecla--fn';
          if (b === '0') cls += ' calc-tecla--wide';

          const onClick = () => {
            if (b === 'C') return limpar();
            if (b === '←') return backspace();
            if (b === '=') return igual();
            return append(b);
          };

          return (
            <button
              key={b}
              type="button"
              className={cls}
              onClick={onClick}
              data-testid={`calc-tecla-${b}`}
            >
              {b}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Container com toggle de modo ───────────────────────────────
function CalculadoraConteudo() {
  const [modo, setModo] = useState('notas');

  return (
    <>
      <div className="calc-modo-toggle" role="tablist" aria-label="Modo de calculadora">
        <button
          role="tab"
          aria-selected={modo === 'notas'}
          className={`calc-modo-btn ${modo === 'notas' ? 'is-ativo' : ''}`}
          onClick={() => setModo('notas')}
          data-testid="calc-modo-notas"
        >
          Notas
        </button>
        <button
          role="tab"
          aria-selected={modo === 'normal'}
          className={`calc-modo-btn ${modo === 'normal' ? 'is-ativo' : ''}`}
          onClick={() => setModo('normal')}
          data-testid="calc-modo-normal"
        >
          Calculadora
        </button>
      </div>

      <div className="calc-conteudo">
        {modo === 'notas' ? <ModoNotas /> : <ModoNormal />}
      </div>
    </>
  );
}

// ── Componente exportado ───────────────────────────────────────
export default function Calculadora() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (aberto) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [aberto]);

  return (
    <>
      <aside className="calc-sidebar" data-testid="calc-sidebar">
        <div className="calc-cabecalho">
          <h3>Calculadora</h3>
        </div>
        <CalculadoraConteudo />
      </aside>

      <button
        type="button"
        className={`calc-fab ${aberto ? 'is-aberto' : ''}`}
        onClick={() => setAberto(v => !v)}
        aria-label="Abrir calculadora"
        data-testid="calc-fab"
      >
        {aberto ? '✕' : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="8" y1="10" x2="8.01" y2="10" />
            <line x1="12" y1="10" x2="12.01" y2="10" />
            <line x1="16" y1="10" x2="16.01" y2="10" />
            <line x1="8" y1="14" x2="8.01" y2="14" />
            <line x1="12" y1="14" x2="12.01" y2="14" />
            <line x1="16" y1="14" x2="16.01" y2="14" />
            <line x1="8" y1="18" x2="8.01" y2="18" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
            <line x1="16" y1="18" x2="16.01" y2="18" />
          </svg>
        )}
      </button>

      {aberto && (
        <div
          className="calc-overlay"
          onClick={() => setAberto(false)}
          data-testid="calc-overlay"
        >
          <div className="calc-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="calc-cabecalho">
              <h3>Calculadora</h3>
              <button
                type="button"
                className="calc-fechar"
                onClick={() => setAberto(false)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
            <CalculadoraConteudo />
          </div>
        </div>
      )}
    </>
  );
}