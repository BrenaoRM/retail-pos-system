/**
 * Componente Principal: Fechamento
 */

import React from 'react';
import { useFechamento } from '../../hooks/useFechamento';
import { Modal } from '../../components/Modal';
import Calculadora from '../../components/Calculadora/Calculadora';
import { FormularioFechamento } from './FormularioFechamento';
import { ResultadoFechamento } from './ResultadoFechamento';
import './Fechamento.css';

export default function Fechamento() {
  const {
    etapa, aba, salao, delivery, motoboys, brendiAtivo, relatorio, erros,
    copiando, copiado, confirmarNovo, subtotais,
    setEtapa, setAba, setSalao, setDelivery, setMotoboys, setBrendiAtivo,
    setConfirmarNovo,
    resultadoRef, conteudoRef,
    onTouchStart, onTouchEnd, calcular, copiarImagem, novoFechamento,
  } = useFechamento();

  return (
    <div className="fc-root">
      <div className="fc-layout">
        <main className="fc-main">
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

        {/* Calculadora (painel à direita no desktop, FAB no mobile) */}
        {etapa === 'formulario' && <Calculadora />}
      </div>

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