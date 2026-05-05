import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, Shield, UserCircle, Check, Search, Lock, Camera, Trash2, Plus, Minus, X, RefreshCw } from 'lucide-react';
import { motion, useMotionValue } from 'framer-motion';
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
  const fileInputRef = React.useRef(null);

  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [tempImage, setTempImage] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropZoom, setCropZoom] = useState(1);
  const cropX = useMotionValue(0);
  const cropY = useMotionValue(0);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setTempImage(event.target.result);
      setShowCropModal(true);
      setCropZoom(1);
      cropX.set(0);
      cropY.set(0);
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const handleApplyCrop = async (canvas) => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setAvatar(dataUrl);
    setShowCropModal(false);
    setTempImage(null);
  };

  const [initialDist, setInitialDist] = useState(null);
  const handlePinch = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      if (initialDist === null) {
        setInitialDist(dist);
      } else {
        const delta = dist / initialDist;
        setCropZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
        setInitialDist(dist);
      }
    }
  };

  const handleWheel = (e) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setCropZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  };

  const handleRemovePhoto = () => {
    setAvatar('');
  };

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
                    src={avatar || '/images/default-avatar.png'}
                    alt="Avatar"
                    className="w-40 h-40 rounded-[3.5rem] object-cover bg-white border-4 border-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-500"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-100 transition-all"
                    >
                      <Camera className="w-3 h-3" /> Alterar
                    </button>
                    {avatar && (
                      <button
                        onClick={handleRemovePhoto}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-all"
                      >
                        <Trash2 className="w-3 h-3" /> Remover
                      </button>
                    )}
                  </div>
                  <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Foto de Perfil</p>
                  <p className="text-[9px] text-slate-400 mt-1 text-center leading-relaxed">Envie uma foto sua ou escolha um dos avatares ao lado.</p>
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

      {/* CROP MODAL (WHATSAPP STYLE) */}
      {showCropModal && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 md:px-8 md:py-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowCropModal(false)} 
                className="p-2 hover:bg-white/10 rounded-full text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-white font-medium text-lg">Arraste a imagem para ajustar</h3>
            </div>
            <button 
              onClick={() => fileInputRef.current.click()}
              className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl text-white transition-all text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" /> Carregar
            </button>
          </div>

          <div 
            className="flex-1 relative overflow-hidden flex items-center justify-center p-4"
            onWheel={handleWheel}
            onTouchMove={handlePinch}
            onTouchEnd={() => setInitialDist(null)}
          >
            {/* The Image and Drag Container */}
            <div id="crop-container" className="relative w-full max-w-[430px] aspect-square flex items-center justify-center">
               {/* Mask Overlay (Rounded Square instead of Circle) */}
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div id="crop-mask" className="w-[240px] h-[240px] md:w-[300px] md:h-[300px] rounded-[3.5rem] border-4 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.8),0_20px_50px_rgba(0,0,0,0.3)]"></div>
               </div>
               
               <div className="w-full h-full flex items-center justify-center cursor-move">
                  <motion.img 
                    id="motion-img"
                    src={tempImage} 
                    alt="Temp" 
                    drag
                    dragMomentum={false}
                    style={{ 
                      x: cropX, 
                      y: cropY, 
                      scale: cropZoom,
                    }}
                    className="max-w-none origin-center"
                  />
               </div>

               <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-20 flex flex-col gap-1 p-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl">
                  <button 
                    onClick={() => setCropZoom(prev => Math.min(5, prev + 0.1))}
                    className="p-2.5 hover:bg-white/20 text-white rounded-xl transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <div className="h-px bg-white/10 mx-2" />
                  <button 
                    onClick={() => setCropZoom(prev => Math.max(0.1, prev - 0.1))}
                    className="p-2.5 hover:bg-white/20 text-white rounded-xl transition-all"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
               </div>
            </div>

            {/* Floating Apply Button */}
            <button 
              onClick={() => {
                const canvas = document.createElement('canvas');
                const img = new Image();
                img.src = tempImage;
                img.onload = () => {
                  const size = 400;
                  canvas.width = size;
                  canvas.height = size;
                  const ctx = canvas.getContext('2d');
                  
                  const mask = document.getElementById('crop-mask');
                  const maskRect = mask.getBoundingClientRect();
                  
                  const displayImg = document.getElementById('motion-img');
                  const imgRect = displayImg.getBoundingClientRect();
                  
                  // Ratio between natural and displayed size
                  const ratioX = img.naturalWidth / imgRect.width;
                  const ratioY = img.naturalHeight / imgRect.height;
                  
                  // Position of mask relative to image
                  const relativeX = (maskRect.left - imgRect.left) * ratioX;
                  const relativeY = (maskRect.top - imgRect.top) * ratioY;
                  
                  // Size of mask in natural pixels
                  const sWidth = maskRect.width * ratioX;
                  const sHeight = maskRect.height * ratioY;
                  
                  ctx.drawImage(img, relativeX, relativeY, sWidth, sHeight, 0, 0, size, size);
                  handleApplyCrop(canvas);
                };
              }}
              className="absolute bottom-10 right-10 w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all z-30"
            >
              <Check className="w-10 h-10 stroke-[3px]" />
            </button>
          </div>

          {/* Bottom Bar Mobile (Optional fallback labels) */}
          <div className="flex justify-between px-8 py-6 md:hidden text-white/50 font-medium uppercase tracking-widest text-[10px]">
            <button onClick={() => setShowCropModal(false)}>Cancelar</button>
            <span>Mover e Redimensionar</span>
            <button className="text-emerald-500" onClick={() => document.querySelector('[data-apply-crop]').click()}>Escolher</button>
          </div>
        </div>
      )}
    </div>
  );
}
