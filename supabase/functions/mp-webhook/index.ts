// supabase/functions/mp-webhook/index.ts
// Lida com eventos de pagamento único (Checkout Pro) E assinaturas (preapproval)

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

  const MP_TOKEN_CHECKOUT    = Deno.env.get('MP_ACCESS_TOKEN')               // Checkout Pro
  const MP_TOKEN_ASSINATURA  = Deno.env.get('MP_ACCESS_TOKEN_ASSINATURA')    // Assinaturas
  const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')
  const SERVICE_KEY          = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return new Response('Secrets ausentes', { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  try {
    const body = await req.json().catch(() => ({}))
    const url  = new URL(req.url)

    const topic  = body.type  ?? url.searchParams.get('topic') ?? url.searchParams.get('type')
    const dataId = body.data?.id ?? url.searchParams.get('id')

    console.log('[mp-webhook] topic:', topic, '| dataId:', dataId)

    // ── Assinatura: evento de autorização/cancelamento ────────────────
    if (topic === 'subscription_preapproval' && dataId && MP_TOKEN_ASSINATURA) {
      await handleAssinatura(dataId, MP_TOKEN_ASSINATURA, supabase)
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Assinatura: evento de pagamento recorrente ────────────────────
    if (topic === 'subscription_authorized_payment' && dataId && MP_TOKEN_ASSINATURA) {
      await handlePagamentoRecorrente(dataId, MP_TOKEN_ASSINATURA, supabase)
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Checkout Pro: pagamento único (mantém compatibilidade) ────────
    if (topic === 'payment' && dataId && MP_TOKEN_CHECKOUT) {
      await handlePagamentoUnico(dataId, MP_TOKEN_CHECKOUT, supabase)
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Evento ignorado:', topic)
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('ERRO no webhook:', err.message)
    // Sempre retorna 200 para o MP não reenviar infinitamente
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// ── Handler: assinatura criada / cancelada / pausada ─────────────────────────
async function handleAssinatura(assinaturaId: string, token: string, supabase: any) {
  const resp = await fetch(`https://api.mercadopago.com/preapproval/${assinaturaId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  const assinatura = await resp.json()

  const userId = assinatura.external_reference
  if (!userId) {
    console.error('external_reference ausente na assinatura')
    return
  }

  console.log('Assinatura status:', assinatura.status, '| userId:', userId)

  switch (assinatura.status) {
    case 'authorized': {
      // Assinatura ativa — calcula expiração para daqui 30 dias
      // (o MP renova automaticamente, mas guardamos a data como segurança)
      const expira = new Date()
      expira.setDate(expira.getDate() + 30)

      const { error } = await supabase
        .from('perfis')
        .update({
          plano_ativo:     true,
          plano_expira_em: expira.toISOString(),
          assinatura_id:   assinaturaId,
          atualizado_em:   new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error
      console.log('Assinatura ATIVADA:', userId, '| expira:', expira.toISOString())
      break
    }

    case 'cancelled':
    case 'paused': {
      // Cancelada ou pausada — mantém acesso até a data de expiração atual
      // Apenas marca que não renovará mais (plano_ativo = false)
      const { error } = await supabase
        .from('perfis')
        .update({
          plano_ativo:   false,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error
      console.log('Assinatura CANCELADA/PAUSADA:', userId)
      break
    }

    default:
      console.log('Status de assinatura ignorado:', assinatura.status)
  }
}

// ── Handler: pagamento recorrente cobrado ─────────────────────────────────────
async function handlePagamentoRecorrente(pagamentoId: string, token: string, supabase: any) {
  const resp = await fetch(
    `https://api.mercadopago.com/authorized_payments/${pagamentoId}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  )
  const pagamento = await resp.json()

  console.log('Pagamento recorrente status:', pagamento.status)

  // Busca a assinatura para pegar o external_reference (userId)
  const assinaturaId = pagamento.preapproval_id
  if (!assinaturaId) return

  const respAssinatura = await fetch(
    `https://api.mercadopago.com/preapproval/${assinaturaId}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  )
  const assinatura = await respAssinatura.json()
  const userId     = assinatura.external_reference

  if (!userId) return

  if (pagamento.status === 'processed') {
    // Pagamento recorrente aprovado — renova por mais 30 dias
    const expira = new Date()
    expira.setDate(expira.getDate() + 30)

    const { error } = await supabase
      .from('perfis')
      .update({
        plano_ativo:     true,
        plano_expira_em: expira.toISOString(),
        atualizado_em:   new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw error
    console.log('Plano RENOVADO:', userId, '| novo expira:', expira.toISOString())
  }
}

// ── Handler: pagamento único (Checkout Pro — mantém compatibilidade) ──────────
async function handlePagamentoUnico(pagamentoId: string, token: string, supabase: any) {
  const resp = await fetch(
    `https://api.mercadopago.com/v1/payments/${pagamentoId}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  )
  const pagamento = await resp.json()
  const userId    = pagamento.external_reference

  if (!userId) return

  console.log('Pagamento único status:', pagamento.status, '| userId:', userId)

  switch (pagamento.status) {
    case 'approved': {
      const expira = new Date()
      expira.setDate(expira.getDate() + 30)

      const { error } = await supabase
        .from('perfis')
        .update({
          plano_ativo:     true,
          plano_expira_em: expira.toISOString(),
          atualizado_em:   new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error
      console.log('Plano ATIVADO (único):', userId)
      break
    }
    case 'rejected':
    case 'cancelled':
    case 'refunded': {
      const { error } = await supabase
        .from('perfis')
        .update({
          plano_ativo:   false,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error
      console.log('Plano DESATIVADO (único):', userId)
      break
    }
  }
}
