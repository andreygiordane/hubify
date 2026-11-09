
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Plus, Send, Video, Clock, Check, Edit, Trash2, 
  Shield, Camera, FileText, Download, FileSpreadsheet, 
  Image as ImageIcon, Phone, PhoneOff, Mic, MicOff, 
  VideoOff, Settings, Volume2, Lock
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import Avatar, { presenceOf } from '../ui/Avatar';

// Componentes de Interface de Chamada (Novo Design Premium)
const PageWrapper = ({ children }) => (
  <div className="fixed inset-0 z-[600] bg-slate-950 text-white font-sans flex items-center justify-center overflow-hidden animate-fade-in duration-500">
    <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-brand/20 rounded-full blur-[120px] animate-pulse"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/5 rounded-full blur-[100px]"></div>
    <div className="relative z-10 w-full max-w-lg h-full flex flex-col items-center py-12 md:py-20 px-8">
      {children}
    </div>
  </div>
);

// Avatar grande das telas "chamando" / "recebendo chamada"
const ContactAvatar = ({ src, name = "U" }) => (
  <div className="relative mb-8 md:mb-10">
    <div className="absolute -inset-4 rounded-full border border-white/20 animate-[ping_3s_linear_infinite] opacity-40"></div>
    <div className="absolute -inset-8 rounded-full border border-white/10 animate-[ping_4s_linear_infinite] opacity-20"></div>
    <Avatar src={src} name={name} size={176} className="shadow-pop" />
  </div>
);

const ActionButton = ({ icon: Icon, label, colorClass, onClick, bounce = false }) => (
  <button
    onClick={onClick}
    className="group flex flex-col items-center gap-3 transition-all"
  >
    <div className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full text-white shadow-card transition-all hover:scale-110 active:scale-90 ${colorClass} ${bounce ? 'animate-bounce' : ''}`}>
      {React.isValidElement(Icon) ? Icon : <Icon size={32} />}
    </div>
    <span className="text-[10px] font-bold uppercase text-white/70 group-hover:text-white transition-colors">
      {label}
    </span>
  </button>
);

// Chamada Recebida / Discando
const CallInterface = ({ 
  incomingCall, isOutgoingCall, outgoingTarget, 
  onAccept, onDecline, onCancel, callType
}) => {
  const incomingAudioRef = useRef(new Audio('/audio/toque_chamada_recebida.mp3'));
  const outgoingAudioRef = useRef(new Audio('/audio/toque_chamando.mp3'));

  useEffect(() => {
    const incomingAudio = incomingAudioRef.current;
    incomingAudio.loop = true;
    if (incomingCall) incomingAudio.play().catch(() => {});
    else { incomingAudio.pause(); incomingAudio.currentTime = 0; }
    return () => incomingAudio.pause();
  }, [incomingCall]);

  useEffect(() => {
    const outgoingAudio = outgoingAudioRef.current;
    outgoingAudio.loop = true;
    if (isOutgoingCall) outgoingAudio.play().catch(() => {});
    else { outgoingAudio.pause(); outgoingAudio.currentTime = 0; }
    return () => outgoingAudio.pause();
  }, [isOutgoingCall]);

  if (!incomingCall && !isOutgoingCall) return null;

  // TELA: DISCANDE (OUTGOING)
  if (isOutgoingCall && outgoingTarget) {
    const isVideo = callType === 'video';
    return (
      <PageWrapper>
        <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
          <ContactAvatar src={outgoingTarget.avatarUrl} name={outgoingTarget.name} />
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
            {outgoingTarget.name}
          </h2>
          <span className="mt-8 text-white/70 font-bold uppercase text-[10px] animate-pulse">
            {isVideo ? 'Iniciando vídeo...' : 'Chamando...'}
          </span>
        </div>

        <div className="pt-10 pb-4">
          <ActionButton
            icon={PhoneOff}
            label="Cancelar"
            colorClass="bg-danger hover:bg-danger "
            onClick={onCancel}
          />
        </div>
      </PageWrapper>
    );
  }

  // TELA: RECEBENDO (INCOMING)
  if (incomingCall) {
    const isVideo = incomingCall.type === 'video';
    return (
      <PageWrapper>
        <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
          <span className="text-white/70 font-bold mb-8 animate-pulse text-[10px] md:text-xs uppercase">
            {isVideo ? 'Chamada de vídeo recebida' : 'Chamada de voz recebida'}
          </span>
          <ContactAvatar src={incomingCall.fromAvatar} name={incomingCall.fromName} />
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
            {incomingCall.fromName}
          </h2>
        </div>

        <div className="flex gap-12 md:gap-16 items-center pt-10 pb-4">
          <ActionButton
            icon={PhoneOff}
            label="Recusar"
            colorClass="bg-danger hover:bg-danger "
            onClick={() => onDecline(incomingCall)}
          />
          <ActionButton
            icon={isVideo ? Video : Phone}
            label="Atender"
            colorClass="bg-emerald-500 hover:bg-emerald-600 "
            bounce={true}
            onClick={() => onAccept(incomingCall)}
          />
        </div>
      </PageWrapper>
    );
  }
  return null;
};


// Configuração de Mídia pré-chamada
const MediaSetup = ({ onComplete, onCancel, callType }) => {
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState('');
  const [selectedAudio, setSelectedAudio] = useState('');
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    async function getDevices() {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videos = devices.filter(d => d.kind === 'videoinput');
      const audios = devices.filter(d => d.kind === 'audioinput');
      setVideoDevices(videos); setAudioDevices(audios);
      if (videos[0]) setSelectedVideo(videos[0].deviceId);
      if (audios[0]) setSelectedAudio(audios[0].deviceId);
    }
    getDevices();
  }, []);

  useEffect(() => {
    async function startPreview() {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (callType === 'audio') return;
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: selectedVideo ? { deviceId: { exact: selectedVideo } } : true,
          audio: selectedAudio ? { deviceId: { exact: selectedAudio } } : true
        });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (e) {}
    }
    startPreview();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, [selectedVideo, selectedAudio, callType]);

  return (
    <div className="fixed inset-0 z-[700] bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-900 p-10 rounded-lg border border-white/5 shadow-pop">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-white mb-2">Configuração</h2>
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-white/10">
            {callType === 'video' ? <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" /> : <div className="flex items-center justify-center h-full"><Mic className="w-12 h-12 text-brand animate-pulse" /></div>}
          </div>
        </div>
            <div className="space-y-6">
          {callType === 'video' && (
            <div>
              <label className="block text-ink-3 text-xs font-bold uppercase mb-2">Câmera</label>
              <select value={selectedVideo} onChange={e => setSelectedVideo(e.target.value)} className="w-full bg-slate-800 text-white p-4 rounded-lg outline-none">
                {videoDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Câmera'}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-ink-3 text-xs font-bold uppercase mb-2">Microfone</label>
            <select value={selectedAudio} onChange={e => setSelectedAudio(e.target.value)} className="w-full bg-slate-800 text-white p-4 rounded-lg outline-none">
              {audioDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Microfone'}</option>)}
            </select>
          </div>
          <div className="pt-4 flex flex-col gap-3">
            <button onClick={() => onComplete({ videoId: selectedVideo, audioId: selectedAudio })} className="w-full py-4 bg-brand text-white font-bold rounded-lg hover:bg-brand transition-all"><Check className="mr-2 inline" /> Entrar na Chamada</button>
            <button onClick={onCancel} className="w-full py-4 text-ink-3 font-bold hover:bg-white/5 rounded-lg">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Modals() {
  const { user } = useAuth();
  const { 
    showDMModal, setShowDMModal, showGroupModal, setShowGroupModal,
    showCalendarModal, setShowCalendarModal, users, startConversation,
    handleCreateGroup, newGroupName, setNewGroupName, newGroupDesc, setNewGroupDesc,
    selectedGroupMembers, setSelectedGroupMembers,
    incomingCall, setIncomingCall, isOutgoingCall, setIsOutgoingCall,
    outgoingTarget, setOutgoingTarget, callType, setCallType,
    showMediaSetup, setShowMediaSetup, handleCallComplete, handleCallCancel, handleCallDecline,
    showEditProfileModal, setShowEditProfileModal, handleUpdateProfile,
    showSecurityModal, setShowSecurityModal,
    showAddMemberModal, setShowAddMemberModal, activeRoomId,
    showContactDetailModal, setShowContactDetailModal,
    selectedContactDetail, setSelectedContactDetail,
    newGroupAvatar, setNewGroupAvatar
  } = useChat();

  const { currentUserProfile } = useAuth();
  const groupFileInputRef = React.useRef(null);

  const handleGroupFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewGroupAvatar(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  if (!user) return null;

  return (
    <>
      {/* Chamada Interface */}
      <CallInterface 
        incomingCall={incomingCall} 
        isOutgoingCall={isOutgoingCall} 
        outgoingTarget={outgoingTarget}
        onAccept={(call) => { 
          handleCallComplete({ video: call.type === 'video', audio: true }); 
        }}
        onDecline={(call) => handleCallDecline(call)}
        onCancel={() => handleCallCancel()}
        callType={callType || 'video'}
        setCallType={setCallType}
      />

      {/* Setup de Mídia */}
      {showMediaSetup && (
        <MediaSetup 
          callType={callType || 'video'}
          onComplete={handleCallComplete}
          onCancel={handleCallCancel}
        />
      )}

      {/* Modal: Nova DM */}
      {showDMModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg w-full max-w-md overflow-hidden shadow-pop flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-line flex items-center justify-between">
              <h3 className="font-bold text-lg text-ink">Nova Conversa</h3>
              <button onClick={() => setShowDMModal(false)} className="p-1 text-ink-3 hover:bg-hover rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-4 overflow-y-auto">
              {users.filter(u => u.id !== user.id).map(u => (
                <div key={u.id} onClick={() => { startConversation(u.id); setShowDMModal(false); }} className="flex items-center gap-3 p-3 hover:bg-subtle rounded-md cursor-pointer transition-colors">
                  <img src={u.avatarUrl} alt={u.name} className="w-10 h-10 rounded-full bg-hover"/>
                  <div>
                    <p className="font-semibold text-sm text-ink">{u.name}</p>
                    <p className="text-xs text-ink-2">{u.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Criar Grupo */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg w-full max-w-md overflow-hidden shadow-pop flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-line flex items-center justify-between">
              <h3 className="font-bold text-lg text-ink">Criar Novo Grupo</h3>
              <button onClick={() => setShowGroupModal(false)} className="p-1 text-ink-3 hover:bg-hover rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleCreateGroup} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5">
                <div className="flex flex-col items-center pb-2">
                  <label className="block w-full text-xs font-bold text-ink-2 uppercase mb-4">Imagem do Grupo</label>
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                      {newGroupAvatar ? (
                        <img 
                          src={newGroupAvatar} 
                          className="w-24 h-24 rounded-lg object-cover shadow-card border-4 border-white transition-transform group-hover:scale-105" 
                          alt="Grupo" 
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-hover flex items-center justify-center text-ink-3 shadow-inner border-2 border-dashed border-line">
                          <Camera size={32} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-4 w-full">
                      <input 
                        type="file" 
                        ref={groupFileInputRef} 
                        onChange={handleGroupFileChange} 
                        className="hidden" 
                        accept="image/*" 
                      />
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => groupFileInputRef.current.click()}
                          className="flex-1 py-3.5 bg-brand-soft text-brand text-[10px] font-semibold uppercase rounded-lg hover:bg-brand-soft transition-all border-2 border-dashed border-brand/40 flex items-center justify-center gap-2"
                        >
                          <Plus size={14} /> Adicionar Foto
                        </button>
                        
                        {newGroupAvatar && (
                          <button 
                            type="button" 
                            onClick={() => setNewGroupAvatar('')}
                            className="w-14 h-14 rounded-lg bg-danger-soft text-danger flex items-center justify-center hover:bg-danger-soft transition-all border-2 border-transparent"
                            title="Remover foto"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-2 uppercase mb-2">Nome do Grupo *</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder="Ex: Time de Vendas, TI, RH..."
                    className="w-full border border-line rounded-lg px-4 py-3 text-sm outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-2 uppercase mb-2">Descrição</label>
                  <textarea
                    value={newGroupDesc}
                    onChange={e => setNewGroupDesc(e.target.value)}
                    placeholder="Qual é o objetivo deste grupo?"
                    rows={2}
                    className="w-full border border-line rounded-lg px-4 py-3 text-sm outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/30 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-2 uppercase mb-3">Convidar Membros</label>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                    {users.filter(u => u.id !== user.id).map(u => (
                      <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-subtle rounded-md cursor-pointer border border-transparent hover:border-brand/40 transition-all">
                        <input
                          type="checkbox"
                          checked={selectedGroupMembers.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedGroupMembers(prev => [...prev, u.id]);
                            else setSelectedGroupMembers(prev => prev.filter(id => id !== u.id));
                          }}
                          className="accent-indigo-600"
                        />
                        <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full bg-hover" />
                        <div>
                          <p className="text-sm font-semibold text-ink">{u.name}</p>
                          <p className="text-[10px] text-ink-2">{u.role}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedGroupMembers.length > 0 && (
                    <p className="text-xs text-brand font-bold mt-2 px-1">{selectedGroupMembers.length} membro(s) receberão convite</p>
                  )}
                </div>
              </div>
              <div className="p-4 border-t border-line">
                <button type="submit" className="w-full bg-brand text-white py-3 rounded-md font-bold hover:bg-brand-hover transition-all">Criar Grupo e Enviar Convites</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Perfil e Segurança migrados para a página de Configurações */}
      {/* Modal: Adicionar Membro */}
      {showAddMemberModal && (
        <AddMemberModal 
          groupId={activeRoomId}
          onClose={() => setShowAddMemberModal(false)}
        />
      )}

      {/* Modal: Detalhes do Contato / Perfil de Membro */}
      {showContactDetailModal && selectedContactDetail && (
        <ContactDetailModal 
          contact={selectedContactDetail}
          onClose={() => setShowContactDetailModal(false)}
          onStartChat={(id) => {
            startConversation(id);
            setShowContactDetailModal(false);
          }}
        />
      )}
    </>
  );
}

const ContactDetailModal = ({ contact, onClose, onStartChat }) => {
  return (
    <div className="fixed inset-0 bg-black/40 z-[250] flex items-center justify-center p-4">
      <div className="bg-surface rounded-lg w-full max-w-sm overflow-hidden shadow-pop animate-fade-in duration-200">
        <div className="relative h-32 bg-gradient-to-br from-brand to-brand-hover">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all"
          >
            <X className="w-5 h-5"/>
          </button>
        </div>
        
        <div className="px-8 pb-8 -mt-16 flex flex-col items-center">
          <div className="relative mb-6">
            <div className="rounded-full ring-4 ring-surface"><Avatar src={contact.avatarUrl} name={contact.name} size={128} status={presenceOf(contact)} /></div>
          </div>

          <h3 className="text-2xl font-bold text-ink text-center">{contact.name}</h3>
          <p className="text-xs font-semibold text-brand uppercase mb-6">{contact.role || 'Membro do Hubify'}</p>

          <div className="w-full space-y-6">
            <div className="bg-subtle p-4 rounded-lg border border-line text-center">
              <label className="block text-[10px] font-bold text-ink-3 uppercase mb-1">Sobre</label>
              <p className="text-sm text-ink-2 leading-relaxed italic">
                "{contact.bio || 'Sem descrição no perfil.'}"
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => onStartChat(contact.id)}
                className="w-full py-4 bg-brand text-white font-bold rounded-lg hover:bg-brand-hover shadow-card transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <Send className="w-5 h-5" />
                Iniciar Conversa
              </button>
              
              {contact.id !== user.id && (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { handleStartAudioCall(`dm_${[user.id, contact.id].sort().join('_')}`); onClose(); }} className="py-3 bg-subtle text-ink-2 font-bold rounded-md hover:bg-hover transition-all flex items-center justify-center gap-2 border border-line">
                    <Phone className="w-4 h-4" />
                    Voz
                  </button>
                  <button onClick={() => { handleStartMeeting(`dm_${[user.id, contact.id].sort().join('_')}`); onClose(); }} className="py-3 bg-subtle text-ink-2 font-bold rounded-md hover:bg-hover transition-all flex items-center justify-center gap-2 border border-line">
                    <Video className="w-4 h-4" />
                    Vídeo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddMemberModal = ({ groupId, onClose }) => {
  const { users, groups, groupInvites, handleSendGroupInvite } = useChat();
  const { user } = useAuth();
  const [localInvites, setLocalInvites] = useState(new Set());
  const group = groups.find(g => g.id === groupId);
  
  if (!group) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-surface rounded-lg w-full max-w-md overflow-hidden shadow-pop animate-fade-in duration-200">
        <div className="p-8 flex items-center justify-between border-b border-line">
          <h3 className="font-bold text-xl text-ink">Convidar para o Grupo</h3>
          <button onClick={onClose} className="p-2 text-ink-3 hover:bg-hover rounded-full transition-all">
            <X className="w-6 h-6"/>
          </button>
        </div>
        
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            {users.filter(u => u.id !== user?.id).map(u => {
              const isMember = group.members?.includes(u.id);
              const isInvited = groupInvites?.find(i => i.groupId === groupId && i.toId === u.id && i.status === 'pending') || localInvites.has(u.id);

              return (
                <div key={u.id} className={`flex items-center justify-between p-4 rounded-lg border ${isMember ? 'bg-subtle border-line' : 'bg-surface border-line'}`}>
                  <div className="flex items-center gap-3">
                    <img src={u.avatarUrl} alt={u.name} className="w-10 h-10 rounded-full bg-hover" />
                    <div>
                      <p className="font-bold text-ink text-sm">{u.name}</p>
                      <p className="text-[10px] text-ink-2 uppercase font-bold tracking-wider">{u.role}</p>
                    </div>
                  </div>
                  {isMember ? (
                    <span className="px-3 py-1.5 bg-hover text-ink-2 text-[10px] font-bold rounded-lg uppercase tracking-wider">Membro</span>
                  ) : isInvited ? (
                    <span className="px-3 py-1.5 bg-brand-soft text-brand text-[10px] font-bold rounded-lg uppercase tracking-wider border border-brand/40 italic">Convite Enviado</span>
                  ) : (
                    <button 
                      onClick={() => {
                        setLocalInvites(prev => new Set(prev).add(u.id));
                        handleSendGroupInvite(groupId, u.id);
                      }}
                      className="px-4 py-2 bg-brand text-white text-xs font-bold rounded-md hover:bg-brand-hover transition-all shadow-card"
                    >
                      Convidar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-8 bg-subtle">
          <button 
            onClick={onClose}
            className="w-full py-4 text-ink-2 font-bold hover:bg-hover rounded-lg transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

const SecurityModal = ({ user, onClose, onSave }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordRequirements = [
    { test: (value) => value.length >= 8 },
    { test: (value) => /[0-9]/.test(value) },
    { test: (value) => /[!@#$%^&*]/.test(value) },
    { test: (value) => /[A-Z]/.test(value) },
  ];

  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!passwordRequirements.every((rule) => rule.test(newPassword))) {
      setError('A senha deve ter 8 caracteres, número, caractere especial e letra maiúscula.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await onSave({ password: newPassword });
      onClose();
    } catch (err) {
      setError('Erro ao alterar senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-surface rounded-lg w-full max-w-md overflow-hidden shadow-pop animate-fade-in duration-200">
        <div className="p-8 flex items-center justify-between border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-soft rounded-md flex items-center justify-center text-brand">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl text-ink">Segurança</h3>
          </div>
          <button onClick={onClose} className="p-2 text-ink-3 hover:bg-hover rounded-full transition-all">
            <X className="w-6 h-6"/>
          </button>
        </div>
        
        <div className="p-8">
          <p className="text-sm text-ink-2 mb-8">Altere sua senha de acesso. Certifique-se de escolher uma senha forte.</p>

          {error && (
            <div className="mb-6 p-4 bg-danger-soft border border-red-100 text-danger text-sm rounded-lg font-medium">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-ink-2 uppercase mb-2 px-1">Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3 w-5 h-5" />
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  placeholder="Digite sua nova senha" 
                  className="w-full bg-subtle border border-line rounded-lg pl-12 pr-6 py-4 text-ink outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-ink-2 uppercase mb-2 px-1">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3 w-5 h-5" />
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  placeholder="Repita a nova senha" 
                  className="w-full bg-subtle border border-line rounded-lg pl-12 pr-6 py-4 text-ink outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-subtle flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-ink-2 font-bold hover:bg-hover rounded-lg transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={isLoading || !newPassword || !confirmPassword}
            className="flex-1 py-4 bg-brand text-white font-bold rounded-lg hover:bg-brand-hover shadow-card transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Atualizar Senha'}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditProfileModal = ({ user, profile, onClose, onSave }) => {
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatar, setAvatar] = useState(profile?.avatarUrl || '');
  const [isLoading, setIsLoading] = useState(false);

  // Lista única de 50 sementes variadas para gerar 50 modelos adultos mistos
  const avatarSeeds = [
    'Aiden', 'Aneka', 'Caleb', 'Jocelyn', 'Christian', 'Abby', 'George', 'Amaya', 'Jack', 'Bibi',
    'Jasper', 'Brooklynn', 'Julian', 'Destiny', 'Owen', 'Emery', 'Sebastian', 'Gracie', 'Thomas', 'Isabella',
    'Felix', 'Kimberly', 'Alexander', 'Lily', 'Oliver', 'Mia', 'Leo', 'Ava', 'Lucas', 'Sophia',
    'Mason', 'Charlotte', 'Ethan', 'Amelia', 'James', 'Evelyn', 'Liam', 'Abigail', 'Noah', 'Harper',
    'William', 'Emily', 'Benjamin', 'Madison', 'Michael', 'Elizabeth', 'Elijah', 'Sofia', 'Matthew', 'Avery'
  ];

  const avatars = avatarSeeds.map(seed => 
    `https://api.dicebear.com/7.x/big-smile/svg?seed=${seed}&backgroundColor=f87171,fb923c,fbbf24,4ade80,60a5fa,818cf8,a78bfa,f472b6&v=5`
  );

  const handleSave = async () => {
    setIsLoading(true);
    await onSave({ displayName: name, name, avatarUrl: avatar, bio });
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-surface rounded-lg w-full max-w-lg overflow-hidden shadow-pop animate-fade-in duration-200">
        <div className="p-8 flex items-center justify-between border-b border-line">
          <h3 className="font-bold text-xl text-ink">Editar Perfil</h3>
          <button onClick={onClose} className="p-2 text-ink-3 hover:bg-hover rounded-full transition-all">
            <X className="w-6 h-6"/>
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <img 
                src={avatar || "/image/sem_foto.avif"} 
                alt="Avatar" 
                className="w-32 h-32 rounded-lg bg-hover object-cover border-4 border-white shadow-card transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="text-white w-8 h-8" />
              </div>
            </div>
            <p className="mt-4 text-sm font-bold text-brand uppercase">Visual Corporativo</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-ink-2 uppercase mb-2 px-1">Nome Completo / Exibição</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Como deseja ser chamado na empresa?" 
                className="w-full bg-subtle border border-line rounded-lg px-6 py-4 text-ink outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-ink-2 uppercase mb-2 px-1">Sobre Mim / Frase</label>
              <textarea 
                value={bio} 
                onChange={e => setBio(e.target.value)} 
                placeholder="Ex: Desenvolvedor apaixonado por inovação | Gerente de TI | Sempre aprendendo..." 
                rows={3}
                className="w-full bg-subtle border border-line rounded-lg px-6 py-4 text-ink outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all resize-none"
              />
              <p className="text-[10px] text-ink-3 mt-1 px-1">{bio.length}/200 caracteres</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-ink-2 uppercase mb-4 px-1">
                Escolha seu Avatar Profissional (50 opções)
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 flex flex-col items-center">
                  <div className="w-36 h-36 rounded-full overflow-hidden bg-hover border-4 border-white shadow-card flex items-center justify-center">
                    <img src={avatar || "/image/sem_foto.avif"} alt="Avatar selecionado" className="w-full h-full object-cover" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-ink-2 text-center">Avatar selecionado</p>
                  <p className="text-[12px] text-ink-3 text-center mt-2 px-2">Escolha um avatar que represente seu perfil profissional. Clique para selecionar.</p>
                </div>

                <div className="md:col-span-2">
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Filtrar avatares por nome (ex: Aiden, Lily...)"
                      onChange={(e) => { const q = e.target.value.toLowerCase(); /* simple client-side filter */ }}
                      className="w-full bg-subtle border border-line rounded-lg px-4 py-2 text-ink outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-4 p-2 max-h-[320px] overflow-y-auto custom-scrollbar">
                    {avatars.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setAvatar(url)}
                        aria-label={`Selecionar avatar ${i + 1}`}
                        className={`w-14 h-14 rounded-full overflow-hidden flex items-center justify-center border-2 transition-transform duration-150 focus:outline-none ${
                          avatar === url ? 'border-brand ring-2 ring-brand/30 shadow-card scale-105' : 'border-line hover:scale-105'
                        }`}
                      >
                        <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                        {avatar === url && (
                          <div className="absolute top-1 right-1 bg-brand rounded-full p-0.5 shadow-card">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-subtle flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-ink-2 font-bold hover:bg-hover rounded-lg transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={isLoading || !name.trim()}
            className="flex-1 py-4 bg-brand text-white font-bold rounded-lg hover:bg-brand-hover shadow-card transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};
