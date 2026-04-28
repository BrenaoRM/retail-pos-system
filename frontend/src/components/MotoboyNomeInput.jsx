/**
 * MotoboyNomeInput
 * Input com autocomplete para nome de entregadores.
 * Salva e busca nomes no banco de dados (Supabase).
 */

import React, { useState, useEffect, useRef } from 'react';
import { listarEntregadores, salvarEntregador, removerEntregador } from '../lib/api';

export function MotoboyNomeInput({ value, onChange, placeholder }) {
  const [aberto, setAberto]   = useState(false);
  const [nomes, setNomes]     = useState([]); // [{ id, nome }]
  const [carregando, setCarregando] = useState(false);
  const wrapRef = useRef(null);
  const jaCarregou = useRef(false);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function carregarNomes() {
    if (jaCarregou.current) return;
    setCarregando(true);
    try {
      const lista = await listarEntregadores();
      setNomes(lista);
      jaCarregou.current = true;
    } catch {
      // silencioso — não bloqueia o uso
    } finally {
      setCarregando(false);
    }
  }

  async function handleFocus() {
    setAberto(true);
    await carregarNomes();
  }

  async function handleBlur() {
    const nomeLimpo = value.trim();
    if (nomeLimpo.length < 2) return;

    // Só salva se for nome novo
    const jaExiste = nomes.some(n => n.nome === nomeLimpo);
    if (!jaExiste) {
      try {
        await salvarEntregador(nomeLimpo);
        // Atualiza lista local sem precisar recarregar tudo
        jaCarregou.current = false;
        const lista = await listarEntregadores();
        setNomes(lista);
        jaCarregou.current = true;
      } catch {
        // silencioso
      }
    }
  }

  async function handleDeletar(e, entregador) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await removerEntregador(entregador.id);
      setNomes(prev => prev.filter(n => n.id !== entregador.id));
    } catch {
      // silencioso
    }
  }

  function selecionarNome(nome) {
    onChange(nome);
    setAberto(false);
  }

  const sugestoes = nomes.filter(
    n => n.nome.toLowerCase().includes(value.toLowerCase()) && n.nome !== value.trim()
  );
  const nomeNovo = value.trim().length >= 2 && !nomes.some(n => n.nome === value.trim());
  const mostrarDropdown = aberto && (carregando || sugestoes.length > 0 || nomeNovo);

  return (
    <div className="motoboy-nome-wrap" ref={wrapRef}>
      <input
        className="motoboy-nome"
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoComplete="off"
      />

      {mostrarDropdown && (
        <div className="motoboy-sugestoes">
          {carregando && (
            <div className="motoboy-sugestao-hint">Carregando...</div>
          )}

          {!carregando && sugestoes.map(entregador => (
            <div
              key={entregador.id}
              className="motoboy-sugestao-item"
              onMouseDown={() => selecionarNome(entregador.nome)}
            >
              <span className="motoboy-sugestao-nome">{entregador.nome}</span>
              <button
                className="motoboy-sugestao-del"
                title="Remover nome salvo"
                onMouseDown={e => handleDeletar(e, entregador)}
              >
                ✕
              </button>
            </div>
          ))}

          {!carregando && nomeNovo && (
            <div className="motoboy-sugestao-hint">
              Será salvo ao confirmar "{value.trim()}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
