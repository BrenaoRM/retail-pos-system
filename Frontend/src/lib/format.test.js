/**
 * Testes Unitários - format.js
 * Teste das funções de formatação de moeda pt-BR
 */

import { fmt, parse } from '../format';

describe('format.js - Funções de Formatação', () => {
  describe('fmt - Formatação de Números', () => {
    test('deve formatar número inteiro com duas casas decimais', () => {
      expect(fmt(100)).toBe('100,00');
    });

    test('deve formatar número com decimais', () => {
      expect(fmt(1234.56)).toBe('1.234,56');
    });

    test('deve formatar números grandes com separador de milhares', () => {
      expect(fmt(123456.78)).toBe('123.456,78');
    });

    test('deve formatar número zero', () => {
      expect(fmt(0)).toBe('0,00');
    });

    test('deve formatar número pequeno com decimais', () => {
      expect(fmt(0.5)).toBe('0,50');
    });

    test('deve formatar número negativo (retorna 0)', () => {
      expect(fmt(-50)).toBe('0,00');
    });

    test('deve formatar string numérica', () => {
      expect(fmt('1234.56')).toBe('1.234,56');
    });

    test('deve formatar undefined como zero', () => {
      expect(fmt(undefined)).toBe('0,00');
    });

    test('deve formatar null como zero', () => {
      expect(fmt(null)).toBe('0,00');
    });

    test('deve formatar string vazia como zero', () => {
      expect(fmt('')).toBe('0,00');
    });
  });

  describe('parse - Conversão de String para Número', () => {
    test('deve converter string formatada em número', () => {
      expect(parse('1.234,56')).toBe(1234.56);
    });

    test('deve converter número simples', () => {
      expect(parse('100,50')).toBe(100.5);
    });

    test('deve converter zero', () => {
      expect(parse('0,00')).toBe(0);
    });

    test('deve converter string vazia como zero', () => {
      expect(parse('')).toBe(0);
    });

    test('deve converter undefined como zero', () => {
      expect(parse(undefined)).toBe(0);
    });

    test('deve converter null como zero', () => {
      expect(parse(null)).toBe(0);
    });

    test('deve ignorar múltiplos pontos', () => {
      expect(parse('1.234.567,89')).toBe(1234567.89);
    });

    test('deve remover pontos separadores', () => {
      expect(parse('123.456,78')).toBe(123456.78);
    });

    test('deve lidar com vírgula como decimal', () => {
      expect(parse('10,5')).toBe(10.5);
    });

    test('deve retornar 0 para string inválida', () => {
      expect(parse('abc')).toBe(0);
    });
  });

  describe('Roundtrip - fmt(valor) -> parse(resultado)', () => {
    test('deve preservar valor original em roundtrip', () => {
      const original = 1234.56;
      const formatado = fmt(original);
      const parseado = parse(formatado);
      expect(parseado).toBe(original);
    });

    test('deve preservar zero em roundtrip', () => {
      const original = 0;
      const formatado = fmt(original);
      const parseado = parse(formatado);
      expect(parseado).toBe(original);
    });

    test('deve preservar número com muitas casas decimais', () => {
      const original = 12345.67;
      const formatado = fmt(original);
      const parseado = parse(formatado);
      expect(parseado).toBeCloseTo(original, 2);
    });
  });
});
