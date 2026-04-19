// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [perfil,  setPerfil]  = useState(null);
  const [loading, setLoading] = useState(true);

  // Carrega perfil via Edge Function (sem acesso direto ao banco)
  async function carregarPerfil(sessionUser) {
    if (!sessionUser) { setPerfil(null); return; }
    try {
      const { data, error } = await supabase.functions.invoke('perfil', {
        body: { action: 'get' },
      });
      if (!error) setPerfil(data);
    } catch {
      setPerfil(null);
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
    loading,
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
