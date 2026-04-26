// src/App.jsx
import React, { lazy, Suspense, memo, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  HashRouter, Routes, Route, Navigate,
  useNavigate, useLocation,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { logout, cancelarAssinatura } from './lib/api';

// ── Lazy loading ──────────────────────────────────────────────
const Login      = lazy(() => import('./pages/Login/Login'));
const Fechamento = lazy(() => import('./pages/Fechamento/Fechamento'));
const Historico  = lazy(() => import('./pages/Historico/Historico'));
const Plano      = lazy(() => import('./pages/Plano/Plano'));
const Equipe     = lazy(() => import('./pages/Equipe/Equipe'));
const RedefinirSenha = lazy(() => import('./pages/RedefinirSenha/RedefinirSenha'));

// ── Toast global ──────────────────────────────────────────────
export const ToastContext = React.createContext(null);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, tipo = 'ok') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, tipo }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-wrap">
        {toasts.map(({ id, msg, tipo }) => (
          <div key={id} className={`toast toast--${tipo}`}>
            <span>{tipo === 'ok' ? '✓' : '✕'}</span> {msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Tela de carregamento (skeleton) ───────────────────────────
function Carregando() {
  return (
    <div className="tela-carregando">
      <div className="sk-logo" />
      <div className="sk-linha" style={{ width: 180 }} />
      <div className="sk-linha" style={{ width: 120 }} />
    </div>
  );
}

// ── Guarda de rota ────────────────────────────────────────────
function RotaProtegida({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Carregando />;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

function GuardaPlano({ children }) {
  const { user, perfil, loading, planoAtivo } = useAuth();
  const location = useLocation();
  if (loading) return <Carregando />;
  if (!user)   return <Navigate to="/login" replace />;

  // Se o perfil ainda não carregou, bloqueia até ter a informação
  if (!perfil) return <Carregando />;

  // Cancelado mas ainda dentro do período pago → permite acesso normalmente
  const aindaAtivo = !perfil.plano_ativo
    && perfil.plano_expira_em
    && new Date(perfil.plano_expira_em) > new Date();

  if (!planoAtivo && !aindaAtivo && location.pathname !== '/plano') {
    return <Navigate to="/plano" replace />;
  }
  return children;
}

// Apenas gerente acessa esta rota
function GuardaGerente({ children }) {
  const { user, perfil, loading } = useAuth();
  if (loading) return <Carregando />;
  if (!user)   return <Navigate to="/login" replace />;
  if (perfil && perfil.perfil !== 'gerente' && perfil.perfil !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

// ── Modal de Assinatura ───────────────────────────────────────
function ModalAssinatura({ onFechar }) {
  const [confirmando, setConfirmando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const { perfil, planoAtivo } = useAuth();

  const addToast = React.useContext(ToastContext);

  async function handleCancelar() {
    setCancelando(true);
    try {
      await cancelarAssinatura();
      addToast('Assinatura cancelada. Acesso mantido até o fim do período.', 'ok');
      onFechar();
    } catch (err) {
      addToast(err.message || 'Erro ao cancelar assinatura.', 'erro');
    } finally {
      setCancelando(false);
      setConfirmando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal-assinatura" onClick={e => e.stopPropagation()}>
        <div className="modal-assinatura-header">
          <span className="modal-assinatura-icone">💳</span>
          <h2>Assinatura</h2>
        </div>

        <div className="modal-assinatura-status">
          <div className={`assinatura-badge ${planoAtivo ? 'assinatura-badge--ativa' : 'assinatura-badge--inativa'}`}>
            {planoAtivo ? '⭐ Plano Pro — Ativo' : '⚠️ Plano inativo'}
          </div>
          {perfil?.plano_expira_em && (
            <p className="assinatura-expira">
              {planoAtivo ? 'Renova em' : 'Acesso até'}: {new Date(perfil.plano_expira_em).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        {!confirmando ? (
          <div className="modal-assinatura-acoes">
            {planoAtivo && (
              <button
                className="btn-cancelar-assinatura"
                onClick={() => setConfirmando(true)}
              >
                Cancelar assinatura
              </button>
            )}
            <button className="btn-fechar-modal" onClick={onFechar}>
              Fechar
            </button>
          </div>
        ) : (
          <div className="modal-assinatura-confirmar">
            <p>Tem certeza? Você perderá o acesso ao sistema ao fim do período pago.</p>
            <div className="modal-assinatura-acoes">
              <button
                className="btn-cancelar-assinatura"
                onClick={handleCancelar}
                disabled={cancelando}
              >
                {cancelando ? 'Cancelando…' : 'Sim, cancelar'}
              </button>
              <button className="btn-fechar-modal" onClick={() => setConfirmando(false)}>
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Avatar dropdown ───────────────────────────────────────────
function AvatarMenu({ user }) {
  const [aberto, setAberto] = useState(false);
  const [modalAssinatura, setModalAssinatura] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);
  const { perfil } = useAuth();
  const isGerente = perfil?.perfil === 'gerente' || perfil?.perfil === 'admin';
  const inicial = (user?.email?.[0] ?? '?').toUpperCase();

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <div className="avatar-wrap" ref={ref}>
        <button className="avatar-btn" onClick={() => setAberto(v => !v)} title={user?.email}>
          {inicial}
        </button>
        {aberto && (
          <div className="avatar-menu">
            <div className="avatar-menu-email">{user?.email}</div>
            <hr className="avatar-menu-hr" />
            {isGerente && (
              <button
                className="avatar-menu-item avatar-menu-item--assinatura"
                onClick={() => { setAberto(false); setModalAssinatura(true); }}
              >
                💳 Assinatura
              </button>
            )}
            <button className="avatar-menu-item avatar-menu-item--danger" onClick={async () => {
              setAberto(false);
              await logout();
              navigate('/login');
            }}>
              Sair
            </button>
          </div>
        )}
      </div>
      {modalAssinatura && createPortal(<ModalAssinatura onFechar={() => setModalAssinatura(false)} />, document.body)}
    </>
  );
}

// ── Navbar ────────────────────────────────────────────────────
const Navbar = memo(function Navbar() {
  const { user, perfil, planoAtivo, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const indicadorRef = useRef(null);
  const btnRefs = useRef([]);

  const isGerente = perfil?.perfil === 'gerente' || perfil?.perfil === 'admin';

  // Links base — equipe só aparece para gerente/admin
  const links = [
    { path: '/',          label: 'Caixa'    },
    { path: '/historico', label: 'Histórico' },
    ...(isGerente ? [{ path: '/equipe', label: '👥 Equipe' }] : []),
  ];

  // Move o indicador animado para o botão ativo
  useEffect(() => {
    const idx = links.findIndex(l => l.path === location.pathname);
    const btn = btnRefs.current[idx];
    const ind = indicadorRef.current;
    if (btn && ind) {
      ind.style.left  = `${btn.offsetLeft}px`;
      ind.style.width = `${btn.offsetWidth}px`;
      ind.style.opacity = '1';
    } else if (ind) {
      ind.style.opacity = '0';
    }
  }, [location.pathname, planoAtivo, isGerente]);

  if (loading || !user || location.pathname === '/login') return null;

  return (
    <nav className="navbar">
      <span className="navbar-logo" onClick={() => navigate('/')}>
        🍔 Big Burguer
      </span>

      <div className="navbar-links">
        <div ref={indicadorRef} className="navbar-indicator" />
        {links.map(({ path, label }, i) => (
          <button
            key={path}
            ref={el => (btnRefs.current[i] = el)}
            onClick={() => navigate(path)}
            className={`navbar-btn${location.pathname === path ? ' navbar-btn--ativo' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      <AvatarMenu user={user} />
    </nav>
  );
});

// ── Transição de página ───────────────────────────────────────
function PaginaAnimada({ children }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="pagina-fade">
      {children}
    </div>
  );
}

// ── App inner ─────────────────────────────────────────────────
function AppInner() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<Carregando />}>
        <PaginaAnimada>
          <Routes>
            <Route path="/login"   element={<Login />} />
            <Route path="/"        element={<GuardaPlano><Fechamento /></GuardaPlano>} />
            <Route path="/historico" element={<GuardaPlano><Historico /></GuardaPlano>} />
            <Route path="/plano"   element={<RotaProtegida><Plano /></RotaProtegida>} />
            <Route path="/equipe"  element={<GuardaGerente><Equipe /></GuardaGerente>} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="*"        element={<Navigate to="/" replace />} />
          </Routes>
        </PaginaAnimada>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <AppInner />
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  );
}
