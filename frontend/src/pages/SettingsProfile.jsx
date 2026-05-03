import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, Shield, UserCircle, Check, Search, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const passwordRequirements = [
  { test: (value) => value.length >= 8 },
  { test: (value) => /[0-9]/.test(value) },
  { test: (value) => /[!@#$%^&*]/.test(value) },
  { test: (value) => /[A-Z]/.test(value) },
];

const avatarSeeds = [
  'Aiden', 'Aneka', 'Caleb', 'Jocelyn', 'Christian', 'Abby', 'George', 'Amaya', 'Jack', 'Bibi',
  'Jasper', 'Brooklynn', 'Julian', 'Destiny', 'Owen', 'Emery', 'Sebastian', 'Gracie', 'Thomas', 'Isabella',
  'Felix', 'Kimberly', 'Alexander', 'Lily', 'Oliver', 'Mia', 'Leo', 'Ava', 'Lucas', 'Sophia',
  'Mason', 'Charlotte', 'Ethan', 'Amelia', 'James', 'Evelyn', 'Liam', 'Abigail', 'Noah', 'Harper',
  'William', 'Emily', 'Benjamin', 'Madison', 'Michael', 'Elizabeth', 'Elijah', 'Sofia', 'Matthew', 'Avery'
];

const avatars = avatarSeeds.map((seed) =>
  `https://api.dicebear.com/7.x/big-smile/svg?seed=${seed}&backgroundColor=f87171,fb923c,fbbf24,4ade80,60a5fa,818cf8,a78bfa,f472b6&v=5`
);

export default function SettingsProfile() {
  const { user, currentUserProfile } = useAuth();
  const { handleUpdateProfile, setView } = useChat();

  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [searchAvatar, setSearchAvatar] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setName(currentUserProfile?.name || '');
    setBio(currentUserProfile?.bio || '');
    setAvatar(currentUserProfile?.avatarUrl || '');
  }, [currentUserProfile?.name, currentUserProfile?.bio, currentUserProfile?.avatarUrl]);

  const filteredAvatars = useMemo(() => {
    if (!searchAvatar.trim()) return avatars;
    const q = searchAvatar.toLowerCase();
    return avatars.filter((url, idx) => avatarSeeds[idx].toLowerCase().includes(q) || url.toLowerCase().includes(q));
  }, [searchAvatar]);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setError('O nome de exibição é obrigatório.');
      setSuccess('');
      return;
    }

    setError('');
    setSuccess('');
    setIsSavingProfile(true);
    try {
      await handleUpdateProfile({ displayName: name.trim(), name: name.trim(), avatarUrl: avatar, bio: bio.trim() });
      setSuccess('Perfil atualizado com sucesso.');
    } catch (e) {
      setError('Não foi possível atualizar o perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (!passwordRequirements.every((rule) => rule.test(newPassword))) {
      setError('A nova senha precisa ter 8 caracteres, número, caractere especial e letra maiúscula.');
      setSuccess('');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      setSuccess('');
      return;
    }

    setError('');
    setSuccess('');
    setIsSavingPassword(true);
    try {
      await handleUpdateProfile({ password: newPassword });
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Senha atualizada com sucesso.');
    } catch (e) {
      setError('Não foi possível atualizar a senha.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('chat')}
                className="w-10 h-10 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg sm:text-2xl font-black text-slate-900">Configurações da Conta</h1>
                <p className="text-xs sm:text-sm text-slate-500">Gerencie seu perfil e segurança em uma página única.</p>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-8 pt-4">
            <div className="inline-flex bg-slate-100 rounded-2xl p-1 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'profile' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
              >
                <span className="inline-flex items-center gap-2"><UserCircle className="w-4 h-4" /> Perfil</span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'security' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
              >
                <span className="inline-flex items-center gap-2"><Shield className="w-4 h-4" /> Senha</span>
              </button>
            </div>
          </div>

          {(error || success) && (
            <div className="px-4 sm:px-8 pt-4">
              {error && <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">{error}</div>}
              {success && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium">{success}</div>}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col items-center">
                  <img
                    src={avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
                    alt="Avatar"
                    className="w-36 h-36 rounded-full object-cover bg-white border-4 border-white shadow-lg"
                  />
                  <p className="mt-4 text-sm font-bold text-slate-700">Avatar selecionado</p>
                  <p className="text-xs text-slate-500 mt-1 text-center">Escolha uma imagem que combine com seu perfil profissional.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como deseja ser chamado"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Sobre mim</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 200))}
                    rows={4}
                    placeholder="Escreva uma frase profissional"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">{bio.length}/200 caracteres</p>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isSavingProfile ? 'Salvando...' : 'Salvar Perfil'}
                </button>
              </div>

              <div className="lg:col-span-3">
                <div className="relative mb-4">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchAvatar}
                    onChange={(e) => setSearchAvatar(e.target.value)}
                    placeholder="Buscar avatar por nome"
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 sm:p-5">
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 xl:grid-cols-8 gap-3 sm:gap-4 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
                    {filteredAvatars.map((url, i) => (
                      <button
                        key={url}
                        onClick={() => setAvatar(url)}
                        className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 transition-transform ${avatar === url ? 'border-indigo-500 ring-2 ring-indigo-500/20 scale-105' : 'border-slate-200 hover:scale-105'}`}
                        aria-label={`Avatar ${i + 1}`}
                      >
                        <img src={url} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover" />
                        {avatar === url && (
                          <span className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-4 sm:p-8">
              <div className="max-w-xl bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8">
                <p className="text-sm text-slate-600 mb-6">Defina uma nova senha para sua conta. Use uma senha forte.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Nova senha</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Digite a nova senha"
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Confirmar senha</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSavePassword}
                  disabled={isSavingPassword || !newPassword || !confirmPassword}
                  className="mt-6 w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isSavingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
