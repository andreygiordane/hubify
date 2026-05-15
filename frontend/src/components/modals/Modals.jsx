
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Plus, Send, Video, Clock, Check, Edit, Trash2, 
  Shield, Camera, FileText, Download, FileSpreadsheet, 
  Image as ImageIcon, Phone, PhoneOff, Mic, MicOff, 
  VideoOff, Settings, Volume2, Lock
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

// Componentes de Interface de Chamada (Novo Design Premium)
const PageWrapper = ({ children }) => (
  <div className="fixed inset-0 z-[600] bg-slate-950 text-white font-sans flex items-center justify-center overflow-hidden animate-in fade-in duration-500">
    <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/5 rounded-full blur-[100px]"></div>
    <div className="relative z-10 w-full max-w-lg h-full flex flex-col items-center py-12 md:py-20 px-8">
      {children}
    </div>
  </div>
);

const ContactAvatar = ({ src, name = "U" }) => (
  <div className="relative mb-8 md:mb-10">
    <div className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/80 to-purple-600/80 text-white font-bold shadow-2xl backdrop-blur-md border border-white/10 w-44 h-44 md:w-52 md:h-52 text-5xl md:text-6xl select-none transition-all overflow-hidden">
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
      <div className="absolute -inset-4 rounded-full border border-indigo-400/20 animate-[ping_3s_linear_infinite] opacity-40"></div>
      <div className="absolute -inset-8 rounded-full border border-white/5 animate-[ping_4s_linear_infinite] opacity-20"></div>
    </div>
  </div>
);

const ActionButton = ({ icon: Icon, label, colorClass, onClick, bounce = false }) => (
  <button
    onClick={onClick}
    className="group flex flex-col items-center gap-3 transition-all"
  >
    <div className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full text-white shadow-xl transition-all hover:scale-110 active:scale-90 ${colorClass} ${bounce ? 'animate-bounce' : ''}`}>
      {React.isValidElement(Icon) ? Icon : <Icon size={32} />}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
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
          <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            {outgoingTarget.name}
          </h2>
          <span className="mt-8 text-indigo-400 font-bold uppercase tracking-[0.5em] text-[10px] animate-pulse">
            {isVideo ? 'Iniciando vídeo...' : 'Chamando...'}
          </span>
        </div>

        <div className="pt-10 pb-4">
          <ActionButton
            icon={PhoneOff}
            label="Cancelar"
            colorClass="bg-red-500 hover:bg-red-600 shadow-red-900/20"
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
          <span className="text-indigo-400 font-bold mb-8 animate-pulse text-[10px] md:text-xs uppercase tracking-[0.4em]">
            {isVideo ? 'Chamada de vídeo recebida' : 'Chamada de voz recebida'}
          </span>
          <ContactAvatar src={incomingCall.fromAvatar} name={incomingCall.fromName} />
          <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            {incomingCall.fromName}
          </h2>
        </div>

        <div className="flex gap-12 md:gap-16 items-center pt-10 pb-4">
          <ActionButton
            icon={PhoneOff}
            label="Recusar"
            colorClass="bg-red-500 hover:bg-red-600 shadow-red-900/20"
            onClick={() => onDecline(incomingCall)}
          />
          <ActionButton
            icon={isVideo ? Video : Phone}
            label="Atender"
            colorClass="bg-emerald-500 hover:bg-emerald-600 shadow-emerald-900/20"
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
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-900 p-10 rounded-[3rem] border border-white/5 shadow-2xl">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-white mb-2">Configuração</h2>
          <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-white/10">
            {callType === 'video' ? <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" /> : <div className="flex items-center justify-center h-full"><Mic className="w-12 h-12 text-indigo-500 animate-pulse" /></div>}
          </div>
        </div>
            <div className="space-y-6">
          {callType === 'video' && (
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Câmera</label>
              <select value={selectedVideo} onChange={e => setSelectedVideo(e.target.value)} className="w-full bg-slate-800 text-white p-4 rounded-2xl outline-none">
                {videoDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Câmera'}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Microfone</label>
            <select value={selectedAudio} onChange={e => setSelectedAudio(e.target.value)} className="w-full bg-slate-800 text-white p-4 rounded-2xl outline-none">
              {audioDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Microfone'}</option>)}
            </select>
          </div>
          <div className="pt-4 flex flex-col gap-3">
            <button onClick={() => onComplete({ videoId: selectedVideo, audioId: selectedAudio })} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all"><Check className="mr-2 inline" /> Entrar na Chamada</button>
            <button onClick={onCancel} className="w-full py-4 text-slate-400 font-bold hover:bg-white/5 rounded-2xl">Cancelar</button>
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
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-900">Nova Conversa</h3>
              <button onClick={() => setShowDMModal(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-4 overflow-y-auto">
              {users.filter(u => u.id !== user.id).map(u => (
                <div key={u.id} onClick={() => { startConversation(u.id); setShowDMModal(false); }} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                  <img src={u.avatarUrl} alt={u.name} className="w-10 h-10 rounded-full bg-gray-100"/>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Criar Grupo */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-900">Criar Novo Grupo</h3>
              <button onClick={() => setShowGroupModal(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleCreateGroup} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5">
                <div className="flex flex-col items-center pb-2">
                  <label className="block w-full text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Imagem do Grupo</label>
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                      {newGroupAvatar ? (
                        <img 
                          src={newGroupAvatar} 
                          className="w-24 h-24 rounded-3xl object-cover shadow-xl border-4 border-white transition-transform group-hover:scale-105" 
                          alt="Grupo" 
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300 shadow-inner border-2 border-dashed border-slate-200">
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
                          className="flex-1 py-3.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-100 transition-all border-2 border-dashed border-indigo-200 flex items-center justify-center gap-2"
                        >
                          <Plus size={14} /> Adicionar Foto
                        </button>
                        
                        {newGroupAvatar && (
                          <button 
                            type="button" 
                            onClick={() => setNewGroupAvatar('')}
                            className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-all border-2 border-transparent"
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
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nome do Grupo *</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder="Ex: Time de Vendas, TI, RH..."
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Descrição</label>
                  <textarea
                    value={newGroupDesc}
                    onChange={e => setNewGroupDesc(e.target.value)}
                    placeholder="Qual é o objetivo deste grupo?"
                    rows={2}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Convidar Membros</label>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                    {users.filter(u => u.id !== user.id).map(u => (
                      <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer border border-transparent hover:border-indigo-100 transition-all">
                        <input
                          type="checkbox"
                          checked={selectedGroupMembers.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedGroupMembers(prev => [...prev, u.id]);
                            else setSelectedGroupMembers(prev => prev.filter(id => id !== u.id));
                          }}
                          className="accent-indigo-600"
                        />
                        <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full bg-slate-100" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                          <p className="text-[10px] text-slate-500">{u.role}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedGroupMembers.length > 0 && (
                    <p className="text-xs text-indigo-600 font-bold mt-2 px-1">{selectedGroupMembers.length} membro(s) receberão convite</p>
                  )}
                </div>
              </div>
              <div className="p-4 border-t border-gray-100">
                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all">Criar Grupo e Enviar Convites</button>
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="relative h-32 bg-gradient-to-br from-indigo-600 to-violet-600">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all"
          >
            <X className="w-5 h-5"/>
          </button>
        </div>
        
        <div className="px-8 pb-8 -mt-16 flex flex-col items-center">
          <div className="relative mb-6">
            <img 
              src={contact.avatarUrl || "/image/sem_foto.avif"} 
              alt={contact.name} 
              className="w-32 h-32 rounded-[2.5rem] bg-slate-100 object-cover border-4 border-white shadow-xl"
            />
            {contact.isOnline && (
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white rounded-full shadow-sm" />
            )}
          </div>

          <h3 className="text-2xl font-bold text-slate-800 text-center">{contact.name}</h3>
          <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6">{contact.role || 'Membro do Hubify'}</p>

          <div className="w-full space-y-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sobre</label>
              <p className="text-sm text-slate-600 leading-relaxed italic">
                "{contact.bio || 'Sem descrição no perfil.'}"
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => onStartChat(contact.id)}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <Send className="w-5 h-5" />
                Iniciar Conversa
              </button>
              
              {contact.id !== user.id && (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { handleStartAudioCall(`dm_${[user.id, contact.id].sort().join('_')}`); onClose(); }} className="py-3 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 border border-slate-100">
                    <Phone className="w-4 h-4" />
                    Voz
                  </button>
                  <button onClick={() => { handleStartMeeting(`dm_${[user.id, contact.id].sort().join('_')}`); onClose(); }} className="py-3 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 border border-slate-100">
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 flex items-center justify-between border-b border-slate-100">
          <h3 className="font-bold text-xl text-slate-800">Convidar para o Grupo</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all">
            <X className="w-6 h-6"/>
          </button>
        </div>
        
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            {users.filter(u => u.id !== user?.id).map(u => {
              const isMember = group.members?.includes(u.id);
              const isInvited = groupInvites?.find(i => i.groupId === groupId && i.toId === u.id && i.status === 'pending') || localInvites.has(u.id);

              return (
                <div key={u.id} className={`flex items-center justify-between p-4 rounded-2xl border ${isMember ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <img src={u.avatarUrl} alt={u.name} className="w-10 h-10 rounded-full bg-slate-100" />
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{u.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{u.role}</p>
                    </div>
                  </div>
                  {isMember ? (
                    <span className="px-3 py-1.5 bg-slate-200 text-slate-500 text-[10px] font-bold rounded-lg uppercase tracking-wider">Membro</span>
                  ) : isInvited ? (
                    <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg uppercase tracking-wider border border-indigo-100 italic">Convite Enviado</span>
                  ) : (
                    <button 
                      onClick={() => {
                        setLocalInvites(prev => new Set(prev).add(u.id));
                        handleSendGroupInvite(groupId, u.id);
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                    >
                      Convidar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-8 bg-slate-50">
          <button 
            onClick={onClose}
            className="w-full py-4 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-all"
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl text-slate-800">Segurança</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all">
            <X className="w-6 h-6"/>
          </button>
        </div>
        
        <div className="p-8">
          <p className="text-sm text-slate-500 mb-8">Altere sua senha de acesso. Certifique-se de escolher uma senha forte.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl font-medium">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  placeholder="Digite sua nova senha" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  placeholder="Repita a nova senha" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={isLoading || !newPassword || !confirmPassword}
            className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 flex items-center justify-between border-b border-slate-100">
          <h3 className="font-bold text-xl text-slate-800">Editar Perfil</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all">
            <X className="w-6 h-6"/>
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <img 
                src={avatar || "/image/sem_foto.avif"} 
                alt="Avatar" 
                className="w-32 h-32 rounded-[2.5rem] bg-slate-100 object-cover border-4 border-white shadow-xl transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="text-white w-8 h-8" />
              </div>
            </div>
            <p className="mt-4 text-sm font-bold text-indigo-600 uppercase tracking-widest">Visual Corporativo</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Nome Completo / Exibição</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Como deseja ser chamado na empresa?" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Sobre Mim / Frase</label>
              <textarea 
                value={bio} 
                onChange={e => setBio(e.target.value)} 
                placeholder="Ex: Desenvolvedor apaixonado por inovação | Gerente de TI | Sempre aprendendo..." 
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
              />
              <p className="text-[10px] text-slate-400 mt-1 px-1">{bio.length}/200 caracteres</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-1">
                Escolha seu Avatar Profissional (50 opções)
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 flex flex-col items-center">
                  <div className="w-36 h-36 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center">
                    <img src={avatar || "/image/sem_foto.avif"} alt="Avatar selecionado" className="w-full h-full object-cover" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-700 text-center">Avatar selecionado</p>
                  <p className="text-[12px] text-slate-400 text-center mt-2 px-2">Escolha um avatar que represente seu perfil profissional. Clique para selecionar.</p>
                </div>

                <div className="md:col-span-2">
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Filtrar avatares por nome (ex: Aiden, Lily...)"
                      onChange={(e) => { const q = e.target.value.toLowerCase(); /* simple client-side filter */ }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-4 p-2 max-h-[320px] overflow-y-auto custom-scrollbar">
                    {avatars.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setAvatar(url)}
                        aria-label={`Selecionar avatar ${i + 1}`}
                        className={`w-14 h-14 rounded-full overflow-hidden flex items-center justify-center border-2 transition-transform duration-150 focus:outline-none ${
                          avatar === url ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg scale-105' : 'border-slate-100 hover:scale-105'
                        }`}
                      >
                        <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                        {avatar === url && (
                          <div className="absolute top-1 right-1 bg-indigo-500 rounded-full p-0.5 shadow-md">
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

        <div className="p-8 bg-slate-50 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={isLoading || !name.trim()}
            className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};
