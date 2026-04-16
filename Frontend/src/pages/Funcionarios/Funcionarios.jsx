// src/pages/Funcionarios/Funcionarios.jsx
// ─────────────────────────────────────────────────────────────────────
// Só acessível pelo admin. Permite criar contas de funcionários,
// alterar perfil (gerente/funcionário) e ativar/desativar.
// ─────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listarFuncionarios,
  registrarFuncionario,
  toggleFuncionario,
  atualizarPerfil,
} from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import './Funcionarios.css';

const IconBack  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IconPlus  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconUser  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

const PERFIL_LABEL = { admin: 'Admin', gerente: 'Gerente', funcionario: 'Funcionário' };
const PERFIL_COR   = { admin: '#a78bfa', gerente: '#60a5fa', funcionario: '#94a3b8' };

const Funcionarios = () => {
  const navigate = useNavigate();
  const { isAdmin, perfil: perfilLogado } = useAuth();

  const [lista,    setLista]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [erro,     setErro]     = useState('');
  const [sucesso,  setSucesso]  = useState('');
  const [modal,    setModal]    = useState(false);

  // Form novo funcionário
  const [form, setForm] = useState({ nome: '', email: '', senha: '', perfil: 'funcionario' });
  const [criando, setCriando] = useState(false);
  const [erroForm, setErroForm] = useState('');

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    carregar();
  }, [isAdmin]);

  const carregar = async () => {
    setLoading(true);
    try {
      const dados = await listarFuncionarios();
      setLista(dados);
    } catch (e) {
      setErro('Erro ao carregar: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCriar = async (e) => {
    e.preventDefault();
    setErroForm('');
    if (form.senha.length < 8) { setErroForm('Senha mínima: 8 caracteres'); return; }
    setCriando(true);
    try {
      await registrarFuncionario(form);
      setSucesso(`Conta criada para ${form.email}!`);
      setModal(false);
      setForm({ nome: '', email: '', senha: '', perfil: 'funcionario' });
      await carregar();
      setTimeout(() => setSucesso(''), 4000);
    } catch (e) {
      setErroForm(e.message.includes('already registered') ? 'Email já cadastrado.' : e.message);
    } finally {
      setCriando(false);
    }
  };

  const handleToggle = async (id, ativo) => {
    try {
      await toggleFuncionario(id, !ativo);
      setLista(prev => prev.map(u => u.id === id ? { ...u, ativo: !ativo } : u));
    } catch (e) {
      setErro('Erro: ' + e.message);
    }
  };

  const handlePerfil = async (id, novoPerfil) => {
    try {
      await atualizarPerfil(id, { perfil: novoPerfil });
      setLista(prev => prev.map(u => u.id === id ? { ...u, perfil: novoPerfil } : u));
    } catch (e) {
      setErro('Erro: ' + e.message);
    }
  };

  return (
    <div className="func-root">
      <div className="func-main">

        {/* Header */}
        <div className="func-header">
          <button className="func-btn-back" onClick={() => navigate('/')}>
            <IconBack /> Voltar
          </button>
          <div style={{ flex: 1 }}>
            <h1 className="func-titulo">Funcionários</h1>
            <p className="func-sub">Gerencie as contas da sua equipe</p>
          </div>
          <button className="func-btn-novo" onClick={() => setModal(true)}>
            <IconPlus /> Novo
          </button>
        </div>

        {erro    && <div className="func-erro">{erro}</div>}
        {sucesso && <div className="func-sucesso">{sucesso}</div>}

        {/* Lista */}
        {loading ? (
          <div className="func-loading">Carregando...</div>
        ) : (
          <div className="func-lista">
            {lista.map(u => (
              <div key={u.id} className={`func-item ${!u.ativo ? 'func-item--inativo' : ''}`}>
                <div className="func-avatar" style={{ background: `${PERFIL_COR[u.perfil]}22`, color: PERFIL_COR[u.perfil] }}>
                  {u.nome?.charAt(0).toUpperCase() || <IconUser />}
                </div>
                <div className="func-info">
                  <span className="func-nome">{u.nome}</span>
                  <span className="func-email">{u.email}</span>
                </div>
                <div className="func-acoes">
                  {/* Só muda perfil de quem não é o próprio admin */}
                  {u.id !== perfilLogado?.id && u.perfil !== 'admin' && (
                    <select
                      className="func-select-perfil"
                      value={u.perfil}
                      onChange={e => handlePerfil(u.id, e.target.value)}
                    >
                      <option value="gerente">Gerente</option>
                      <option value="funcionario">Funcionário</option>
                    </select>
                  )}
                  {u.perfil === 'admin' && (
                    <span className="func-badge-admin">Admin</span>
                  )}
                  {u.id !== perfilLogado?.id && (
                    <button
                      className={`func-btn-toggle ${u.ativo ? 'func-btn-desativar' : 'func-btn-ativar'}`}
                      onClick={() => handleToggle(u.id, u.ativo)}
                    >
                      {u.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal criar funcionário */}
      {modal && (
        <div className="func-modal-overlay" onClick={() => setModal(false)}>
          <div className="func-modal-card" onClick={e => e.stopPropagation()}>
            <h2 className="func-modal-titulo">Criar conta</h2>
            <p className="func-modal-sub">O funcionário receberá as credenciais para acessar o sistema.</p>

            <form onSubmit={handleCriar} className="func-form">
              <div className="func-field">
                <label>Nome</label>
                <input type="text" required placeholder="João Silva"
                  value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className="func-field">
                <label>Email</label>
                <input type="email" required placeholder="joao@bigburguer.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="func-field">
                <label>Senha inicial</label>
                <input type="password" required placeholder="Mínimo 8 caracteres"
                  value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} />
              </div>
              <div className="func-field">
                <label>Perfil</label>
                <select value={form.perfil} onChange={e => setForm(f => ({ ...f, perfil: e.target.value }))}>
                  <option value="funcionario">Funcionário — só preenche e vê os próprios</option>
                  <option value="gerente">Gerente — vê todos os fechamentos</option>
                </select>
              </div>

              {erroForm && <div className="func-erro-form">{erroForm}</div>}

              <div className="func-form-btns">
                <button type="button" className="func-btn-cancelar" onClick={() => setModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="func-btn-criar" disabled={criando}>
                  {criando ? 'Criando...' : 'Criar conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Funcionarios;
