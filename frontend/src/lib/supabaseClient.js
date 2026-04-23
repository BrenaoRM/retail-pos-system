// src/lib/supabaseClient.js
// ─────────────────────────────────────────────────────────────
// Instância única do cliente Supabase.
// Usado APENAS para auth e para chamar Edge Functions.
// O banco de dados nunca é acessado diretamente pelo frontend.
// ─────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    'Variáveis de ambiente ausentes.\n' +
    'Crie frontend/.env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(url, key);
