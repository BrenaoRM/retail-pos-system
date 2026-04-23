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
    if (!authHeader) return json({ error: 'Não autenticado' }, 401);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) return json({ error: 'Token inválido' }, 401);

    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) return json({ error: 'Perfil não encontrado' }, 404);

    // Se for funcionário, herda o plano do gerente
    if (data.perfil === 'funcionario' && data.gerente_id) {
      const { data: gerente } = await supabase
        .from('perfis')
        .select('plano_ativo, plano_expira_em')
        .eq('id', data.gerente_id)
        .single();

      if (gerente) {
        data.plano_ativo     = gerente.plano_ativo;
        data.plano_expira_em = gerente.plano_expira_em;
      }
    }

    return json(data);

  } catch (err) {
    console.error(err);
    return json({ error: 'Erro interno' }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}