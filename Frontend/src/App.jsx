// src/App.jsx
import React from 'react';
import {
  HashRouter, Routes, Route, Navigate,
  useNavigate, useLocation,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { logout } from './lib/api';
import Login      from './pages/Login/Login';
import Fechamento  from './pages/Fechamento/Fechamento';
import Historico   from './pages/Historico/Historico';
import Plano       from './pages/Plano/Plano';

// ── Guarda de rota ────────────────────────────────────────────
function RotaProtegida({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Carregando />;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

// ── Guarda de plano ───────────────────────────────────────────
// Se o usuário está logado mas não tem plano ativo,
// redireciona para /plano (exceto se já estiver lá).
function GuardaPlano({ children }) {
  const { user, perfil, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Carregando />;
  if (!user)   return <Navigate to="/login" replace />;

  // Conta sem plano → redireciona para assinar (exceto se já está em /plano)
  if (perfil && !perfil.plano_ativo && location.pathname !== '/plano') {
    return <Navigate to="/plano" replace />;
  }

  return children;
}

// ── Navbar ────────────────────────────────────────────────────
function Navbar() {
  const { user, planoAtivo, loading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  if (loading || !user || location.pathname === '/login') return null;

  const ativo = (path) => location.pathname === path;

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(11,17,32,0.97)', backdropFilter: 'blur(8px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      padding: '0 16px', display: 'flex', alignItems: 'center',
      height: 52, gap: 4,
      fontFamily: "'IBM Plex Sans', 'Inter', system-ui, sans-serif",
    }}>
      <span
        onClick={() => navigate('/')}
        style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f1f5f9', marginRight: 'auto', cursor: 'pointer' }}
      >
        🍔 Big Burguer
      </span>

      {[
        { path: '/',          label: 'Caixa'    },
        { path: '/historico', label: 'Histórico' },
        { path: '/plano',     label: planoAtivo ? '⭐ Pro' : 'Plano' },
      ].map(({ path, label }) => (
        <button key={path} onClick={() => navigate(path)} style={{
          background:   ativo(path) ? 'rgba(96,165,250,0.12)' : 'transparent',
          border:       ativo(path) ? '1px solid rgba(96,165,250,0.25)' : '1px solid transparent',
          borderRadius: 8, padding: '5px 12px',
          color:        ativo(path) ? '#60a5fa' : '#64748b',
          fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit',
          cursor: 'pointer', transition: 'all 0.15s',
        }}>
          {label}
        </button>
      ))}

      <button
        onClick={async () => { await logout(); navigate('/login'); }}
        style={{
          background: 'transparent', border: '1px solid transparent',
          borderRadius: 8, padding: '5px 12px', color: '#475569',
          fontSize: '0.78rem', fontFamily: 'inherit', cursor: 'pointer',
          transition: 'all 0.15s', marginLeft: 2,
        }}
      >
        Sair
      </button>
    </nav>
  );
}

// ── Telas auxiliares ──────────────────────────────────────────
function Carregando() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0b1120',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#475569', fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    }}>
      Carregando...
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────
function AppInner() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <GuardaPlano><Fechamento /></GuardaPlano>
        } />
        <Route path="/historico" element={
          <GuardaPlano><Historico /></GuardaPlano>
        } />
        <Route path="/plano" element={
          <RotaProtegida><Plano /></RotaProtegida>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </HashRouter>
  );
}
