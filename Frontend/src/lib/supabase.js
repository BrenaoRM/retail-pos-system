// src/lib/supabase.js
// ─────────────────────────────────────────────────────────────────────
// Instância única do cliente Supabase.
// Crie um arquivo .env na raiz do projeto com:
//   VITE_SUPABASE_URL=https://XXXXX.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJ...
// ─────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Faltam variáveis de ambiente.\n' +
    'Crie um arquivo .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─────────────────────────────────────────────────────────────────────
// AUTH HELPERS
// ─────────────────────────────────────────────────────────────────────

/** Retorna sessão atual */
export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

/** Retorna perfil completo do usuário logado */
export const getPerfil = async () => {
  const session = await getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (error) throw error;
  return data;
};

/** Login com email + senha */
export const login = async (email, senha) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) throw error;
  return data;
};

/** Logout */
export const logout = async () => {
  await supabase.auth.signOut();
};

/** Registro de novo usuário (admin cria conta para funcionário) */
export const registrarFuncionario = async ({ email, senha, nome, perfil = 'funcionario' }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome, perfil } },
  });
  if (error) throw error;
  return data;
};

/** Recuperação de senha */
export const recuperarSenha = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/nova-senha`,
  });
  if (error) throw error;
};

// ─────────────────────────────────────────────────────────────────────
// FECHAMENTOS
// ─────────────────────────────────────────────────────────────────────

/** Salva um novo fechamento no banco */
export const salvarFechamento = async (relatorio, userId) => {
  const { data, error } = await supabase
    .from('fechamentos')
    .insert([{
      criado_por:      userId,
      data_referencia: relatorio.dataFechamento,
      data_fechamento: new Date().toISOString().split('T')[0],
      venda_sist:      relatorio.sistSalao,
      troco_inicial:   relatorio.trocoInicial ?? 0,
      maq_salao:       relatorio.maqSalao ?? 0,
      dinheiro_gaveta: relatorio.dinheiroGaveta ?? 0,
      excedente:       relatorio.excedente,
      real_salao:      relatorio.realSalao,
      dif_salao:       relatorio.difSalao,
      venda_web:       relatorio.vendaWeb ?? 0,
      venda_app:       relatorio.vendaApp ?? 0,
      maq_retirada:    relatorio.maqRetirada ?? 0,
      total_gas:       relatorio.totalGasEnt,
      real_deliv_liq:  relatorio.realDelivLiq,
      dif_deliv:       relatorio.difDeliv,
      total_geral:     relatorio.totalGeral,
      motoboys:        relatorio.motoboys ?? [],
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

/** Busca fechamentos (admin/gerente = todos; funcionário = só os próprios) */
export const buscarFechamentos = async ({ limite = 50, pagina = 0 } = {}) => {
  const { data, error } = await supabase
    .from('fechamentos_resumo')
    .select('*')
    .order('criado_em', { ascending: false })
    .range(pagina * limite, (pagina + 1) * limite - 1);
  if (error) throw error;
  return data;
};

/** Deleta um fechamento (só admin) */
export const deletarFechamento = async (id) => {
  const { error } = await supabase.from('fechamentos').delete().eq('id', id);
  if (error) throw error;
};

// ─────────────────────────────────────────────────────────────────────
// FUNCIONÁRIOS (só admin)
// ─────────────────────────────────────────────────────────────────────

/** Lista todos os perfis */
export const listarFuncionarios = async () => {
  const { data, error } = await supabase
    .from('perfis')
    .select('*')
    .order('criado_em', { ascending: true });
  if (error) throw error;
  return data;
};

/** Ativa ou desativa um funcionário */
export const toggleFuncionario = async (id, ativo) => {
  const { error } = await supabase
    .from('perfis')
    .update({ ativo })
    .eq('id', id);
  if (error) throw error;
};

/** Atualiza perfil/role de um usuário */
export const atualizarPerfil = async (id, campos) => {
  const { error } = await supabase
    .from('perfis')
    .update(campos)
    .eq('id', id);
  if (error) throw error;
};
