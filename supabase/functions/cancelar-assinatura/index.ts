// supabase/functions/cancelar-assinatura/index.ts
// Cancela a assinatura recorrente no Mercado Pago.
// O acesso continua até plano_expira_em — apenas não renova mais.

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN_ASSINATURA')
  const SUPABASE_URL    = Deno.env.get('SUPABASE_URL')
  const SERVICE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!MP_ACCESS_TOKEN || !SUPABASE_URL || !SERVICE_KEY) {
    return json({ error: 'Secrets não configurados.' }, 500)
  }

  // ── Valida o token do usuário logado ──────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Não autenticado.' }, 401)

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || !user) return json({ error: 'Token inválido.' }, 401)

  // ── Busca o perfil para confirmar que é gerente e pegar assinatura_id ──
  const { data: perfil, error: perfilError } = await supabase
    .from('perfis')
    .select('perfil, assinatura_id, plano_expira_em')
    .eq('id', user.id)
    .single()

  if (perfilError || !perfil) return json({ error: 'Perfil não encontrado.' }, 404)

  if (perfil.perfil !== 'gerente' && perfil.perfil !== 'admin') {
    return json({ error: 'Sem permissão.' }, 403)
  }

  if (!perfil.assinatura_id) {
    return json({ error: 'Nenhuma assinatura ativa encontrada.' }, 400)
  }

  try {
    // ── Cancela no Mercado Pago ───────────────────────────────────
    const respMP = await fetch(
      `https://api.mercadopago.com/preapproval/${perfil.assinatura_id}`,
      {
        method:  'PUT',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ status: 'cancelled' }),
      }
    )

    const dadosMP = await respMP.json()
    console.log('[cancelar-assinatura] MP status:', respMP.status, dadosMP.status)

    if (!respMP.ok) {
      throw new Error(`Mercado Pago ${respMP.status}: ${JSON.stringify(dadosMP)}`)
    }

    // ── Atualiza o Supabase: plano_ativo = false, mantém plano_expira_em ──
    // O usuário continua tendo acesso até a data de expiração já gravada.
    const { error: updateError } = await supabase
      .from('perfis')
      .update({
        plano_ativo:   false,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) throw updateError

    console.log('[cancelar-assinatura] cancelado com sucesso para:', user.id)

    return json({
      ok:              true,
      plano_expira_em: perfil.plano_expira_em,
    })

  } catch (err) {
    console.error('[cancelar-assinatura] ERRO:', err.message)
    return json({ error: err.message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
