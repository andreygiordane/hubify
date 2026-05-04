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
       <div className={`w-[2px] bg-[#25d366] rounded-full transition-all duration-150 ${isSpeaking ? 'h-full animate-pulse' : 'h-1'}`} />
       <div className={`w-[2px] bg-[#25d366] rounded-full transition-all duration-150 ${isSpeaking ? 'h-3 animate-bounce' : 'h-1'}`} style={{ animationDelay: '0.1s' }} />
       <div className={`w-[2px] bg-[#25d366] rounded-full transition-all duration-150 ${isSpeaking ? 'h-full animate-pulse' : 'h-1'}`} style={{ animationDelay: '0.2s' }} />
    </div>
  );
}

export function SidePanel({ isOpen, onClose, title, icon: Icon, children, isMobileView }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
          className={`fixed border-gray-800 bg-[#11141c] flex flex-col shadow-2xl transition-all 
            ${isMobileView ? 'inset-0 w-full h-full z-[100]' : 'right-0 top-0 h-full w-80 z-[60] border-l'}`}
        >
          <div className="px-4 py-3 sm:py-4 border-b border-gray-800 flex justify-between items-center bg-[#0a0d14]">
            <h3 className="font-semibold text-gray-100 flex items-center gap-2 text-sm sm:text-base">
              {Icon && <Icon size={16}/>} {title}
            </h3>
            <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-full text-gray-400 transition-colors">
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

      <div className="p-4 border-t border-gray-800 bg-[#0a0d14] relative">
        <AnimatePresence>
          {showEmojis && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-4 mb-2 bg-[#2a2f3a] border border-gray-700 p-3 rounded-xl grid grid-cols-6 gap-1.5 shadow-xl z-[70]"
            >
              {EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => setInputText(prev => prev + emoji)} className="text-xl hover:scale-110 transition-transform">
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowEmojis(!showEmojis)} className="p-2 text-gray-400 hover:text-yellow-400 transition-colors">
            <Smile size={20} />
          </button>
          <input 
            type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Mensagem..."
            className="flex-1 bg-[#1e232e] border border-gray-800 text-sm rounded-full px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button onClick={handleSend} className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors flex-shrink-0">
            <Send size={16} className="ml-0.5" />
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
          <div key={p.id} className="flex items-center justify-between p-3 bg-[#1e232e] rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white uppercase">
                {p.name[0]}
              </div>
              <span className="text-sm font-medium text-white">{p.name}</span>
            </div>
            <div className="flex gap-2 text-gray-400">
              {p.handRaised && <Hand size={14} className="text-orange-500 fill-orange-500" />}
              {p.isLocal ? (isMicOn ? <Mic size={14} className="text-white"/> : <MicOff size={14} className="text-red-500"/>) : (p.isMicOn ? <Mic size={14} className="text-white"/> : <MicOff size={14} className="text-red-500"/>)}
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#11141c] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <UserPlus size={20} />
            </div>
            <h3 className="text-lg font-semibold text-white">Convidar para chamada</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={18}/></button>
        </div>

        <div className="p-4 bg-[#11141c]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Pesquisar usuários..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1e232e] border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
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
                <div key={u.id} className="flex items-center justify-between p-3 hover:bg-[#1e232e] rounded-xl transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} 
                        alt={u.name} 
                        className="w-10 h-10 rounded-full object-cover bg-gray-800" 
                      />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-[#11141c] rounded-full ${statusConfig[u.status || (u.isOnline ? 'online' : 'offline')]?.color || 'bg-gray-400'}`}></div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">{u.name}</h4>
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{u.status || (u.isOnline ? 'Online' : 'Offline')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onInvite(u)}
                    disabled={isDisabled}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all shadow-lg ${buttonClass}`}
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
    <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 sm:gap-3 bg-[#11141c]/90 backdrop-blur-xl border border-[#1e232e] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl sm:rounded-full shadow-2xl w-max max-w-[98%] overflow-x-auto no-scrollbar">
       <button onClick={toggleMic} className={`p-3 rounded-full flex-shrink-0 transition-colors ${isMicOn ? 'bg-[#3c404b] text-white hover:bg-gray-500' : 'bg-red-500/20 text-red-500'}`}>{isMicOn ? <Mic size={20}/> : <MicOff size={20}/>}</button>
       
       {!isVoiceMode && (
         <button onClick={toggleVideo} className={`p-3 rounded-full flex-shrink-0 transition-colors ${isVideoOn ? 'bg-[#3c404b] text-white hover:bg-gray-500' : 'bg-red-500/20 text-red-500'}`}>{isVideoOn ? <Video size={20}/> : <VideoOff size={20}/>}</button>
       )}
       
       <button onClick={togglePeople} className="p-3 rounded-full flex-shrink-0 bg-[#3c404b] hover:bg-gray-500 text-white relative transition-colors">
          <Users size={20}/>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-[#11141c]">{participantCount}</div>
       </button>
       
       <button onClick={toggleChat} className="p-3 rounded-full flex-shrink-0 bg-[#3c404b] hover:bg-gray-500 text-white transition-colors"><MessageSquare size={20}/></button>
       
       {!isMobileView && !isVoiceMode && (
         <button onClick={shareScreen} className={`p-3 flex-shrink-0 rounded-full transition-colors ${screenSharing ? 'bg-[#25d366] text-[#0a0d14]' : 'bg-[#3c404b] text-white hover:bg-gray-500'}`}><MonitorUp size={20}/></button>
       )}
       
       {!isVoiceMode && (
         <button onClick={toggleHand} className={`p-3 flex-shrink-0 rounded-full transition-colors ${isHandRaised ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-[#3c404b] text-white hover:bg-gray-500'}`}><Hand size={20}/></button>
       )}

       {!isVoiceMode && (
         <button onClick={toggleInvite} className="p-3 flex-shrink-0 rounded-full bg-[#3c404b] hover:bg-gray-500 text-white transition-colors"><UserPlus size={20}/></button>
       )}

       <div className="w-px h-8 bg-gray-700 mx-1 flex-shrink-0"></div>
       
       <button onClick={onLeave} className="p-2.5 sm:p-3 flex-shrink-0 bg-[#ea4335] hover:bg-red-700 text-white rounded-full transition-all shadow-[0_4px_14px_rgba(234,67,53,0.4)]"><PhoneOff size={20}/></button>
    </div>
  );
}
