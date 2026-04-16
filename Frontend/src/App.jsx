// src/App.jsx
// ─────────────────────────────────────────────────────────────────────
// Roteamento principal da aplicação.
// Instale react-router-dom: npm install react-router-dom
// ─────────────────────────────────────────────────────────────────────
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Páginas
import Login        from './pages/Login/Login';
import Fechamento   from './pages/Fechamento/Fechamento';
import Historico    from './pages/Historico/Historico';
import Funcionarios from './pages/Funcionarios/Funcionarios';
import Plano        from './pages/Plano/Plano';

// ── Rota protegida genérica ──────────────────────────────────────────
const RotaProtegida = ({ children, apenasAdmin = false }) => {
  const { user, perfil, loading, isAdmin } = useAuth();
  if (loading) return <TelaCargando />;
  if (!user)   return <Navigate to="/login" replace />;
  if (apenasAdmin && !isAdmin) return <Navigate to="/" replace />;
  if (perfil && !perfil.ativo) return <TelaInativa />;
  return children;
};

// ── Navbar (só aparece quando logado) ───────────────────────────────
const Navbar = () => {
  const { user, perfil, isAdmin, planoAtivo, loading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { logout } = require('./lib/supabase'); // import inline para evitar circular

  if (loading || !user || location.pathname === '/login') return null;

  const ativo = (path) => location.pathname === path;

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(15,23,42,0.95)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      padding: '0 16px',
      display: 'flex', alignItems: 'center',
      height: 52, gap: 4,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Logo / nome */}
      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f1f5f9', marginRight: 'auto', cursor: 'pointer' }}
        onClick={() => navigate('/')}>
        🍔 Big Burguer
      </span>

      {/* Links */}
      {[
        { path: '/',             label: 'Caixa' },
        { path: '/historico',    label: 'Histórico' },
        ...(isAdmin ? [{ path: '/funcionarios', label: 'Equipe' }] : []),
        { path: '/plano',        label: planoAtivo ? '⭐ Pro' : 'Plano' },
      ].map(({ path, label }) => (
        <button key={path}
          onClick={() => navigate(path)}
          style={{
            background: ativo(path) ? 'rgba(96,165,250,0.12)' : 'transparent',
            border: ativo(path) ? '1px solid rgba(96,165,250,0.25)' : '1px solid transparent',
            borderRadius: 8, padding: '6px 12px',
            color: ativo(path) ? '#60a5fa' : '#94a3b8',
            fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
          {label}
        </button>
      ))}

      {/* Avatar / logout */}
      <button
        onClick={async () => { await logout(); navigate('/login'); }}
        style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '6px 12px', color: '#64748b',
          fontSize: '0.78rem', fontFamily: 'inherit', cursor: 'pointer', marginLeft: 4,
          transition: 'all 0.15s',
        }}>
        Sair
      </button>
    </nav>
  );
};

// ── Telas auxiliares ─────────────────────────────────────────────────
const TelaCargando = () => (
  <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontFamily: 'Inter, sans-serif' }}>
    Carregando...
  </div>
);

const TelaInativa = () => (
  <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontFamily: 'Inter, sans-serif', gap: 12 }}>
    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Conta desativada</p>
    <p style={{ fontSize: '0.85rem', margin: 0 }}>Entre em contato com o administrador.</p>
  </div>
);

// ── App principal ─────────────────────────────────────────────────────
const AppInner = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <RotaProtegida><Fechamento /></RotaProtegida>
      } />
      <Route path="/historico" element={
        <RotaProtegida><Historico /></RotaProtegida>
      } />
      <Route path="/funcionarios" element={
        <RotaProtegida apenasAdmin><Funcionarios /></RotaProtegida>
      } />
      <Route path="/plano" element={
        <RotaProtegida><Plano /></RotaProtegida>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
