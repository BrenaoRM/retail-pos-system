/**
 * Testes Unitários - useFechamento Hook
 * Teste da lógica de negócio centralizada
 */

import { renderHook, act } from '@testing-library/react';
import { useFechamento, SALAO_VAZIO, DELIVERY_VAZIO, MOTOBOY_NOVO } from '../hooks/useFechamento';

describe('useFechamento - Hook de Lógica', () => {
  describe('Estado Inicial', () => {
    test('deve inicializar com valores vazios', () => {
      const { result } = renderHook(() => useFechamento());

      expect(result.current.etapa).toBe('formulario');
      expect(result.current.aba).toBe('salao');
      expect(result.current.salao).toEqual(SALAO_VAZIO);
      expect(result.current.delivery).toEqual(DELIVERY_VAZIO);
      expect(result.current.motoboys.length).toBe(1);
    });

    test('deve ter refs inicializadas', () => {
      const { result } = renderHook(() => useFechamento());

      expect(result.current.resultadoRef).toBeDefined();
      expect(result.current.conteudoRef).toBeDefined();
    });

    test('deve ter métodos disponíveis', () => {
      const { result } = renderHook(() => useFechamento());

      expect(typeof result.current.onTouchStart).toBe('function');
      expect(typeof result.current.onTouchEnd).toBe('function');
      expect(typeof result.current.editarMotoboy).toBe('function');
      expect(typeof result.current.addMotoboy).toBe('function');
      expect(typeof result.current.removeMotoboy).toBe('function');
      expect(typeof result.current.calcular).toBe('function');
      expect(typeof result.current.copiarImagem).toBe('function');
      expect(typeof result.current.novoFechamento).toBe('function');
    });
  });

  describe('Manipulação de Motoboys', () => {
    test('deve adicionar novo motoboy', () => {
      const { result } = renderHook(() => useFechamento());

      expect(result.current.motoboys.length).toBe(1);

      act(() => {
        result.current.addMotoboy();
      });

      expect(result.current.motoboys.length).toBe(2);
      expect(result.current.motoboys[1].nome).toBe('Entregador 2');
    });

    test('deve remover último motoboy se houver mais de um', () => {
      const { result } = renderHook(() => useFechamento());

      act(() => {
        result.current.addMotoboy();
      });

      expect(result.current.motoboys.length).toBe(2);

      act(() => {
        result.current.removeMotoboy();
      });

      expect(result.current.motoboys.length).toBe(1);
    });

    test('não deve remover único motoboy', () => {
      const { result } = renderHook(() => useFechamento());

      expect(result.current.motoboys.length).toBe(1);

      act(() => {
        result.current.removeMotoboy();
      });

      expect(result.current.motoboys.length).toBe(1);
    });

    test('deve editar dados do motoboy', () => {
      const { result } = renderHook(() => useFechamento());

      act(() => {
        result.current.editarMotoboy(0, 'nome', 'João Silva');
        result.current.editarMotoboy(0, 'qtd', 5);
        result.current.editarMotoboy(0, 'maq', 150.5);
      });

      expect(result.current.motoboys[0].nome).toBe('João Silva');
      expect(result.current.motoboys[0].qtd).toBe(5);
      expect(result.current.motoboys[0].maq).toBe(150.5);
    });
  });

  describe('Alteração de Abas', () => {
    test('deve alternar entre abas', () => {
      const { result } = renderHook(() => useFechamento());

      expect(result.current.aba).toBe('salao');

      act(() => {
        result.current.setAba('delivery');
      });

      expect(result.current.aba).toBe('delivery');

      act(() => {
        result.current.setAba('salao');
      });

      expect(result.current.aba).toBe('salao');
    });
  });

  describe('Cálculo de Subtotais', () => {
    test('deve calcular subtotais corretamente', () => {
      const { result } = renderHook(() => useFechamento());

      act(() => {
        result.current.setSalao({
          ...result.current.salao,
          maq: 100,
          din: 500,
          inicial: 200,
        });
      });

      expect(result.current.subtotais.salao).toBe(400); // 100 + 0 + (500-200) + 0
    });

    test('subtotais devem ser atualizados ao mudar delivery', () => {
      const { result } = renderHook(() => useFechamento());

      act(() => {
        result.current.setDelivery({
          ...result.current.delivery,
          vendaWeb: 500,
          pixWeb: 100,
        });
      });

      expect(result.current.subtotais.delivery).toBe(400); // 500-100
    });
  });

  describe('Novo Fechamento', () => {
    test('deve limpar todos os dados', () => {
      const { result } = renderHook(() => useFechamento());

      // Modificar dados
      act(() => {
        result.current.setSalao({ ...SALAO_VAZIO, vendaSist: 1000 });
        result.current.setEtapa('resultado');
      });

      expect(result.current.salao.vendaSist).toBe(1000);
      expect(result.current.etapa).toBe('resultado');

      // Novo fechamento
      act(() => {
        result.current.novoFechamento();
      });

      expect(result.current.salao).toEqual(SALAO_VAZIO);
      expect(result.current.delivery).toEqual(DELIVERY_VAZIO);
      expect(result.current.etapa).toBe('formulario');
      expect(result.current.aba).toBe('salao');
    });
  });

  describe('Constantes', () => {
    test('SALAO_VAZIO deve ter todos os campos', () => {
      expect(SALAO_VAZIO).toHaveProperty('vendaSist', 0);
      expect(SALAO_VAZIO).toHaveProperty('inicial', 0);
      expect(SALAO_VAZIO).toHaveProperty('maq', 0);
      expect(SALAO_VAZIO).toHaveProperty('din', 0);
      expect(SALAO_VAZIO).toHaveProperty('excedente', 0);
      expect(SALAO_VAZIO).toHaveProperty('vendaRetirada', 0);
      expect(SALAO_VAZIO).toHaveProperty('pixRetirada', 0);
      expect(SALAO_VAZIO).toHaveProperty('maqRetirada', 0);
    });

    test('DELIVERY_VAZIO deve ter todos os campos', () => {
      expect(DELIVERY_VAZIO).toHaveProperty('vendaWeb', 0);
      expect(DELIVERY_VAZIO).toHaveProperty('pixWeb', 0);
      expect(DELIVERY_VAZIO).toHaveProperty('vendaBundiA', 0);
      expect(DELIVERY_VAZIO).toHaveProperty('pixBundiA', 0);
      expect(DELIVERY_VAZIO).toHaveProperty('vendaBundiB', 0);
      expect(DELIVERY_VAZIO).toHaveProperty('pixBundiB', 0);
    });

    test('MOTOBOY_NOVO deve criar objeto correto', () => {
      const moto = MOTOBOY_NOVO(1);
      expect(moto).toEqual({
        nome: 'Entregador 1',
        qtd: 0,
        maq: 0,
        din: 0,
        gas: 0,
      });
    });
  });
});
