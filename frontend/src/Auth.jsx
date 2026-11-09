import React, { useMemo, useState } from 'react';
import { Mail, Lock, User, ArrowRight, Check, UserCircle, Mic, Headphones, Video, MessageCircle, Shield, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { API_URL } from './config';

const passwordRequirements = [
  { id: 'length', label: 'Mínimo de 8 caracteres', test: (pw) => pw.length >= 8 },
  { id: 'number', label: 'Pelo menos um número', test: (pw) => /[0-9]/.test(pw) },
  { id: 'special', label: 'Caractere especial (@, #, $)', test: (pw) => /[!@#$%^&*]/.test(pw) },
  { id: 'upper', label: 'Uma letra maiúscula', test: (pw) => /[A-Z]/.test(pw) },
];

const getStrength = (score) => {
  if (score === 4) return { label: 'Forte', color: 'text-success', bar: 'bg-success' };
  if (score >= 2) return { label: 'Média', color: 'text-warning', bar: 'bg-warning' };
  return { label: 'Fraca', color: 'text-danger', bar: 'bg-danger' };
};

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [password, setPassword] = useState('');
   const [formData, setFormData] = useState({ displayName: '', username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mustUpdateUser, setMustUpdateUser] = useState(null);
    const [updateForm, setUpdateForm] = useState({ password: '', confirmPassword: '' });

  const passwordScore = useMemo(() => passwordRequirements.filter((r) => r.test(formData.password)).length, [formData.password]);
  const passwordStrength = getStrength(passwordScore);
  const passwordIsStrongEnough = passwordScore === passwordRequirements.length;

  const toggleMode = () => {
    setIsLogin((s) => !s);
    setFormData({ displayName: '', username: '', email: '', password: '' });
    setPassword('');
    setShowHints(false);
    setError('');
  };

  const techFeatures = [
    { icon: <MessageCircle size={16} />, label: 'Chat em tempo real' },
    { icon: <Video size={16} />, label: 'Videochamadas' },
    { icon: <Mic size={16} />, label: 'Chamadas de áudio' },
    { icon: <Headphones size={16} />, label: 'Reuniões e tela' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'password') {
      setPassword(value);
    }
    setFormData((p) => ({ ...p, [name]: value }));
    if (name === 'password' && !isLogin) setShowHints(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin && !passwordIsStrongEnough) {
      setError('A senha precisa atender a todos os requisitos de segurança.');
      setShowHints(true);
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    try {
      const apiUrl = API_URL;
      const base = apiUrl || '';
      let payload = formData;
      if (isLogin) {
        const identifier = (formData.username || '').trim();
        if (identifier.includes('@')) {
          payload = { email: identifier, password };
        } else {
          payload = { username: identifier, password };
        }
      }
      const res = await fetch(`${base}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Erro na autenticação');
      }
      const user = await res.json();
      
      if (user.mustChangePassword) {
        setMustUpdateUser(user);
        setError('');
        return;
      }

      if (onLogin) onLogin(user);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (updateForm.password !== updateForm.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    const score = passwordRequirements.filter((r) => r.test(updateForm.password)).length;
    if (score < passwordRequirements.length) {
      setError('A nova senha não atende aos requisitos de segurança.');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = API_URL;
      const res = await fetch(`${apiUrl}/auth/users/${mustUpdateUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: updateForm.password }),
      });
      
      if (!res.ok) throw new Error('Erro ao atualizar senha');
      
      const updatedUser = await res.json();
      if (onLogin) onLogin(updatedUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, Icon, props = {}) => (
    <label className="block">
      <span className="block text-sm font-semibold text-ink mb-1.5">{label}</span>
      <span className="relative block">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 w-4 h-4 pointer-events-none" />
        <input name={name} value={formData[name]} onChange={handleChange} className="input h-10 pl-9" {...props} />
      </span>
    </label>
  );

  const Requirements = ({ value }) => (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
      {passwordRequirements.map((req) => {
        const isMet = req.test(value);
        return (
          <li key={req.id} className={`flex items-center gap-2 text-xs ${isMet ? 'text-success' : 'text-ink-2'}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center ${isMet ? 'bg-success text-white' : 'border border-line'}`}>{isMet && <Check size={10} strokeWidth={3} />}</span>
            {req.label}
          </li>
        );
      })}
    </ul>
  );

  const Spinner = () => <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />;

  return (
    <div className="app-viewport bg-app">
      <div className="h-full flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
        {/* Painel da marca */}
        <aside className="relative md:w-[44%] lg:w-[48%] bg-topbar text-white px-6 pt-10 pb-10 md:p-14 flex flex-col justify-between overflow-hidden shrink-0">
          <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-brand/30 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 bottom-0 w-80 h-80 rounded-full bg-chat-accent/15 blur-3xl pointer-events-none" />
          <div className="relative">
            <img src="/image/logo.png" alt="Hubify" className="h-10 md:h-14 w-auto object-contain" />
          </div>
          <div className="relative mt-6 md:mt-0">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-semibold leading-tight">Sua equipe conectada,<br /><span className="text-white/60">em qualquer lugar.</span></h1>
            <p className="hidden md:block text-white/70 text-lg mt-4 max-w-md">Chat, chamadas de vídeo e áudio, reuniões e compartilhamento de tela em um só lugar.</p>
            <ul className="hidden md:grid grid-cols-2 gap-3 mt-10 max-w-md">
              {techFeatures.map((f) => (
                <li key={f.label} className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 px-3 py-2.5">
                  <span className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center text-white">{f.icon}</span>
                  <span className="text-sm">{f.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="relative hidden md:block text-xs text-white/40">© {new Date().getFullYear()} Hubify Workspace</p>
        </aside>

        {/* Formulário */}
        <main className="flex-1 flex items-start md:items-center justify-center p-4 md:p-10 md:overflow-y-auto">
          <div className="card w-full max-w-[440px] p-6 md:p-8 -mt-6 md:mt-0 relative">
            <h2 className="text-2xl font-semibold text-ink">
              {mustUpdateUser ? 'Atualize sua senha' : (isLogin ? 'Entrar' : 'Criar conta')}
            </h2>
            <p className="text-ink-2 mt-1 mb-6">
              {mustUpdateUser
                ? 'Sua conta usa um padrão de senha antigo. Crie uma nova senha segura para continuar.'
                : (isLogin ? 'Use seu usuário ou e-mail corporativo.' : 'Leva menos de um minuto.')}
            </p>

            {error && <div className="bg-danger-soft text-danger border border-danger/30 px-3 py-2.5 rounded-md mb-5 text-sm">{error}</div>}

            {mustUpdateUser ? (
              <form className="space-y-4" onSubmit={handleUpdatePassword}>
                <label className="block">
                  <span className="block text-sm font-semibold text-ink mb-1.5">Nova senha</span>
                  <input type="password" value={updateForm.password} onChange={(e) => setUpdateForm({ ...updateForm, password: e.target.value })} className="input h-10" />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold text-ink mb-1.5">Confirmar nova senha</span>
                  <input type="password" value={updateForm.confirmPassword} onChange={(e) => setUpdateForm({ ...updateForm, confirmPassword: e.target.value })} className="input h-10" />
                </label>
                <Requirements value={updateForm.password} />
                <button type="submit" className="btn-primary w-full h-10 mt-2">{loading ? <Spinner /> : 'Atualizar e entrar'}</button>
                <button type="button" onClick={() => setMustUpdateUser(null)} className="btn-ghost w-full">Voltar para o login</button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {isLogin ? (
                  field('username', 'Usuário ou e-mail', Mail, { type: 'text', autoComplete: 'username', placeholder: 'nome@empresa.com' })
                ) : (
                  <>
                    {field('displayName', 'Nome completo', User, { type: 'text', placeholder: 'Como as pessoas verão você' })}
                    {field('username', 'Nome de usuário', UserCircle, { type: 'text', autoComplete: 'username', placeholder: 'usuario' })}
                    {field('email', 'E-mail corporativo', Mail, { type: 'email', autoComplete: 'email', placeholder: 'nome@empresa.com' })}
                  </>
                )}

                <label className="block">
                  <span className="block text-sm font-semibold text-ink mb-1.5">Senha</span>
                  <span className="relative block">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 w-4 h-4 pointer-events-none" />
                    <input
                      name="password"
                      value={password}
                      onChange={handleChange}
                      onFocus={() => !isLogin && setShowHints(true)}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      className="input h-10 pl-9 pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword((c) => !c)} className="absolute right-1.5 top-1/2 -translate-y-1/2 icon-btn" title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </span>
                </label>

                {!isLogin && showHints && (
                  <div className="rounded-md bg-subtle border border-line p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-2">Força da senha</span>
                      <span className={`font-semibold ${passwordStrength.color}`}>{passwordStrength.label}</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4].map((step) => <span key={step} className={`h-1 flex-1 rounded-full ${passwordScore >= step ? passwordStrength.bar : 'bg-line'}`} />)}
                    </div>
                    <Requirements value={formData.password} />
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full h-10 mt-2">
                  {loading ? <Spinner /> : <>{isLogin ? 'Entrar' : 'Criar conta'} <ArrowRight size={16} /></>}
                </button>
              </form>
            )}

            {!mustUpdateUser && (
              <p className="mt-6 pt-5 border-t border-line text-center text-sm text-ink-2">
                {isLogin ? 'Ainda não tem conta?' : 'Já tem uma conta?'}{' '}
                <button onClick={toggleMode} className="font-semibold text-brand hover:underline">{isLogin ? 'Criar conta' : 'Entrar'}</button>
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
