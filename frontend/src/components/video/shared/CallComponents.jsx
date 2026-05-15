import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, 
  Users, MessageSquare, UserPlus, Signal, 
  Smile, Send, X, Hand, Search
} from "lucide-react";

export const EMOJIS = ['😀','😂','🤣','😍','🥰','😎','🤔','😢','😭','😡','👍','👎','🎉','🔥','❤️','💯','👋','👀'];

export const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export function useAudioActivity(stream, isMuted) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  useEffect(() => {
    if (!stream || isMuted) { setIsSpeaking(false); return; }
    let audioContext, analyser, source, animationId;
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;
      source = audioContext.createMediaStreamSource(new MediaStream([audioTracks[0]]));
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        setIsSpeaking((sum / dataArray.length) > 10);
        animationId = requestAnimationFrame(checkVolume);
      };
      checkVolume();
    } catch (e) {}
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (source) source.disconnect();
      if (analyser) analyser.disconnect();
      if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {});
    };
  }, [stream, isMuted]);
  return isSpeaking;
}

export function AudioWave({ isSpeaking }) {
  return (
    <div className="flex gap-[2px] items-center mr-2 h-3">
       <div className={`w-[2px] bg-blue-500 rounded-full transition-all duration-150 ${isSpeaking ? 'h-full animate-pulse' : 'h-1'}`} />
       <div className={`w-[2px] bg-blue-500 rounded-full transition-all duration-150 ${isSpeaking ? 'h-3 animate-bounce' : 'h-1'}`} style={{ animationDelay: '0.1s' }} />
       <div className={`w-[2px] bg-blue-500 rounded-full transition-all duration-150 ${isSpeaking ? 'h-full animate-pulse' : 'h-1'}`} style={{ animationDelay: '0.2s' }} />
    </div>
  );
}

export function SidePanel({ isOpen, onClose, title, icon: Icon, children, isMobileView }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, x: isMobileView ? 0 : 400, y: isMobileView ? 400 : 0 }} 
          animate={{ opacity: 1, x: 0, y: 0 }} 
          exit={{ opacity: 0, x: isMobileView ? 0 : 400, y: isMobileView ? 400 : 0 }}
          className={`fixed border-white/10 bg-[#0a0a0c] flex flex-col shadow-2xl transition-all 
            ${isMobileView ? 'inset-x-0 bottom-0 h-[75%] z-[130] rounded-t-[40px] border-t' : 'right-0 top-0 h-full w-96 z-[60] border-l'}`}
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
            <h3 className="font-bold text-[10px] uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2">
              {Icon && <Icon size={16}/>} {title}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white transition-colors">
              <X size={18}/>
            </button>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ChatSidebar({ isOpen, onClose, messages, sendMessage, isMobileView }) {
  const [inputText, setInputText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim() === "") return;
    sendMessage(inputText);
    setInputText("");
    setShowEmojis(false);
  };

  return (
    <SidePanel isOpen={isOpen} onClose={onClose} title="Chat da Reunião" icon={MessageSquare} isMobileView={isMobileView}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm text-center px-4">
            <MessageSquare size={28} className="mb-2 opacity-50"/>
            Nenhuma mensagem ainda.<br/>Inicie a conversa!
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] text-gray-500 mb-1 px-1">{msg.sender} • {msg.time}</span>
              <div className={`px-4 py-2 rounded-2xl text-sm ${msg.isSelf ? 'bg-blue-600 text-white rounded-br-none' : 'bg-[#2a2f3a] text-gray-200 rounded-bl-none'}`}>
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-black border-t border-white/5 relative">
        <AnimatePresence>
          {showEmojis && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-6 mb-4 bg-zinc-900 border border-white/10 p-3 rounded-2xl grid grid-cols-6 gap-1.5 shadow-2xl z-[70]"
            >
              {EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => setInputText(prev => prev + emoji)} className="text-xl hover:scale-110 transition-transform">
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 bg-zinc-900/50 border border-white/10 rounded-2xl p-1.5 items-center pr-3 shadow-inner">
          <button onClick={() => setShowEmojis(!showEmojis)} className="p-2 text-white/40 hover:text-yellow-400 transition-colors">
            <Smile size={20} />
          </button>
          <input 
            type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Enviar mensagem..."
            className="flex-1 bg-transparent px-4 py-2 text-sm outline-none text-white placeholder:text-white/20"
          />
          <button onClick={handleSend} className="bg-blue-600 p-2.5 rounded-xl shadow-lg hover:bg-blue-500 transition-colors">
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
    </SidePanel>
  );
}

export function PeopleSidebar({ isOpen, onClose, participants, isMobileView, isMicOn }) {
  return (
    <SidePanel isOpen={isOpen} onClose={onClose} title="Pessoas" icon={Users} isMobileView={isMobileView}>
      <div className="p-4 space-y-2 overflow-y-auto">
        {participants.map(p => (
          <div key={p.id} className="flex items-center justify-between p-4 bg-zinc-900/40 border border-white/5 rounded-2xl group transition-all hover:bg-zinc-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-black text-white uppercase border border-white/10 group-hover:border-blue-500/30 transition-colors">
                {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full rounded-full object-cover"/> : p.name[0]}
              </div>
              <span className="text-sm font-bold text-white/90">{p.name} {p.isLocal && <span className="text-blue-500/50 ml-1">(Você)</span>}</span>
            </div>
            <div className="flex gap-2 text-white/40">
              {p.handRaised && <Hand size={16} className="text-yellow-500 fill-yellow-500" />}
              {p.isLocal ? (isMicOn ? <Mic size={16}/> : <MicOff size={16} className="text-red-500"/>) : (p.isMicOn ? <Mic size={16}/> : <MicOff size={16} className="text-red-500"/>)}
            </div>
          </div>
        ))}
      </div>
    </SidePanel>
  );
}

export function InviteModal({ 
  isOpen, onClose, users, statusConfig, currentUser, roomId, callType, onInvite,
  invitedUserIds = new Set(), participants = []
}) {
  const [search, setSearch] = useState('');
  
  const filteredUsers = (users || []).filter(u => 
    u.id !== currentUser?.uid && 
    (u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#0f1115] border border-white/10 rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.8)] w-full max-w-md overflow-hidden relative flex flex-col max-h-[80vh]"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/20">
              <UserPlus size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Convidar</h3>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Equipe Hubify</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all"><X size={20}/></button>
        </div>

        <div className="p-6 bg-black/20">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-white/10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[300px]">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <Users size={32} className="mb-2 opacity-20" />
              <p className="text-sm">Nenhum usuário encontrado</p>
            </div>
          ) : (
            filteredUsers.map(u => {
              const isAlreadyInRoom = participants.some(p => p.uid === u.id || (p.isLocal && currentUser?.uid === u.id));
              const isInvited = invitedUserIds.has(u.id);
              const isBusy = u.status === 'reuniao' || u.status === 'ocupado';
              
              let buttonText = "Convidar";
              let isDisabled = false;
              let buttonClass = "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20";

              if (isAlreadyInRoom) {
                buttonText = "Na reunião";
                isDisabled = true;
                buttonClass = "bg-green-600/20 text-green-500 cursor-not-allowed";
              } else if (isInvited) {
                buttonText = "Convite enviado";
                isDisabled = true;
                buttonClass = "bg-amber-600/20 text-amber-500 cursor-not-allowed";
              } else if (isBusy) {
                buttonText = u.status === 'reuniao' ? "Em reunião" : "Ocupado";
                isDisabled = true;
                buttonClass = "bg-gray-700 text-gray-400 cursor-not-allowed opacity-50";
              }

              return (
                <div key={u.id} className="flex items-center justify-between p-4 hover:bg-white/5 rounded-3xl transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img 
                        src={u.avatarUrl || "/image/sem_foto.avif"} 
                        alt={u.name} 
                        className="w-12 h-12 rounded-2xl object-cover bg-zinc-900 border border-white/5" 
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-[#0f1115] rounded-full ${statusConfig[u.status || (u.isOnline ? 'online' : 'offline')]?.color || 'bg-gray-400'}`}></div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white/90">{u.name}</h4>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{u.status || (u.isOnline ? 'Online' : 'Offline')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onInvite(u)}
                    disabled={isDisabled}
                    className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${buttonClass}`}
                  >
                    {buttonText}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function BottomControls({ 
  isMicOn, toggleMic, isVideoOn, toggleVideo, isHandRaised, toggleHand, 
  screenSharing, shareScreen, onLeave, participantCount, 
  toggleChat, togglePeople, isMobileView, isVoiceMode, toggleInvite
}) {
  return (
    <div className={`absolute ${isMobileView ? 'bottom-6 h-28' : 'bottom-8 h-24'} left-1/2 -translate-x-1/2 z-50 flex items-center`}>
        <div className={`flex items-center ${isMobileView ? 'gap-1' : 'gap-2'} bg-zinc-900/90 backdrop-blur-3xl border border-white/10 p-2.5 rounded-full shadow-[0_25px_60px_rgba(0,0,0,0.8)]`}>
            {/* MEDIA CONTROLS */}
            <div className="flex items-center gap-1.5 px-2 border-r border-white/10">
                <button onClick={toggleMic} className={`w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90 ${!isMicOn ? 'bg-red-500/20 text-red-500 border border-red-500/20' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                    {!isMicOn ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                {!isVoiceMode && (
                  <button onClick={toggleVideo} className={`w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90 ${!isVideoOn ? 'bg-red-500/20 text-red-500 border border-red-500/20' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                      {!isVideoOn ? <VideoOff size={20} /> : <Video size={20} />}
                  </button>
                )}
            </div>

            {/* INTERACTION CONTROLS */}
            <div className={`flex items-center ${isMobileView ? 'gap-1' : 'gap-1.5'} px-2`}>
                <button onClick={togglePeople} className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10 relative transition-all">
                    <Users size={20} />
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full text-[9px] font-black flex items-center justify-center border-2 border-zinc-900 shadow-lg">{participantCount}</div>
                </button>
                <button onClick={toggleChat} className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10 transition-all">
                    <MessageSquare size={20} />
                </button>
                {!isVoiceMode && (
                  <button onClick={toggleHand} className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${isHandRaised ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                      <Hand size={20} fill={isHandRaised ? "currentColor" : "none"} />
                  </button>
                )}
                {!isMobileView && !isVoiceMode && (
                    <button onClick={shareScreen} className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${screenSharing ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                        <MonitorUp size={20} />
                    </button>
                )}
                <button onClick={toggleInvite} className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10 transition-all"><UserPlus size={20} /></button>
            </div>

            <div className="w-px h-8 bg-white/10 mx-1.5" />

            {/* HANG UP BUTTON */}
            <button onClick={onLeave} className={`flex items-center justify-center rounded-full bg-red-600 text-white shadow-xl hover:bg-red-500 active:scale-95 transition-all ${isMobileView ? 'w-11 h-11' : 'px-6 h-11 gap-3'}`}>
                <PhoneOff size={20} fill="currentColor" />
                {!isMobileView && <span className="font-bold text-[10px] tracking-tight uppercase">Encerrar</span>}
            </button>
        </div>
    </div>
  );
}
