/**
 * ResultadoFechamento
 * Componente que renderiza o resultado do fechamento
 * com detalhamento transparente passo a passo dos cálculos.
 *
 * CSS foi movido para Fechamento.css — o bloco <style> inline
 * era recriado e reinjetado no DOM a cada render.
 */

import React, { memo, useCallback } from 'react';
import { IconStore, IconBike, IconRefresh } from "../../components/Icons";
import { fmt } from "../../lib/format";

// ── Componente: Linha de Cálculo ──────────────────────────────
// memo: só re-renderiza se as props mudarem — evita recalcular
// todas as linhas quando só uma muda
const LinhaCalculo = memo(function LinhaCalculo({ sinal, label, value, destaque, hint }) {
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
});

// Linha separadora com resultado parcial
const LinhaSoma = memo(function LinhaSoma({ label, value }) {
  const val = Number(value) || 0;
  return (
    <div className="lc-soma">
      <span className="lc-soma-label">{label}</span>
      <span className={`lc-soma-valor ${val < 0 ? 'lc-soma-valor--neg' : val > 0 ? 'lc-soma-valor--pos' : 'lc-soma-valor--zero'}`}>
        {val > 0 ? '+' : val < 0 ? '' : ''}R$ {fmt(val)}
      </span>
    </div>
  );
});

// ── Bloco: Raio-X do Salão ────────────────────────────────────
// memo: relatorio é estável após o cálculo, então esse bloco
// nunca re-renderiza enquanto o usuário digita na observação
const RaioXSalao = memo(function RaioXSalao({ relatorio }) {
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
          <LinhaCalculo sinal="+" label="Maquininha salão"    value={maqSalao} />
          <LinhaCalculo sinal="+" label="Maquininha retirada" value={maqRetirada} />
          <LinhaCalculo sinal="+" label="Notinhas"      value={notinhas}      hint="pedidos de funcionários não pagos" />
          <LinhaCalculo sinal="+" label="Abastecimento" value={abastecimento} hint="valor retirado para veículos" />
          <LinhaCalculo sinal="−" label="Excedente funcionários" value={excedente} hint="valor cobrado a mais, subtrai no realizado" />
          <LinhaSoma label="= Total realizado" value={realSalao} />
        </div>
      </div>

      <div className="raio-x-passo raio-x-passo--resultado">
        <span className="raio-x-passo-label">③ Diferença</span>
        <div className="lc-equacao">
          <LinhaCalculo sinal=" " label="Total realizado" value={realSalao} />
          <LinhaCalculo sinal="−" label="Total esperado"  value={totalVendasSalao} />
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
});

// ── Bloco: Raio-X do Delivery ─────────────────────────────────
const RaioXDelivery = memo(function RaioXDelivery({ relatorio, motoboys }) {
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
          <LinhaCalculo sinal="+" label="Web Cardápio líquido"     value={pixWebAuto}   hint={`${fmt(vendaWeb)} total − ${fmt(pixWeb)} pix automático`} />
          <LinhaCalculo sinal="+" label="Brendi Açaí líquido"      value={pixBundiAAuto} hint={`${fmt(vendaBundiA)} total − ${fmt(pixBundiA)} pix automático`} />
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
                hint={`maq R$ ${fmt(m.maq)} + din R$ ${fmt(m.din)}`}
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
          <LinhaCalculo sinal="−" label="Total esperado"  value={sistDeliv} />
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
});

// ── Componente Principal ──────────────────────────────────────
export const ResultadoFechamento = memo(function ResultadoFechamento({
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

  // Handler estável para o textarea — evita re-render dos filhos
  const handleObservacao = useCallback((e) => {
    onObservacaoChange(e.target.value);
  }, [onObservacaoChange]);

  // Handler estável para o botão imprimir
  const handleImprimir = useCallback(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    const prev = meta?.content;
    if (meta) meta.content = 'width=device-width, initial-scale=1';
    window.print();
    if (meta && prev) setTimeout(() => { meta.content = prev; }, 500);
  }, []);

  return (
    <div ref={resultadoRef} className="fc-fade">
      <div ref={conteudoRef} className="fc-resultado-wrap" />

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
              <LinhaCalculo sinal=" " label="Diferença salão"   value={relatorio.difSalao} />
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
            {observacao ? (
              <div className="fc-obs-screenshot">
                <span className="fc-obs-screenshot-label">Observação:</span>
                <span className="fc-obs-screenshot-texto">{observacao}</span>
              </div>
            ) : null}
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
          onChange={handleObservacao}
          rows={3}
        />
      </div>

      {/* ── Botões de Ação ── */}
      <div className="fc-acoes">
        <button className="btn btn--ghost" onClick={onVoltar}>
          ← Voltar e editar
        </button>
        <button className="btn btn--copiar" onClick={handleImprimir}>
          🖨️ Imprimir
        </button>
        <button className="btn btn--ghost" onClick={onNovoFechamento}>
          <IconRefresh /> Novo fechamento
        </button>
      </div>
    </div>
  );
});
