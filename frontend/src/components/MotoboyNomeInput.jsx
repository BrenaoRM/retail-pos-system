/**
 * MotoboyNomeInput
 * Input com autocomplete para nome de entregadores.
 * Salva nomes novos no localStorage e permite apagar os salvos.
 */

import React, { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'bb_nomes_motoboys';

function getNomesSalvos() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function salvarNome(nome) {
  const n = nome.trim();
  if (n.length < 2) return;
  const lista = getNomesSalvos();
  if (!lista.includes(n)) {
    lista.push(n);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }
}

function removerNome(nome) {
  const lista = getNomesSalvos().filter(n => n !== nome);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

export function MotoboyNomeInput({ value, onChange, placeholder }) {
  const [aberto, setAberto]       = useState(false);
  const [nomes, setNomes]         = useState([]);
  const wrapRef                   = useRef(null);

  // fecha dropdown ao clicar fora
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sugestoes = nomes.filter(
    n => n.toLowerCase().includes(value.toLowerCase()) && n !== value.trim()
  );

  // nome digitado é novo (ainda não salvo) e tem tamanho suficiente
  const nomeNovo = value.trim().length >= 2 && !nomes.includes(value.trim());

  const mostrarDropdown = aberto && (sugestoes.length > 0 || nomeNovo);

  function handleFocus() {
    setNomes(getNomesSalvos());
    setAberto(true);
  }

  function handleBlur() {
    // salva o nome ao sair do campo
    if (value.trim().length >= 2) {
      salvarNome(value.trim());
      setNomes(getNomesSalvos());
    }
  }

  function selecionarNome(nome) {
    onChange(nome);
    setAberto(false);
  }

  function handleDeletar(e, nome) {
    e.preventDefault();
    e.stopPropagation();
    removerNome(nome);
    setNomes(getNomesSalvos());
  }

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
          {sugestoes.map(nome => (
            <div
              key={nome}
              className="motoboy-sugestao-item"
              onMouseDown={() => selecionarNome(nome)}
            >
              <span className="motoboy-sugestao-nome">{nome}</span>
              <button
                className="motoboy-sugestao-del"
                title="Remover nome salvo"
                onMouseDown={e => handleDeletar(e, nome)}
              >
                ✕
              </button>
            </div>
          ))}

          {nomeNovo && (
            <div className="motoboy-sugestao-hint">
              Pressione Tab ou clique fora para salvar "{value.trim()}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
