// supabase/functions/fechamentos/index.ts
// ─────────────────────────────────────────────────────────────
// Backend para fechamentos de caixa.
// O frontend NUNCA acessa o banco diretamente — tudo passa aqui.
// ─────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Não autenticado' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return json({ error: 'Token inválido' }, 401);
    }

    const body = await req.json();
    const { action } = body;

    // ── Criar fechamento ──────────────────────────────────────
    if (action === 'criar') {
      const {
        // Salão
        sistSalao, realSalao, excedente, difSalao,
        trocoInicial, maqSalao, dinheiroGaveta, maqRetirada,
        vendaRetirada, pixRetirada, pixRetiradaAuto,

        // Delivery
        sistDeliv, realDelivLiq, totalGasEnt, difDeliv,
        vendaWeb, pixWeb, pixWebAuto,
        vendaBundiA, pixBundiA, pixBundiAAuto,
        vendaBundiB, pixBundiB, pixBundiBAuto,

        // Geral
        totalGeral, dataFechamento, motoboys,
      } = body;

      if (!sistSalao || sistSalao <= 0) {
        return json({ error: 'Vendas do salão inválidas' }, 400);
      }

      const { data, error } = await supabase
        .from('fechamentos')
        .insert([{
          criado_por:       user.id,
          data_referencia:  dataFechamento,
          data_fechamento:  new Date().toISOString().split('T')[0],

          // Salão
          venda_sist:       sistSalao,
          troco_inicial:    trocoInicial    ?? 0,
          maq_salao:        maqSalao        ?? 0,
          dinheiro_gaveta:  dinheiroGaveta  ?? 0,
          excedente:        excedente       ?? 0,
          real_salao:       realSalao,
          dif_salao:        difSalao,
          maq_retirada:     maqRetirada     ?? 0,
          venda_retirada:   vendaRetirada   ?? 0,
          pix_retirada:     pixRetirada     ?? 0,
          pix_retirada_aut: pixRetiradaAuto ?? 0,

          // Delivery — totais
          sist_deliv:       sistDeliv       ?? 0,
          real_deliv_liq:   realDelivLiq,
          total_gas:        totalGasEnt     ?? 0,
          dif_deliv:        difDeliv,

          // Delivery — Web Cardápio
          venda_web:        vendaWeb        ?? 0,
          pix_web:          pixWeb          ?? 0,
          pix_web_aut:      pixWebAuto      ?? 0,

          // Delivery — Brendi A
          venda_brendi_a:   vendaBundiA     ?? 0,
          pix_brendi_a:     pixBundiA       ?? 0,
          pix_brendi_a_aut: pixBundiAAuto   ?? 0,

          // Delivery — Brendi B
          venda_brendi_b:   vendaBundiB     ?? 0,
          pix_brendi_b:     pixBundiB       ?? 0,
          pix_brendi_b_aut: pixBundiBAuto   ?? 0,

          // Legado: venda_app = brendi A + B somados (mantido para compatibilidade)
          venda_app:        (vendaBundiA ?? 0) + (vendaBundiB ?? 0),

          // Geral
          total_geral:      totalGeral,
          motoboys:         motoboys ?? [],
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar fechamento:', error);
        return json({ error: 'Erro ao salvar. Tente novamente.' }, 500);
      }

      return json({ ok: true, id: data.id });
    }

    // ── Listar fechamentos ────────────────────────────────────
    if (action === 'listar') {
      const pagina = Number(body.pagina ?? 0);
      const limite = Math.min(Number(body.limite ?? 20), 100);

      const { data: perfil } = await supabase
        .from('perfis')
        .select('perfil')
        .eq('id', user.id)
        .single();

      const isAdminOuGerente = perfil?.perfil === 'admin' || perfil?.perfil === 'gerente';

      let query = supabase
        .from('fechamentos_resumo')
        .select('*')
        .order('criado_em', { ascending: false })
        .range(pagina * limite, (pagina + 1) * limite - 1);

      if (!isAdminOuGerente) {
        query = query.eq('criado_por', user.id);
      }

      const { data, error } = await query;

      if (error) {
        return json({ error: 'Erro ao buscar fechamentos' }, 500);
      }

      return json({ fechamentos: data ?? [] });
    }

    // ── Deletar fechamento ────────────────────────────────────
    if (action === 'deletar') {
      const { id } = body;
      if (!id) return json({ error: 'ID do fechamento é obrigatório' }, 400);

      const { data: perfil } = await supabase
        .from('perfis')
        .select('perfil')
        .eq('id', user.id)
        .single();

      const isAdminOuGerente = perfil?.perfil === 'admin' || perfil?.perfil === 'gerente';

      const { data: fechamento } = await supabase
        .from('fechamentos')
        .select('criado_por, data_fechamento')
        .eq('id', id)
        .single();

      if (!fechamento) {
        return json({ error: 'Fechamento não encontrado' }, 404);
      }

      if (!isAdminOuGerente) {
        if (fechamento.criado_por !== user.id) {
          return json({ error: 'Você não pode deletar fechamentos de outros funcionários' }, 403);
        }
        const hoje = new Date().toISOString().split('T')[0];
        if (fechamento.data_fechamento !== hoje) {
          return json({ error: 'Você só pode deletar fechamentos do dia atual' }, 403);
        }
      }

      const { error: deleteError } = await supabase
        .from('fechamentos')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Erro ao deletar fechamento:', deleteError);
        return json({ error: 'Erro ao deletar. Tente novamente.' }, 500);
      }

      return json({ ok: true });
    }

    return json({ error: 'Ação desconhecida' }, 400);

  } catch (err) {
    console.error('Erro inesperado:', err);
    return json({ error: 'Erro interno do servidor' }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
