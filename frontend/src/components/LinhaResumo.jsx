/**
 * Componente LinhaResumo
 * Exibe linha com label e valor formatado
 */

import { fmt } from '../lib/format';

export function LinhaResumo({ label, value, destaque, sub }) {
  return (
    <div className={`linha-resumo ${destaque ? 'linha-resumo--destaque' : ''} ${sub ? 'linha-resumo--sub' : ''}`}>
      <span>{label}</span>
      <span>R$ {fmt(value)}</span>
    </div>
  );
}
