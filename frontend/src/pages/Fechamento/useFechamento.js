/**
 * Hook Customizado: Lógica de Fechamento
 * Centraliza estado, cálculos e persistência
 */

import { useState, useEffect, useRef, useContext, useCallback, useMemo } from 'react';
import { criarFechamento } from '../../lib/api';
import { ToastContext } from '../../App';

// ── Constantes ────────────────────────────────────────────────
export const SALAO_VAZIO = {
  vendaSist: 0,
  inicial: 0,
  maq: 0,
  din: 0,
  excedente: 0,
  notinhas: 0,
  vendaRetirada: 0,
  pixRetirada: 0,
  maqRetirada: 0,
  abastecimento: 0,
};

export const DELIVERY_VAZIO = {
  vendaWeb: 0,
  pixWeb: 0,
  vendaBundiA: 0,
  pixBundiA: 0,
  vendaBundiB: 0,
  pixBundiB: 0,
};

export const MOTOBOY_NOVO = (n) => ({
  nome: `Entregador ${n}`,
  qtd: 0,
  maq: 0,
  din: 0,
});

const STORAGE_KEY = 'fechamento_rascunho';

// ── Funções Helper ────────────────────────────────────────────
function dataReferencia() {
  const agora = new Date();
  const base =
    agora.getHours() < 17
      ? new Date(agora.setDate(agora.getDate() - 1))
      : agora;
  return base.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function salvarRascunho(data) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function carregarRascunho() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── Hook Principal ───────────────────────────────────────────
export function useFechamento() {
  const toast = useContext(ToastContext);

  // carregarRascunho só na inicialização — não recalcula a cada render
  const [etapa, setEtapa] = useState('formulario');
  const [aba, setAba] = useState('salao');
  const [salao, setSalao] = useState(() => carregarRascunho()?.salao || SALAO_VAZIO);
  const [delivery, setDelivery] = useState(() => carregarRascunho()?.delivery || DELIVERY_VAZIO);
  const [motoboys, setMotoboys] = useState(() => carregarRascunho()?.motoboys || [MOTOBOY_NOVO(1)]);
  const [brendiAtivo, setBrendiAtivo] = useState('A');
  const [relatorio, setRelatorio] = useState(null);
  const [erros, setErros] = useState({});
  const [copiando, setCopiando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [confirmarNovo, setConfirmarNovo] = useState(false);
  const [observacao, setObservacao] = useState('');

  // Refs
  const toque = useRef(null);
  const resultadoRef = useRef(null);
  const conteudoRef = useRef(null);

  // Persistência
  useEffect(() => {
    if (etapa === 'formulario') {
      salvarRascunho({ salao, delivery, motoboys });
    }
  }, [salao, delivery, motoboys, etapa]);

  // Scroll automático ao resultado
  useEffect(() => {
    if (etapa === 'resultado' && resultadoRef.current) {
      setTimeout(
        () =>
          resultadoRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          }),
        100
      );
    }
  }, [etapa]);

  // ── Subtotais para toggle — memoizado para não recalcular a cada render ──
  const subtotais = useMemo(() => ({
    salao:
      salao.maq +
      salao.maqRetirada +
      Math.max(0, salao.din - salao.inicial) +
      salao.excedente,
    delivery:
      delivery.vendaWeb -
      delivery.pixWeb +
      delivery.vendaBundiA -
      delivery.pixBundiA +
      delivery.vendaBundiB -
      delivery.pixBundiB,
  }), [salao, delivery]);

  // ── Touch para navegação de abas ───────────────────────────
  const onTouchStart = useCallback((e) => {
    toque.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (!toque.current) return;
    const diff = toque.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 50) return;

    const abas = ['salao', 'delivery'];
    setAba((prev) => {
      const idx = abas.indexOf(prev);
      if (diff > 0 && idx < abas.length - 1) return abas[idx + 1];
      if (diff < 0 && idx > 0) return abas[idx - 1];
      return prev;
    });

    toque.current = null;
  }, []);

  // ── Manipulação de Motoboys ────────────────────────────────
  const editarMotoboy = useCallback((i, campo, val) => {
    setMotoboys((prev) => {
      const next = [...prev];
      next[i] = {
        ...next[i],
        [campo]: campo === 'nome' ? val : Number(val) || 0,
      };
      return next;
    });
  }, []);

  const addMotoboy = useCallback(() => {
    setMotoboys((p) => [...p, MOTOBOY_NOVO(p.length + 1)]);
  }, []);

  const removeMotoboy = useCallback(() => {
    setMotoboys((p) => (p.length > 1 ? p.slice(0, -1) : p));
  }, []);

  // ── Validação ──────────────────────────────────────────────
  const validar = useCallback(() => {
    const e = {};

    if (!salao.vendaSist || salao.vendaSist <= 0) {
      e.vendaSist = 'Informe as vendas do salão';
    }

    const totalDelivery =
      delivery.vendaWeb +
      delivery.vendaBundiA +
      delivery.vendaBundiB;

    if (totalDelivery <= 0) {
      e.vendaDelivery = 'Informe ao menos uma venda de delivery';
    }

    setErros(e);
    return Object.keys(e).length === 0;
  }, [salao.vendaSist, delivery.vendaWeb, delivery.vendaBundiA, delivery.vendaBundiB]);

  // ── Cálculo Principal ──────────────────────────────────────
  const calcular = useCallback(async () => {
    if (!validar()) return;

    const pixRetiradaAuto = salao.vendaRetirada - salao.pixRetirada;
    const totalVendasSalao = salao.vendaSist + pixRetiradaAuto;
    const realSalao =
      salao.din -
      salao.inicial +
      salao.maq +
      salao.maqRetirada +
      salao.notinhas +
      salao.abastecimento -
      salao.excedente;
    const difSalao = realSalao - totalVendasSalao;

    const pixWebAuto = delivery.vendaWeb - delivery.pixWeb;
    const pixBundiAAuto = delivery.vendaBundiA - delivery.pixBundiA;
    const pixBundiBAuto = delivery.vendaBundiB - delivery.pixBundiB;
    const sistDeliv = pixWebAuto + pixBundiAAuto + pixBundiBAuto;

    const totalMaq = motoboys.reduce((s, m) => s + m.maq, 0);
    const totalDin = motoboys.reduce((s, m) => s + m.din, 0);
    const realDelivLiq = totalMaq + totalDin;
    const difDeliv = realDelivLiq - sistDeliv;

    const dados = {
      sistSalao: salao.vendaSist,
      realSalao,
      excedente: salao.excedente,
      notinhas: salao.notinhas,
      abastecimento: salao.abastecimento,
      difSalao,
      totalVendasSalao,
      pixRetiradaAuto,
      vendaRetirada: salao.vendaRetirada,
      pixRetirada: salao.pixRetirada,
      maqRetirada: salao.maqRetirada,
      vendaWeb: delivery.vendaWeb,
      pixWeb: delivery.pixWeb,
      pixWebAuto,
      vendaBundiA: delivery.vendaBundiA,
      pixBundiA: delivery.pixBundiA,
      pixBundiAAuto,
      vendaBundiB: delivery.vendaBundiB,
      pixBundiB: delivery.pixBundiB,
      pixBundiBAuto,
      sistDeliv,
      realDelivLiq,
      difDeliv,
      totalGeral: difSalao + difDeliv,
      dataFechamento: dataReferencia(),
      observacao,
      motoboys,
      trocoInicial: salao.inicial,
      maqSalao: salao.maq,
      dinheiroGaveta: salao.din,
    };

    setRelatorio(dados);
    setEtapa('resultado');

    try {
      await criarFechamento(dados);
      toast?.('Fechamento salvo com sucesso!', 'ok');
    } catch {
      toast?.('Não foi possível salvar no servidor.', 'erro');
    }
  }, [salao, delivery, motoboys, observacao, validar, toast]);

  // ── Copiar Imagem para Clipboard ───────────────────────────
  const copiarImagem = useCallback(async () => {
    const el = conteudoRef.current;
    if (!el) return;

    setCopiando(true);

    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(el, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopiado(true);
          toast?.('Imagem copiada!', 'ok');
          setTimeout(() => setCopiado(false), 3000);
        } catch {
          const url = URL.createObjectURL(blob);
          Object.assign(document.createElement('a'), {
            href: url,
            download: 'fechamento.png',
          }).click();
          URL.revokeObjectURL(url);
        } finally {
          setCopiando(false);
        }
      });
    } catch {
      setCopiando(false);
    }
  }, [toast]);

  // ── Novo Fechamento ───────────────────────────────────────
  const novoFechamento = useCallback(() => {
    setSalao(SALAO_VAZIO);
    setDelivery(DELIVERY_VAZIO);
    setMotoboys([MOTOBOY_NOVO(1)]);
    setRelatorio(null);
    setErros({});
    setObservacao('');
    setEtapa('formulario');
    setAba('salao');
    setConfirmarNovo(false);

    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return {
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
    setErros,
    setConfirmarNovo,
    observacao,
    setObservacao,

    // Refs
    resultadoRef,
    conteudoRef,

    // Métodos
    onTouchStart,
    onTouchEnd,
    editarMotoboy,
    addMotoboy,
    removeMotoboy,
    calcular,
    copiarImagem,
    novoFechamento,
  };
}
