/**
 * Componente CalcAuto
 * Exibe valor calculado com flash ao mudar
 */

import React, { useState, useEffect, useRef } from 'react';
import { fmt } from '../lib/format';

export function CalcAuto({ label, value }) {
  const [flash, setFlash] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 500);
      prevRef.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className={`fc-calc-auto ${flash ? 'fc-calc-auto--flash' : ''}`}>
      <span className="fc-calc-label">{label}</span>
      <span className="fc-calc-valor">R$ {fmt(Math.max(0, value))}</span>
    </div>
  );
}
