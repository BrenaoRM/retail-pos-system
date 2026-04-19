// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null);
  const [perfil,       setPerfil]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  // perfilLoading controla separadamente o carregamento do perfil
  // para evitar que o app renderize antes de saber o plano do usuário
  const [perfilLoading, setPerfilLoading] = useState(false);

  async function carregarPerfil(sessionUser) {
    if (!sessionUser) { setPerfil(null); return; }
    setPerfilLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('perfil', {
        body: { action: 'get' },
      });
      if (!error) setPerfil(data);
      else setPerfil(null);
    } catch {
      setPerfil(null);
    } finally {
      setPerfilLoading(false);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      carregarPerfil(session?.user).finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      carregarPerfil(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    perfil,
    // loading = true enquanto a sessão E o perfil ainda não foram resolvidos
    loading: loading || perfilLoading,
    isAdmin:    perfil?.perfil === 'admin',
    planoAtivo: perfil?.plano_ativo === true,
    recarregarPerfil: () => carregarPerfil(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve estar dentro de <AuthProvider>');
  return ctx;
}
