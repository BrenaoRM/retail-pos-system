/**
 * Campo Monetário com Formatação pt-BR
 * Reutilizável em formulários
 */

import React, { useState, useEffect } from 'react';
import { fmt, parse } from '../lib/format';

export function Campo({ label, hint, value, onChange, erro }) {
  const [focused, setFocused] = useState(false);
  const [display, setDisplay] = useState('');

  useEffect(() => {
    if (!focused) setDisplay(value ? fmt(value) : '');
  }, [value, focused]);

  return (
    <div className="campo">
      <label className="campo-label">
        {label}
        {hint && <span className="campo-hint">{hint}</span>}
      </label>
      <div className={`campo-input ${erro ? 'campo-input--erro' : ''} ${focused ? 'campo-input--focused' : ''}`}>
        <span className="campo-prefix">R$</span>
        <input
          type="text"
          inputMode="decimal"
          value={display}
          placeholder="0,00"
          onFocus={() => {
            setFocused(true);
            setDisplay(value ? String(value).replace('.', ',') : '');
          }}
          onChange={e => {
            // Trata ponto como vírgula (teclado numérico do celular)
            const raw = e.target.value.replace('.', ',');
            setDisplay(raw);
            onChange(parse(raw));
          }}
          onBlur={() => {
            setFocused(false);
            setDisplay(value ? fmt(value) : '');
          }}
        />
      </div>
      {erro && <span className="campo-erro">{erro}</span>}
    </div>
  );
}
