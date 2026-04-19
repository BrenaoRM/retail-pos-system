// src/lib/api.js
// ─────────────────────────────────────────────────────────────
// Camada de API: todo acesso ao backend passa por aqui.
// O frontend nunca fala diretamente com o banco de dados.
// ─────────────────────────────────────────────────────────────

import { supabase } from './supabaseClient';

// ── Helpers ──────────────────────────────────────────────────

/**
 * Chama uma Edge Function do Supabase com autenticação automática.
 * @param {string} fn   Nome da função (ex: 'fechamentos')
 * @param {object} body Payload JSON
 */
async function callFunction(fn, body = {}) {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) throw new Error(error.message || 'Erro na requisição');
  return data;
}

// ── Auth ─────────────────────────────────────────────────────

/** Login com email + senha */
export async function login(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });
  if (error) throw error;
  return data;
}

/** Criar conta nova */
export async function registrar(email, senha, nome) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome } },
  });
  if (error) throw error;
  return data;
}

/** Logout */
export async function logout() {
  await supabase.auth.signOut();
}

/** Recuperação de senha por email */
export async function recuperarSenha(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

// ── Fechamentos ───────────────────────────────────────────────

/**
 * Registra um novo fechamento de caixa.
 * Passa pelo backend (Edge Function) que valida e salva.
 */
export async function criarFechamento(payload) {
  return callFunction('fechamentos', { action: 'criar', ...payload });
}

/**
 * Lista os fechamentos do usuário logado.
 * O backend aplica RLS — admin vê todos, funcionário só os próprios.
 */
export async function listarFechamentos({ pagina = 0, limite = 20 } = {}) {
  return callFunction('fechamentos', { action: 'listar', pagina, limite });
}
