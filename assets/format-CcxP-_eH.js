/**
 * Funções de formatação compartilhadas
 * Centraliza formatação de valores monetários em pt-BR
 */

/**
 * Formata um número como moeda brasileira (R$)
 * @param {number|string} value - Valor a formatar
 * @returns {string} Valor formatado ex: "1.234,56"
 */
const fmt = (v) => 
  (Number(v) || 0).toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

/**
 * Converte string formatada em pt-BR para número
 * @param {string} str - String no formato "1.234,56"
 * @returns {number} Valor numérico
 */
const parse = (s) => 
  parseFloat(String(s || '').replace(/\./g, '').replace(',', '.')) || 0;

export { fmt as f, parse as p };
