/**
 * Componente Principal: Fechamento
 * Coordena estado e renderização - ~150 linhas
 * Usa hook customizado e componentes reutilizáveis
 */

import React from 'react';
import { useFechamento } from '../../hooks/useFechamento';
import { Modal } from '../../components/Modal';
import { FormularioFechamento } from './FormularioFechamento';
import { ResultadoFechamento } from './ResultadoFechamento';
import './Fechamento.css';

export default function Fechamento() {
  const {
    // Estado
    etapa,
    aba,
    salao,
    delivery,
    motoboys,
    brendiAtivo,
    relatorio,
    erros,
    copiando,
    copiado,
    confirmarNovo,
    subtotais,
    // Setters
    setEtapa,
    setAba,
    setSalao,
    setDelivery,
    setMotoboys,
    setBrendiAtivo,
    setConfirmarNovo,
    // Refs
    resultadoRef,
    conteudoRef,
    // Métodos
    onTouchStart,
    onTouchEnd,
    calcular,
    copiarImagem,
    novoFechamento,
  } = useFechamento();

  return (
    <div className="fc-root">
      <main className="fc-main">
        {/* ── FORMULÁRIO ── */}
        {etapa === 'formulario' && (
          <FormularioFechamento
            aba={aba}
            onAbaChange={setAba}
            salao={salao}
            onSalaoChange={setSalao}
            delivery={delivery}
            onDeliveryChange={setDelivery}
            motoboys={motoboys}
            onMotoboysChange={setMotoboys}
            brendiAtivo={brendiAtivo}
            onBrendiAtivoChange={setBrendiAtivo}
            erros={erros}
            subtotais={subtotais}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onCalcular={calcular}
          />
        )}

        {/* ── RESULTADO ── */}
        {etapa === 'resultado' && relatorio && (
          <ResultadoFechamento
            resultadoRef={resultadoRef}
            conteudoRef={conteudoRef}
            relatorio={relatorio}
            motoboys={motoboys}
            copiando={copiando}
            copiado={copiado}
            onVoltar={() => setEtapa('formulario')}
            onCopiar={copiarImagem}
            onNovoFechamento={() => setConfirmarNovo(true)}
          />
        )}
      </main>

      {/* ── MODAL ── */}
      {confirmarNovo && (
        <Modal
          titulo="Iniciar novo fechamento?"
          mensagem="Os campos serão limpos. O fechamento atual já foi salvo."
          onConfirmar={novoFechamento}
          onCancelar={() => setConfirmarNovo(false)}
        />
      )}
    </div>
  );
}
