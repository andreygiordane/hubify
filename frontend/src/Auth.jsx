import React, { useMemo, useState } from 'react';
import { Mail, Lock, User, ArrowRight, Check, UserCircle, Mic, Headphones, Video, MessageCircle, Shield, ChevronLeft, Eye, EyeOff } from 'lucide-react';

const passwordRequirements = [
  { id: 'length', label: 'Mínimo de 8 caracteres', test: (pw) => pw.length >= 8 },
  { id: 'number', label: 'Pelo menos um número', test: (pw) => /[0-9]/.test(pw) },
  { id: 'special', label: 'Caractere especial (@, #, $)', test: (pw) => /[!@#$%^&*]/.test(pw) },
  { id: 'upper', label: 'Uma letra maiúscula', test: (pw) => /[A-Z]/.test(pw) },
];

const getStrength = (score) => {
  if (score === 4) return { label: 'Forte', color: 'text-emerald-500', bar: 'bg-emerald-500' };
  if (score >= 2) return { label: 'Média', color: 'text-amber-500', bar: 'bg-amber-500' };
  return { label: 'Fraca', color: 'text-rose-500', bar: 'bg-rose-500' };
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
    { icon: <Video size={14} />, label: 'Vídeo HD' },
    { icon: <MessageCircle size={14} />, label: 'Chat Inteligente' },
    { icon: <Mic size={14} />, label: 'Áudio HD' },
    { icon: <Headphones size={14} />, label: 'Sem Ruído' },
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
      const apiUrl = import.meta.env.VITE_API_URL || '';
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
      const apiUrl = import.meta.env.VITE_API_URL || '';
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

  return (
    <div className="min-h-screen bg-white md:bg-[#09090b] text-[#09090b] md:text-[#fafafa] font-sans selection:bg-indigo-500/30 flex flex-col md:flex-row overflow-x-hidden">
      <div className="hidden md:flex relative z-10 w-full md:w-1/2 lg:w-[55%] p-16 flex-col justify-between overflow-hidden border-r border-zinc-800/50">
        <div className="absolute top-[-5%] left-[-5%] w-[70%] h-[70%] bg-indigo-600/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[70px] md:blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <div className="mb-8 md:mb-24 flex flex-col items-center md:items-start text-center md:text-left">
            <span className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter italic text-white">Hubify</span>
            <div className="w-10 md:w-12 h-1 bg-indigo-600 mt-1 md:mt-2 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)]" />
          </div>

          <div className="max-w-xl text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-4 md:mb-6">
              Sua equipe conectada, <br className="hidden sm:block" />
              <span className="text-zinc-500 italic font-medium">em qualquer lugar.</span>
            </h1>
            <p className="text-zinc-400 text-base md:text-xl max-w-md mx-auto md:mx-0 leading-relaxed">A plataforma definitiva para chat corporativo e videoconferências de alta performance.</p>
          </div>
        </div>

        <div className="relative z-10 mt-10 md:mt-12 mb-2 flex flex-col items-center md:items-start">
          <div className="inline-flex flex-wrap justify-center md:justify-start items-center gap-1 p-1 bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 rounded-2xl sm:rounded-2xl">
            {techFeatures.map((feature, idx) => (
              <React.Fragment key={idx}>
                <div className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3 rounded-xl hover:bg-zinc-800/50 transition-colors group">
                  <div className="text-indigo-400 group-hover:text-indigo-300 transition-colors">{feature.icon}</div>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200 transition-colors whitespace-nowrap">{feature.label}</span>
                </div>
                {idx < techFeatures.length - 1 && <div className="h-3 w-px bg-zinc-800 hidden sm:block" />}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-zinc-600 md:ml-2">
            <Shield size={10} className="text-emerald-500/60" />
            <span className="text-[9px] font-semibold tracking-tight uppercase">Encryption active</span>
          </div>
        </div>
      </div>

      <div className="md:hidden w-full bg-[#09090b] h-72 relative flex flex-col items-center justify-center overflow-hidden rounded-b-[40px] shadow-2xl border-b border-zinc-800/50">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none" />

        {!isLogin && (
          <button onClick={toggleMode} className="absolute top-8 left-6 text-white/60 hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
        )}

        <div className="relative z-10 flex flex-col items-center text-center px-6">
          <div className="mb-4">
            <span className="text-4xl font-bold tracking-tighter italic text-white drop-shadow-[0_0_15px_rgba(79,70,229,0.4)]">Hubify</span>
            <div className="w-10 h-1 bg-indigo-600 mx-auto mt-1 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">
            {isLogin ? 'Olá, que bom ver você!' : 'Seja muito bem-vindo!'}
          </h2>
          <p className="text-zinc-400 text-xs max-w-[240px] leading-relaxed">
            {isLogin 
              ? 'Acesse sua conta para continuar de onde parou.' 
              : 'Junte-se à nossa rede e conecte-se com sua equipe.'}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 md:p-16 lg:p-24 bg-white md:bg-[#09090b]/40 backdrop-blur-sm relative z-20 md:mt-0 -mt-10 md:rounded-none rounded-t-[40px] md:shadow-none shadow-[-10px_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="w-full max-w-md mx-auto">
          <div className="hidden md:block mb-10">
            <h2 className="text-3xl font-semibold text-white mb-2">
              {mustUpdateUser ? 'Atualizar Senha' : (isLogin ? 'Bem-vindo de volta' : 'Começar agora')}
            </h2>
            <p className="text-zinc-500">
              {mustUpdateUser 
                ? 'Sua conta usa um padrão de senha antigo. Por favor, crie uma nova senha segura.' 
                : (isLogin ? 'Insira suas credenciais para entrar.' : 'Crie sua conta corporativa gratuita.')}
            </p>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 text-sm font-medium">{error}</div>}

          {mustUpdateUser ? (
            <form className="space-y-6" onSubmit={handleUpdatePassword}>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-extrabold text-zinc-600 ml-1">Nova Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={updateForm.password}
                    onChange={(e) => setUpdateForm({ ...updateForm, password: e.target.value })}
                    className="w-full bg-zinc-900/20 border border-zinc-800/80 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500 transition-all text-zinc-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-extrabold text-zinc-600 ml-1">Confirmar Nova Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={updateForm.confirmPassword}
                    onChange={(e) => setUpdateForm({ ...updateForm, confirmPassword: e.target.value })}
                    className="w-full bg-zinc-900/20 border border-zinc-800/80 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500 transition-all text-zinc-200"
                  />
                </div>
              </div>

              <div className="mt-4 p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Requisitos da Nova Senha</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {passwordRequirements.map((req) => {
                    const isMet = req.test(updateForm.password);
                    return (
                      <div key={req.id} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${isMet ? 'bg-emerald-500/20' : 'bg-zinc-800'}`}>
                          {isMet ? <Check size={8} className="text-emerald-500" /> : <div className="w-1 h-1 bg-zinc-600 rounded-full" />}
                        </div>
                        <span className={`text-[10px] ${isMet ? 'text-zinc-300' : 'text-zinc-600'}`}>{req.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button type="submit" className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group active:scale-[0.98]">
                {loading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <span>Atualizar e Entrar</span>}
              </button>
              
              <button type="button" onClick={() => setMustUpdateUser(null)} className="w-full text-zinc-500 text-xs hover:text-zinc-300 transition-colors">Voltar para Login</button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
            {isLogin ? (
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-extrabold text-zinc-400 md:text-zinc-600 ml-1">E-mail ou Nome de usuário</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 md:text-zinc-600 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input name="username" value={formData.username} onChange={handleChange} type="text" placeholder="Usuário ou e-mail" className="w-full bg-zinc-50 md:bg-zinc-900/20 border border-zinc-200 md:border-zinc-800/80 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500 md:focus:border-zinc-500 transition-all text-zinc-900 md:text-zinc-200 placeholder:text-zinc-300 md:placeholder:text-zinc-700" />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-extrabold text-zinc-400 md:text-zinc-600 ml-1">Nome de Exibição</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 md:text-zinc-600 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input name="displayName" value={formData.displayName} onChange={handleChange} type="text" placeholder="Como você aparecerá" className="w-full bg-zinc-50 md:bg-zinc-900/20 border border-zinc-200 md:border-zinc-800/80 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500 md:focus:border-zinc-500 transition-all text-zinc-900 md:text-zinc-200 placeholder:text-zinc-300 md:placeholder:text-zinc-700" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-extrabold text-zinc-400 md:text-zinc-600 ml-1">Nome de Usuário</label>
                  <div className="relative group">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 md:text-zinc-600 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input name="username" value={formData.username} onChange={handleChange} type="text" placeholder="@usuario" className="w-full bg-zinc-50 md:bg-zinc-900/20 border border-zinc-200 md:border-zinc-800/80 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500 md:focus:border-zinc-500 transition-all text-zinc-900 md:text-zinc-200 placeholder:text-zinc-300 md:placeholder:text-zinc-700" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-extrabold text-zinc-400 md:text-zinc-600 ml-1">Email Corporativo</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 md:text-zinc-600 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="nome@empresa.com" className="w-full bg-zinc-50 md:bg-zinc-900/20 border border-zinc-200 md:border-zinc-800/80 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500 md:focus:border-zinc-500 transition-all text-zinc-900 md:text-zinc-200 placeholder:text-zinc-300 md:placeholder:text-zinc-700" />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] uppercase tracking-widest font-extrabold text-zinc-400 md:text-zinc-600">Senha</label>
                {isLogin && <button type="button" className="text-[10px] font-bold text-indigo-600 md:text-indigo-400 uppercase tracking-tighter">Recuperar</button>}
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 md:text-zinc-600 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  name="password"
                  value={password}
                  onChange={(e) => {
                    handleChange(e);
                  }}
                  onFocus={() => !isLogin && setShowHints(true)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-zinc-50 md:bg-zinc-900/20 border border-zinc-200 md:border-zinc-800/80 rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-indigo-500 md:focus:border-zinc-500 transition-all text-zinc-900 md:text-zinc-200 placeholder:text-zinc-300 md:placeholder:text-zinc-700"
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 md:text-zinc-600 hover:text-indigo-500 transition-colors p-1">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {!isLogin && showHints && (
                <div className="mt-4 p-4 bg-zinc-50 md:bg-zinc-950/50 border border-zinc-100 md:border-zinc-800 rounded-2xl space-y-3 animate-in fade-in zoom-in-95">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Segurança</span>
                    <span className={`text-[9px] font-bold uppercase ${passwordScore === 4 ? 'text-emerald-600' : 'text-amber-600'}`}>{passwordScore === 4 ? 'Forte' : 'Média'}</span>
                  </div>

                  <div className="h-1.5 w-full bg-zinc-200 md:bg-zinc-900 rounded-full flex gap-1 overflow-hidden">
                    {[1, 2, 3, 4].map((step) => (
                      <div key={step} className={`h-full flex-1 transition-all duration-500 ${passwordScore >= step ? 'bg-indigo-600' : 'bg-transparent'}`} />
                    ))}
                  </div>

                  <div className="pt-1 grid grid-cols-1 gap-2">
                    {passwordRequirements.map((req) => {
                      const isMet = req.test(formData.password);
                      return (
                        <div key={req.id} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-colors ${isMet ? 'bg-emerald-500/20' : 'bg-zinc-800'}`}>
                            {isMet ? <Check size={8} className="text-emerald-500" /> : <div className="w-1 h-1 bg-zinc-600 rounded-full" />}
                          </div>
                          <span className={`text-[10px] transition-colors ${isMet ? 'text-zinc-300' : 'text-zinc-600'}`}>{req.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="w-full bg-[#09090b] md:bg-white text-white md:text-black hover:bg-zinc-800 md:hover:bg-zinc-200 font-bold py-4 rounded-2xl transition-all mt-4 flex items-center justify-center gap-2 group active:scale-[0.98] shadow-2xl md:shadow-xl shadow-indigo-500/10 min-h-[56px]">
              {loading ? <div className="w-5 h-5 border-2 border-white/20 md:border-black/20 border-t-white md:border-t-black rounded-full animate-spin" /> : <><span>{isLogin ? 'Entrar' : 'Criar conta'}</span><ArrowRight size={18} /></>}
            </button>
          </form>
          )}

          <div className="mt-12 text-center">
            <button onClick={toggleMode} className="text-xs text-zinc-500 flex flex-row items-center justify-center gap-1 mx-auto group py-2">
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <span className="font-bold text-[#09090b] md:text-white group-hover:underline">{isLogin ? 'Cadastrar' : 'Entrar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
