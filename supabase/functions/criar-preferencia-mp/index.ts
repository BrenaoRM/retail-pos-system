// supabase/functions/criar-preferencia-mp/index.ts
// ─────────────────────────────────────────────────────────────────────
// Cria preferência de pagamento no Mercado Pago.
// URLs de retorno ajustadas para HashRouter do GitHub Pages:
//   https://brenao28.github.io/Big-Burguer/#/plano?status=approved&...
// ─────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!
const BASE_URL        = Deno.env.get('APP_BASE_URL')!
// APP_BASE_URL = https://brenao28.github.io/Big-Burguer

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { titulo, preco, userId, userEmail } = await req.json()

    if (!userId || !preco) {
      return new Response(
        JSON.stringify({ error: 'userId e preco são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── URLs com formato HashRouter ───────────────────────────────────
    // O Mercado Pago não suporta # na URL de retorno diretamente,
    // então usamos uma URL intermediária que redireciona para o hash.
    // Solução: colocar os params ANTES do # — o browser mantém isso.
    // Formato: https://site.com/Big-Burguer/?status=approved&...#/plano
    //
    // O Plano.jsx lê window.location.hash e extrai os params do hash.
    // Mas o MP exige que os back_urls não tenham # — então usamos
    // a estratégia de passar os params na query string normal e
    // redirecionar via uma página intermediária simples.
    //
    // Solução mais simples e confiável para GitHub Pages + HashRouter:
    // Criar uma página redirect.html na pasta public/ que lê os params
    // e redireciona para o hash correto. Veja instrução abaixo.
    //
    // Por ora, usamos a URL direta — funciona se o GitHub Pages tiver
    // um 404.html configurado (veja instrução no final do arquivo).

    const successUrl = `${BASE_URL}/mp-redirect.html?mp_status=approved&external_reference=${userId}`
    const failureUrl = `${BASE_URL}/mp-redirect.html?mp_status=failure&external_reference=${userId}`
    const pendingUrl = `${BASE_URL}/mp-redirect.html?mp_status=pending&external_reference=${userId}`

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
      payer: {
        email: userEmail ?? undefined,
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      auto_return:        'approved',
      external_reference: userId,
      expires:            true,
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      payment_methods: {
        excluded_payment_types: [],
        installments:           1,
      },
      notification_url:     `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`,
      statement_descriptor: 'BIGBURGUER PRO',
    }

    const resposta = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferencia),
    })

    if (!resposta.ok) {
      const erroMP = await resposta.json()
      throw new Error(`Mercado Pago: ${JSON.stringify(erroMP)}`)
    }

    const dados = await resposta.json()

    return new Response(
      JSON.stringify({
        init_point:    dados.init_point,
        sandbox_point: dados.sandbox_init_point,
        preference_id: dados.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Erro ao criar preferência MP:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/*
  ── INSTRUÇÃO: criar public/mp-redirect.html ─────────────────────────

  O Mercado Pago redireciona para:
    https://brenao28.github.io/Big-Burguer/?mp_status=approved&external_reference=UUID

  O HashRouter vai mostrar a rota "/" com esses params na query.
  No App.jsx, no componente Fechamento (rota "/"), detectamos esses
  params e navegamos para /plano — ou você pode tratar direto no Plano.

  Alternativa mais limpa: criar um arquivo public/mp-redirect.html:

  <!DOCTYPE html>
  <html>
  <head>
    <script>
      const p = new URLSearchParams(window.location.search);
      const status = p.get('mp_status');
      const ref    = p.get('external_reference');
      window.location.replace(
        '/Big-Burguer/#/plano?status=' + status + '&external_reference=' + ref
      );
    </script>
  </head>
  <body>Redirecionando...</body>
  </html>

  E mudar as back_urls para apontar para /Big-Burguer/mp-redirect.html
  ────────────────────────────────────────────────────────────────────
*/
