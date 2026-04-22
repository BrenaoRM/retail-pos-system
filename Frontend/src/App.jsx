// src/App.jsx
import React, { lazy, Suspense, memo } from 'react';
import {
  HashRouter, Routes, Route, Navigate,
  useNavigate, useLocation,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { logout } from './lib/api';

// ── Lazy loading — cada página só carrega quando acessada ─────
const Login      = lazy(() => import('./pages/Login/Login'));
const Fechamento = lazy(() => import('./pages/Fechamento/Fechamento'));
const Historico  = lazy(() => import('./pages/Historico/Historico'));
const Plano      = lazy(() => import('./pages/Plano/Plano'));

// ── Tela de carregamento ──────────────────────────────────────
function Carregando() {
  return <div className="tela-carregando">Carregando...</div>;
}

// ── Guarda de rota ────────────────────────────────────────────
function RotaProtegida({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Carregando />;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

// ── Guarda de plano ───────────────────────────────────────────
function GuardaPlano({ children }) {
  const { user, perfil, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Carregando />;
  if (!user)   return <Navigate to="/login" replace />;
  if (perfil && !perfil.plano_ativo && location.pathname !== '/plano') {
    return <Navigate to="/plano" replace />;
  }
  return children;
}

// ── Navbar — memo evita re-render a cada mudança de estado pai ─
const Navbar = memo(function Navbar() {
  const { user, planoAtivo, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading || !user || location.pathname === '/login') return null;

  const ativo = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <span className="navbar-logo" onClick={() => navigate('/')}>
        🍔 Big Burguer
      </span>

      {[
        { path: '/',          label: 'Caixa'    },
        { path: '/historico', label: 'Histórico' },
        { path: '/plano',     label: planoAtivo ? '⭐ Pro' : 'Plano' },
      ].map(({ path, label }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          className={`navbar-btn${ativo(path) ? ' navbar-btn--ativo' : ''}`}
        >
          {label}
        </button>
      ))}

      <button
        className="navbar-sair"
        onClick={async () => { await logout(); navigate('/login'); }}
      >
        Sair
      </button>
    </nav>
  );
});

// ── App inner ─────────────────────────────────────────────────
function AppInner() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<Carregando />}>
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
      </Suspense>
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
