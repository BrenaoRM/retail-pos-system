// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [perfil,  setPerfil]  = useState(null);
  const [loading, setLoading] = useState(true);

  async function carregarPerfil(sessionUser) {
    if (!sessionUser) { setPerfil(null); return; }
    try {
      const { data, error } = await supabase.functions.invoke('perfil', {
        body: { action: 'get' },
      });
      setPerfil(error ? null : data);
    } catch {
      setPerfil(null);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      await carregarPerfil(session?.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      carregarPerfil(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // planoAtivo: true se plano_ativo=true E dentro do prazo (ou sem data = legado vitalício)
  const planoAtivo = useMemo(() => {
    if (!perfil?.plano_ativo) return false;
    if (!perfil.plano_expira_em) return true;
    return new Date(perfil.plano_expira_em) > new Date();
  }, [perfil]);

  // Memoizado para evitar re-renders em todos os consumidores do useAuth()
  const value = useMemo(() => ({
    user,
    perfil,
    loading,
    isAdmin:  perfil?.perfil === 'admin',
    planoAtivo,
    recarregarPerfil: () => carregarPerfil(user),
  }), [user, perfil, loading, planoAtivo]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve estar dentro de <AuthProvider>');
  return ctx;
}
