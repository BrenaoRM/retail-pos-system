// supabase/functions/criar-preferencia-mp/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  console.log('[criar-preferencia-mp] requisição recebida, método:', req.method)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
  const BASE_URL        = Deno.env.get('APP_BASE_URL')
  const SUPABASE_URL    = Deno.env.get('SUPABASE_URL')

  console.log('MP_ACCESS_TOKEN presente:', !!MP_ACCESS_TOKEN)
  console.log('APP_BASE_URL:', BASE_URL)

  if (!MP_ACCESS_TOKEN) {
    console.error('ERRO: MP_ACCESS_TOKEN ausente')
    return new Response(
      JSON.stringify({ error: 'MP_ACCESS_TOKEN não configurado.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!BASE_URL) {
    console.error('ERRO: APP_BASE_URL ausente')
    return new Response(
      JSON.stringify({ error: 'APP_BASE_URL não configurado.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // ── Lê o body de forma segura — supabase.functions.invoke pode
  //    enviar como texto ou como JSON dependendo da versão do SDK ──────
  let titulo: string | undefined
  let preco: number | undefined
  let userId: string | undefined
  let userEmail: string | undefined

  try {
    const rawText = await req.text()
    console.log('Body raw recebido:', rawText)

    if (rawText && rawText.trim() !== '') {
      const parsed = JSON.parse(rawText)
      titulo    = parsed.titulo
      preco     = parsed.preco
      userId    = parsed.userId
      userEmail = parsed.userEmail
    }
  } catch (parseErr) {
    console.error('Erro ao fazer parse do body:', parseErr.message)
    return new Response(
      JSON.stringify({ error: 'Body inválido: ' + parseErr.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log('Dados extraídos — userId:', userId, '| preco:', preco, '| email:', userEmail)

  if (!userId || !preco) {
    console.error('userId ou preco ausentes')
    return new Response(
      JSON.stringify({ error: 'userId e preco são obrigatórios' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const successUrl = `${BASE_URL}/mp-redirect.html?mp_status=approved&external_reference=${userId}`
    const failureUrl = `${BASE_URL}/mp-redirect.html?mp_status=failure&external_reference=${userId}`
    const pendingUrl = `${BASE_URL}/mp-redirect.html?mp_status=pending&external_reference=${userId}`

    console.log('successUrl:', successUrl)

    const preferencia = {
      items: [
        {
          id:          'bigburguer-pro-mensal',
          title:       titulo ?? 'Big Burguer Pro — Mensal',
          description: 'Acesso completo ao sistema de fechamento de caixa',
          quantity:    1,
          currency_id: 'BRL',
          unit_price:  Number(preco),
        },
      ],
      ...(userEmail ? { payer: { email: userEmail } } : {}),
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      auto_return:        'approved',
      external_reference: String(userId),
      expires:            true,
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      payment_methods: {
        installments: 1,
      },
      notification_url:     `${SUPABASE_URL}/functions/v1/mp-webhook`,
      statement_descriptor: 'BIGBURGUER PRO',
    }

    console.log('Chamando API Mercado Pago...')

    const resposta = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferencia),
    })

    const dados = await resposta.json()
    console.log('MP HTTP status:', resposta.status)
    console.log('MP resposta:', JSON.stringify(dados))

    if (!resposta.ok) {
      throw new Error(`Mercado Pago ${resposta.status}: ${JSON.stringify(dados)}`)
    }

    console.log('Preferência criada! init_point:', dados.init_point)

    return new Response(
      JSON.stringify({
        init_point:    dados.init_point,
        sandbox_point: dados.sandbox_init_point,
        preference_id: dados.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('ERRO ao criar preferência:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
