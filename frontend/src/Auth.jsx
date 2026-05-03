import React, { useState } from 'react';
import { User, Lock, Mail, UserCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    displayName: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8082/api';
      const cleanApiUrl = apiUrl.endsWith('/api') ? apiUrl.substring(0, apiUrl.length - 4) : apiUrl;
      const res = await fetch(`${cleanApiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Erro na autenticação. Verifique os dados inseridos.');
      }
      
      const user = await res.json();
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/30 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-5xl flex rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/20 bg-[#1e293b]/80 backdrop-blur-xl border border-slate-700/50 relative z-10 min-h-[600px]">
        
        {/* Left Side - Dynamic Banner */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-600 to-blue-800 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          
          <div className="relative z-10">
            <div className="mb-12">
              <img src="/image/logo.png" alt="Hubify" className="h-12 w-auto object-contain" />
            </div>
            
            <h2 className="text-4xl font-bold leading-tight mb-6 text-white">
              Sua equipe conectada em um só lugar.
            </h2>
            <p className="text-indigo-100 text-lg max-w-sm font-medium">
              A plataforma definitiva para chat corporativo e videoconferências de alta performance.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
            <ShieldCheck className="w-10 h-10 text-indigo-200" />
            <div>
              <p className="font-semibold text-white">Segurança Enterprise</p>
              <p className="text-sm text-indigo-200">Seus dados estão protegidos localmente.</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            
            {/* Mobile Header */}
            <div className="flex md:hidden mb-8 justify-center">
              <img src="/image/logo.png" alt="Hubify" className="h-10 w-auto object-contain" />
            </div>

            <div className="mb-8 text-center md:text-left">
              <h2 className="text-3xl font-bold text-white mb-2">
                {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
              </h2>
              <p className="text-slate-400 font-medium">
                {isLogin 
                  ? 'Insira suas credenciais para acessar sua área de trabalho.' 
                  : 'Preencha os dados abaixo para começar a usar a plataforma.'}
              </p>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-1 gap-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="relative group">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                      type="text" name="displayName" placeholder="Nome de Exibição" required 
                      onChange={handleChange} 
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-white placeholder:text-slate-500 transition-all" 
                    />
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                      type="email" name="email" placeholder="Endereço de E-mail" required 
                      onChange={handleChange} 
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-white placeholder:text-slate-500 transition-all" 
                    />
                  </div>
                </div>
              )}
              
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="text" name="username" placeholder="Nome de Usuário" required 
                  onChange={handleChange} 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-white placeholder:text-slate-500 transition-all" 
                />
              </div>
              
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="password" name="password" placeholder="Senha" required 
                  onChange={handleChange} 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-white placeholder:text-slate-500 transition-all" 
                />
              </div>

              {isLogin && (
                <div className="flex justify-end pt-1">
                  <a href="#" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                    Esqueceu a senha?
                  </a>
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all mt-6 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {isLogin ? 'Acessar Plataforma' : 'Criar Conta Agora'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-slate-400 font-medium">
                {isLogin ? 'Ainda não possui acesso?' : 'Já possui uma conta?'}
                <button 
                  onClick={() => setIsLogin(!isLogin)} 
                  className="text-indigo-400 font-bold ml-2 hover:text-indigo-300 transition-colors"
                >
                  {isLogin ? 'Cadastre-se' : 'Faça login'}
                </button>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
