// src/contexts/AuthContext.jsx
// ─────────────────────────────────────────────────────────────────────
// Provê { user, perfil, loading, isAdmin, isGerente } para toda a app.
// Envolva <App> com <AuthProvider> no main.jsx.
// ─────────────────────────────────────────────────────────────────────
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getPerfil } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [perfil,  setPerfil]  = useState(null);
  const [loading, setLoading] = useState(true);

  const carregarPerfil = async (sessaoUser) => {
    if (!sessaoUser) { setPerfil(null); return; }
    try {
      const p = await getPerfil();
      setPerfil(p);
    } catch {
      setPerfil(null);
    }
  };

  useEffect(() => {
    // Sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      carregarPerfil(session?.user).finally(() => setLoading(false));
    });

    // Escuta mudanças de sessão (login/logout)
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
    isGerente:  perfil?.perfil === 'gerente',
    isFuncionario: perfil?.perfil === 'funcionario',
    planoAtivo: perfil?.plano_ativo === true,
    recarregarPerfil: () => carregarPerfil(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
};
