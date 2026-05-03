/**
 * ResultadoFechamento
 * Componente que renderiza o resultado do fechamento
 * com detalhamento transparente passo a passo dos cálculos.
 */

import React from 'react';
import { IconStore, IconBike, IconRefresh } from "../../components/Icons";
import { fmt } from "../../lib/format";

// ── Componente: Linha de Cálculo ──────────────────────────────
function LinhaCalculo({ sinal, label, value, destaque, hint }) {
  const val = Number(value) || 0;
  const isZero = val === 0;
  const opacidade = isZero && !destaque ? 'lc--zero' : '';

  return (
    <div className={`lc-linha ${destaque ? 'lc-linha--destaque' : ''} ${opacidade}`}>
      <span className="lc-sinal">{sinal}</span>
      <span className="lc-label">
        {label}
        {hint && <span className="lc-hint"> ({hint})</span>}
      </span>
      <span className={`lc-valor ${val < 0 ? 'lc-valor--neg' : ''}`}>
        R$ {fmt(Math.abs(val))}
      </span>
    </div>
  );
}

// Linha separadora com resultado parcial
function LinhaSoma({ label, value }) {
  const val = Number(value) || 0;
  return (
    <div className="lc-soma">
      <span className="lc-soma-label">{label}</span>
      <span className={`lc-soma-valor ${val < 0 ? 'lc-soma-valor--neg' : val > 0 ? 'lc-soma-valor--pos' : 'lc-soma-valor--zero'}`}>
        {val > 0 ? '+' : val < 0 ? '' : ''}R$ {fmt(val)}
      </span>
    </div>
  );
}

// ── Bloco: Raio-X do Salão ────────────────────────────────────
function RaioXSalao({ relatorio }) {
  const {
    sistSalao, vendaRetirada, pixRetirada, pixRetiradaAuto,
    totalVendasSalao, excedente,
    dinheiroGaveta, trocoInicial, maqSalao, maqRetirada,
    notinhas, abastecimento, realSalao, difSalao,
  } = relatorio;

  return (
    <div className="raio-x-bloco">
      <div className="raio-x-titulo">
        <IconStore />
        <span>Como chegamos na diferença do Salão</span>
      </div>

      <div className="raio-x-passo">
        <span className="raio-x-passo-label">① O que o sistema esperava receber</span>
        <div className="lc-equacao">
          <LinhaCalculo sinal="+" label="Vendas mesas (sistema)" value={sistSalao} />
          <LinhaCalculo
            sinal="+"
            label="Retirada líquida"
            value={pixRetiradaAuto}
            hint={`${fmt(vendaRetirada)} total − ${fmt(pixRetirada)} pix automático`}
          />
          <LinhaSoma label="= Total esperado" value={totalVendasSalao} />
        </div>
      </div>

      <div className="raio-x-passo">
        <span className="raio-x-passo-label">② O que foi realmente apurado</span>
        <div className="lc-equacao">
          <LinhaCalculo
            sinal="+"
            label="Dinheiro na gaveta (bruto)"
            value={dinheiroGaveta - trocoInicial}
            hint={`${fmt(dinheiroGaveta)} gaveta − ${fmt(trocoInicial)} troco inicial`}
          />
          <LinhaCalculo sinal="+" label="Maquininha salão" value={maqSalao} />
          <LinhaCalculo sinal="+" label="Maquininha retirada" value={maqRetirada} />
          <LinhaCalculo sinal="+" label="Notinhas" value={notinhas} hint="pedidos de funcionários não pagos" />
          <LinhaCalculo sinal="+" label="Abastecimento" value={abastecimento} hint="valor retirado para veículos" />
          <LinhaCalculo sinal="−" label="Excedente funcionários" value={excedente} hint="valor cobrado a mais, subtrai no realizado" />
          <LinhaSoma label="= Total realizado" value={realSalao} />
        </div>
      </div>

      <div className="raio-x-passo raio-x-passo--resultado">
        <span className="raio-x-passo-label">③ Diferença</span>
        <div className="lc-equacao">
          <LinhaCalculo sinal=" " label="Total realizado" value={realSalao} />
          <LinhaCalculo sinal="−" label="Total esperado" value={totalVendasSalao} />
          <LinhaSoma label="= Diferença salão" value={difSalao} />
        </div>
        {difSalao < -0.5 && (
          <div className="raio-x-alerta">
            ⚠️ Faltam <strong>R$ {fmt(Math.abs(difSalao))}</strong> no salão.
            Verifique: dinheiro contado errado, troco calculado errado, maquininha não conferida ou notinha esquecida.
          </div>
        )}
        {difSalao > 0.5 && (
          <div className="raio-x-ok">
            ✅ Sobram <strong>R$ {fmt(difSalao)}</strong> no salão. Caixa com saldo positivo.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bloco: Raio-X do Delivery ─────────────────────────────────
function RaioXDelivery({ relatorio, motoboys }) {
  const {
    vendaWeb, pixWeb, pixWebAuto,
    vendaBundiA, pixBundiA, pixBundiAAuto,
    vendaBundiB, pixBundiB, pixBundiBAuto,
    sistDeliv, realDelivLiq, difDeliv,
  } = relatorio;

  return (
    <div className="raio-x-bloco">
      <div className="raio-x-titulo">
        <IconBike />
        <span>Como chegamos na diferença do Delivery</span>
      </div>

      <div className="raio-x-passo">
        <span className="raio-x-passo-label">① O que o sistema esperava receber (excluindo pix automático)</span>
        <div className="lc-equacao">
          <LinhaCalculo sinal="+" label="Web Cardápio líquido" value={pixWebAuto} hint={`${fmt(vendaWeb)} total − ${fmt(pixWeb)} pix automático`} />
          <LinhaCalculo sinal="+" label="Brendi Açaí líquido" value={pixBundiAAuto} hint={`${fmt(vendaBundiA)} total − ${fmt(pixBundiA)} pix automático`} />
          <LinhaCalculo sinal="+" label="Brendi Pizza/Hamb líquido" value={pixBundiBAuto} hint={`${fmt(vendaBundiB)} total − ${fmt(pixBundiB)} pix automático`} />
          <LinhaSoma label="= Total esperado" value={sistDeliv} />
        </div>
      </div>

      <div className="raio-x-passo">
        <span className="raio-x-passo-label">② O que os motoboys trouxeram</span>
        <div className="lc-equacao">
          {motoboys.map((m, i) => {
            const total = (m.maq || 0) + (m.din || 0);
            return (
              <LinhaCalculo
                key={i}
                sinal="+"
                label={m.nome || `Entregador ${i + 1}`}
                value={total}
                hint={`${m.qtd || 0} entrega${(m.qtd || 0) !== 1 ? 's' : ''} · maq R$ ${fmt(m.maq)} + din R$ ${fmt(m.din)}`}
              />
            );
          })}
          <LinhaSoma label="= Total realizado" value={realDelivLiq} />
        </div>
      </div>

      <div className="raio-x-passo raio-x-passo--resultado">
        <span className="raio-x-passo-label">③ Diferença</span>
        <div className="lc-equacao">
          <LinhaCalculo sinal=" " label="Total realizado" value={realDelivLiq} />
          <LinhaCalculo sinal="−" label="Total esperado" value={sistDeliv} />
          <LinhaSoma label="= Diferença delivery" value={difDeliv} />
        </div>
        {difDeliv < -0.5 && (
          <div className="raio-x-alerta">
            ⚠️ Faltam <strong>R$ {fmt(Math.abs(difDeliv))}</strong> no delivery.
            Verifique: motoboy com valor errado, pedido cancelado não descontado ou pix automático informado incorretamente.
          </div>
        )}
        {difDeliv > 0.5 && (
          <div className="raio-x-ok">
            ✅ Sobram <strong>R$ {fmt(difDeliv)}</strong> no delivery.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Componente Principal ──────────────────────────────────────
export function ResultadoFechamento({
  resultadoRef,
  conteudoRef,
  relatorio,
  motoboys,
  observacao,
  onObservacaoChange,
  onVoltar,
  onCopiar,
  onNovoFechamento,
}) {
  const positivo = relatorio && Math.abs(relatorio.totalGeral) < 1;

  return (
    <div ref={resultadoRef} className="fc-fade">
      <div ref={conteudoRef}></div>

      {/* ── Raio-X dos Cálculos ── */}
      <div className="raio-x-wrap">
        <div className="raio-x-painel raio-x-painel--aberto">
          <p className="raio-x-intro">
            Abaixo está o passo a passo de como cada número foi calculado.
            Use isso para identificar exatamente onde está a divergência.
          </p>
          <RaioXSalao relatorio={relatorio} />
          <div className="raio-x-separador" />
          <RaioXDelivery relatorio={relatorio} motoboys={motoboys} />

          <div className="raio-x-bloco raio-x-bloco--final">
            <div className="raio-x-titulo">
              <span>📊 Resumo geral</span>
            </div>
            <div className="lc-equacao">
              <LinhaCalculo sinal=" " label="Diferença salão" value={relatorio.difSalao} />
              <LinhaCalculo sinal="+" label="Diferença delivery" value={relatorio.difDeliv} />
              <LinhaSoma label="= Diferença total" value={relatorio.totalGeral} />
            </div>
            {!positivo && (
              <div className="raio-x-alerta raio-x-alerta--total">
                O caixa fechou com <strong>R$ {fmt(Math.abs(relatorio.totalGeral))}</strong> de
                {relatorio.totalGeral < 0 ? ' falta' : ' sobra'}.
                {relatorio.difSalao < -0.5 && relatorio.difDeliv < -0.5 && ' A divergência está tanto no salão quanto no delivery.'}
                {relatorio.difSalao < -0.5 && relatorio.difDeliv >= -0.5 && ' A divergência está concentrada no salão.'}
                {relatorio.difSalao >= -0.5 && relatorio.difDeliv < -0.5 && ' A divergência está concentrada no delivery.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Campo de Observação ── */}
      <div className="fc-observacao-wrap">
        <label className="fc-observacao-label">Observação (opcional)</label>
        <textarea
          className="fc-observacao-input"
          placeholder="Ex: caixa com moedas separadas, entregador saiu mais cedo..."
          value={observacao}
          onChange={e => onObservacaoChange(e.target.value)}
          rows={3}
        />
      </div>

      {/* ── Bloco de Impressão (invisível na tela) ── */}
      <div className="print-only">
        <div className="print-header">
          <h1 className="print-titulo">Fechamento de Caixa</h1>
          <p className="print-data">{relatorio.dataFechamento}</p>
          <div className={`print-resultado ${positivo ? 'print-resultado--ok' : 'print-resultado--alerta'}`}>
            {positivo ? 'CAIXA FECHADO · TUDO CONFERE' : 'DIVERGÊNCIA ENCONTRADA'}
            {' — '}R$ {fmt(relatorio.totalGeral)}
          </div>
        </div>

        {/* Salão */}
        <div className="print-secao">
          <h2 className="print-secao-titulo">SALÃO</h2>
          <div className="print-grupo">
            <span className="print-grupo-label">① O que o sistema esperava receber</span>
            <div className="print-linha"><span>Vendas mesas (sistema)</span><span>R$ {fmt(relatorio.sistSalao)}</span></div>
            <div className="print-linha"><span>Retirada líquida ({fmt(relatorio.vendaRetirada)} − {fmt(relatorio.pixRetirada)} pix)</span><span>R$ {fmt(relatorio.pixRetiradaAuto)}</span></div>
            <div className="print-linha print-linha--total"><span>= Total esperado</span><span>R$ {fmt(relatorio.totalVendasSalao)}</span></div>
          </div>
          <div className="print-grupo">
            <span className="print-grupo-label">② O que foi realmente apurado</span>
            <div className="print-linha"><span>Dinheiro na gaveta ({fmt(relatorio.dinheiroGaveta)} − {fmt(relatorio.trocoInicial)} troco)</span><span>R$ {fmt(relatorio.dinheiroGaveta - relatorio.trocoInicial)}</span></div>
            <div className="print-linha"><span>Maquininha salão</span><span>R$ {fmt(relatorio.maqSalao)}</span></div>
            <div className="print-linha"><span>Maquininha retirada</span><span>R$ {fmt(relatorio.maqRetirada)}</span></div>
            <div className="print-linha"><span>Notinhas (pedidos de funcionários)</span><span>R$ {fmt(relatorio.notinhas)}</span></div>
            <div className="print-linha"><span>Abastecimento</span><span>R$ {fmt(relatorio.abastecimento)}</span></div>
            <div className="print-linha"><span>Excedente funcionários (−)</span><span>R$ {fmt(relatorio.excedente)}</span></div>
            <div className="print-linha print-linha--total"><span>= Total realizado</span><span>R$ {fmt(relatorio.realSalao)}</span></div>
          </div>
          <div className="print-linha print-linha--diferenca"><span>Diferença salão</span><span className={relatorio.difSalao < 0 ? 'print-neg' : 'print-pos'}>R$ {fmt(relatorio.difSalao)}</span></div>
        </div>

        {/* Delivery */}
        <div className="print-secao">
          <h2 className="print-secao-titulo">DELIVERY</h2>
          <div className="print-grupo">
            <span className="print-grupo-label">① O que o sistema esperava receber</span>
            <div className="print-linha"><span>Web Cardápio ({fmt(relatorio.vendaWeb)} − {fmt(relatorio.pixWeb)} pix)</span><span>R$ {fmt(relatorio.pixWebAuto)}</span></div>
            <div className="print-linha"><span>Brendi Açaí ({fmt(relatorio.vendaBundiA)} − {fmt(relatorio.pixBundiA)} pix)</span><span>R$ {fmt(relatorio.pixBundiAAuto)}</span></div>
            <div className="print-linha"><span>Brendi Pizza/Hamb ({fmt(relatorio.vendaBundiB)} − {fmt(relatorio.pixBundiB)} pix)</span><span>R$ {fmt(relatorio.pixBundiBAuto)}</span></div>
            <div className="print-linha print-linha--total"><span>= Total esperado</span><span>R$ {fmt(relatorio.sistDeliv)}</span></div>
          </div>
          <div className="print-grupo">
            <span className="print-grupo-label">② O que os motoboys trouxeram</span>
            {motoboys.map((m, i) => (
              <div key={i} className="print-linha">
                <span>{m.nome || `Entregador ${i + 1}`} — {m.qtd || 0} entrega{(m.qtd || 0) !== 1 ? 's' : ''} (maq R$ {fmt(m.maq)} + din R$ {fmt(m.din)})</span>
                <span>R$ {fmt((m.maq || 0) + (m.din || 0))}</span>
              </div>
            ))}
            <div className="print-linha print-linha--total"><span>= Total realizado</span><span>R$ {fmt(relatorio.realDelivLiq)}</span></div>
          </div>
          <div className="print-linha print-linha--diferenca"><span>Diferença delivery</span><span className={relatorio.difDeliv < 0 ? 'print-neg' : 'print-pos'}>R$ {fmt(relatorio.difDeliv)}</span></div>
        </div>

        {/* Resumo Geral */}
        <div className="print-secao print-secao--final">
          <h2 className="print-secao-titulo">RESUMO GERAL</h2>
          <div className="print-linha"><span>Diferença salão</span><span>R$ {fmt(relatorio.difSalao)}</span></div>
          <div className="print-linha"><span>Diferença delivery</span><span>R$ {fmt(relatorio.difDeliv)}</span></div>
          <div className="print-linha print-linha--grande"><span>DIFERENÇA TOTAL</span><span className={relatorio.totalGeral < 0 ? 'print-neg' : relatorio.totalGeral > 0 ? 'print-pos' : ''}>R$ {fmt(relatorio.totalGeral)}</span></div>
        </div>

        {/* Observação */}
        {observacao ? (
          <div className="print-observacao">
            <span className="print-observacao-label">Observação:</span>
            <span className="print-observacao-texto">{observacao}</span>
          </div>
        ) : null}
      </div>

      {/* ── Botões de Ação ── */}
      <div className="fc-acoes">
        <button className="btn btn--ghost" onClick={onVoltar}>
          ← Voltar e editar
        </button>
        <button className="btn btn--copiar" onClick={() => window.print()}>
          🖨️ Imprimir
        </button>
        <button className="btn btn--ghost" onClick={onNovoFechamento}>
          <IconRefresh /> Novo fechamento
        </button>
      </div>

      {/* ── CSS ── */}
      <style>{`
        .raio-x-wrap { margin: 16px 0 8px; }
        .raio-x-painel--aberto {
          padding: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .raio-x-intro { margin: 0; font-size: 0.8rem; color: #64748b; line-height: 1.5; }
        .raio-x-separador { height: 1px; background: rgba(255,255,255,0.07); }
        .raio-x-bloco { display: flex; flex-direction: column; gap: 14px; }
        .raio-x-bloco--final {
          padding: 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
        }
        .raio-x-titulo { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 600; color: #cbd5e1; }
        .raio-x-titulo svg { width: 16px; height: 16px; opacity: 0.7; }
        .raio-x-passo { display: flex; flex-direction: column; gap: 6px; }
        .raio-x-passo-label { font-size: 0.75rem; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
        .raio-x-passo--resultado .raio-x-passo-label { color: #94a3b8; }
        .lc-equacao { background: rgba(0,0,0,0.2); border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
        .lc-linha { display: flex; align-items: baseline; gap: 6px; padding: 3px 0; font-size: 0.82rem; color: #94a3b8; transition: opacity 0.2s; }
        .lc-linha--zero { opacity: 0.38; }
        .lc-linha--destaque { color: #e2e8f0; font-weight: 500; }
        .lc-sinal { width: 14px; text-align: center; flex-shrink: 0; color: #475569; font-weight: 600; font-size: 0.9rem; }
        .lc-label { flex: 1; min-width: 0; }
        .lc-hint { font-size: 0.72rem; color: #475569; font-style: italic; }
        .lc-valor { font-variant-numeric: tabular-nums; font-weight: 500; white-space: nowrap; }
        .lc-valor--neg { color: #f87171; }
        .lc-soma { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 0.85rem; font-weight: 600; }
        .lc-soma-label { color: #cbd5e1; }
        .lc-soma-valor { font-variant-numeric: tabular-nums; }
        .lc-soma-valor--neg { color: #f87171; }
        .lc-soma-valor--pos { color: #4ade80; }
        .lc-soma-valor--zero { color: #4ade80; }
        .raio-x-alerta { margin-top: 8px; padding: 10px 12px; background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); border-radius: 8px; font-size: 0.8rem; color: #fca5a5; line-height: 1.5; }
        .raio-x-alerta--total { background: rgba(248,113,113,0.12); border-color: rgba(248,113,113,0.3); font-size: 0.85rem; }
        .raio-x-ok { margin-top: 8px; padding: 10px 12px; background: rgba(74,222,128,0.07); border: 1px solid rgba(74,222,128,0.2); border-radius: 8px; font-size: 0.8rem; color: #86efac; line-height: 1.5; }

        /* ── IMPRESSÃO ── */
        .print-only { display: none; }

        @media print {
          /* Esconde tudo da tela */
          body * { visibility: hidden; }

          /* Mostra só o bloco de impressão */
          .print-only, .print-only * { visibility: visible !important; }
          .print-only {
            display: block !important;
            position: static;
            width: 100%;
            padding: 32px 40px;
            font-family: 'Arial', sans-serif;
            color: #111;
            background: #fff;
          }

          .print-header { text-align: center; margin-bottom: 28px; border-bottom: 2px solid #111; padding-bottom: 16px; }
          .print-titulo { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
          .print-data { font-size: 13px; color: #555; margin: 0 0 10px; }
          .print-resultado { font-size: 15px; font-weight: 700; padding: 6px 14px; display: inline-block; border-radius: 4px; }
          .print-resultado--ok { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
          .print-resultado--alerta { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

          .print-secao { margin-bottom: 22px; }
          .print-secao-titulo { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; color: #444; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin: 0 0 10px; }
          .print-secao--final { border-top: 2px solid #111; padding-top: 12px; }

          .print-grupo { margin-bottom: 12px; }
          .print-grupo-label { font-size: 10px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }

          .print-linha { display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; border-bottom: 1px dotted #e5e5e5; }
          .print-linha span:first-child { color: #333; }
          .print-linha span:last-child { font-weight: 600; font-variant-numeric: tabular-nums; }

          .print-linha--total { border-bottom: 1px solid #999; border-top: 1px solid #999; font-weight: 700; font-size: 13px; padding: 5px 0; margin-top: 2px; }
          .print-linha--total span { font-weight: 700; }

          .print-linha--diferenca { font-size: 13px; font-weight: 700; padding: 6px 0; border-bottom: none; }

          .print-linha--grande { font-size: 15px; font-weight: 700; padding: 8px 0; border-top: 1px solid #111; margin-top: 4px; }

          .print-neg { color: #b91c1c; }
          .print-pos { color: #065f46; }

          .print-observacao { margin-top: 24px; padding: 12px; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9; }
          .print-observacao-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #555; display: block; margin-bottom: 4px; }
          .print-observacao-texto { font-size: 13px; color: #222; }
        }
      `}</style>
    </div>
  );
}
