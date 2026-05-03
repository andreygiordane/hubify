import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from '../../context/ChatContext';
import { 
  Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, 
  Users, MessageSquare, UserPlus, Signal, 
  Smile, Send, X, Check, Copy, EyeOff, Eye, Hand, Search
} from "lucide-react";

// Wrapper Nativo do WebRTC
class Peer {
  constructor({ initiator, trickle = true, stream }) {
    this._pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    this.handlers = {};
    this.trickle = trickle;
    this.candidateQueue = [];
    
    if (stream) stream.getTracks().forEach(track => this._pc.addTrack(track, stream));
    
    this._pc.onicecandidate = (e) => {
      if (!this.trickle && !e.candidate) this.emit("signal", this._pc.localDescription);
      else if (this.trickle && e.candidate) this.emit("signal", { candidate: e.candidate });
    };
    
    this._pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) this.emit("stream", e.streams[0]);
    };

    if (initiator) {
      this._pc.createOffer().then(offer => {
        return this._pc.setLocalDescription(offer).then(() => {
          if (this.trickle) this.emit("signal", offer);
        });
      }).catch(err => console.error(err));
    }
  }
  
  on(event, fn) { this.handlers[event] = fn; }
  emit(event, data) { if (this.handlers[event]) this.handlers[event](data); }
  
  signal(data) {
    if (!data) return;
    if (data.type === 'offer' || data.type === 'answer') {
      this._pc.setRemoteDescription(new RTCSessionDescription(data))
        .then(() => { 
           // Process queued candidates
           this.candidateQueue.forEach(candidate => {
               this._pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => console.error(err));
           });
           this.candidateQueue = [];

           if (data.type === 'offer') {
             return this._pc.createAnswer().then(answer => {
               return this._pc.setLocalDescription(answer).then(() => {
                 if (this.trickle) this.emit("signal", answer);
               });
             });
           }
        })
        .catch(err => console.error(err));
    } else if (data.candidate) {
      if (this._pc.remoteDescription) {
        this._pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(err => console.error(err));
      } else {
        this.candidateQueue.push(data.candidate);
      }
    }
  }
  
  destroy() {
    this._pc.close();
  }
}

const checkIsMobileWindow = () => typeof window !== "undefined" && window.innerWidth < 768;
const EMOJIS = ['😀','😂','🤣','😍','🥰','😎','🤔','😢','😭','😡','👍','👎','🎉','🔥','❤️','💯','👋','👀'];

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

function useAudioActivity(stream, isMuted) {
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

function AudioWave({ isSpeaking }) {
  return (
    <div className="flex gap-[2px] items-center mr-2 h-3">
       <div className={`w-[2px] bg-[#25d366] rounded-full transition-all duration-150 ${isSpeaking ? 'h-full animate-pulse' : 'h-1'}`} />
       <div className={`w-[2px] bg-[#25d366] rounded-full transition-all duration-150 ${isSpeaking ? 'h-3 animate-bounce' : 'h-1'}`} style={{ animationDelay: '0.1s' }} />
       <div className={`w-[2px] bg-[#25d366] rounded-full transition-all duration-150 ${isSpeaking ? 'h-full animate-pulse' : 'h-1'}`} style={{ animationDelay: '0.2s' }} />
    </div>
  );
}

function SidePanel({ isOpen, onClose, title, icon: Icon, children, isMobileView }) {
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

function ChatSidebar({ isOpen, onClose, messages, sendMessage, isMobileView }) {
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

function PeopleSidebar({ isOpen, onClose, participants, isMobileView, isMicOn }) {
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

function InviteModal({ isOpen, onClose, users, statusConfig, currentUser, roomId, callType, onInvite }) {
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
            filteredUsers.map(u => (
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
                  disabled={u.status === 'reuniao'}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all shadow-lg ${
                    u.status === 'reuniao' 
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                  }`}
                >
                  {u.status === 'reuniao' ? 'Em reunião' : 'Convidar'}
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

function DesktopVideoTile({ stream, name, avatarUrl, muted = false, isLocal = false, handRaised = false }) {
  const ref = useRef(null);
  const isSpeaking = useAudioActivity(stream, muted);

  useEffect(() => {
    if (ref.current && stream) { ref.current.srcObject = stream; }
  }, [stream]);

  return (
    <div className={`relative w-full h-full rounded-[24px] overflow-hidden bg-[#1e232e] border-2 transition-all duration-300 shadow-lg 
      ${handRaised ? 'border-orange-500 ring-4 ring-orange-500/20' : isSpeaking ? 'border-indigo-500' : 'border-transparent'}`}>
      
      {stream ? (
        <video ref={ref} autoPlay playsInline muted={isLocal || muted} className={`w-full h-full object-cover`} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-800">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={name} 
              className={`w-24 h-24 rounded-full object-cover border-4 transition-all duration-300 ${isSpeaking ? 'border-indigo-400 scale-110 shadow-[0_0_30px_rgba(79,70,229,0.6)]' : 'border-transparent'}`} 
            />
          ) : (
            <div className={`w-24 h-24 rounded-full flex items-center justify-center bg-gray-700 text-white font-bold text-2xl transition-all duration-300 ${isSpeaking ? 'ring-4 ring-indigo-400 bg-gray-600 scale-110 shadow-[0_0_30px_rgba(79,70,229,0.6)]' : ''}`}>
              {(name || 'U').substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      )}
      
      <div className="absolute bottom-3 left-3 bg-[#11141c]/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-1.5 shadow-sm">
        <AudioWave isSpeaking={isSpeaking} />
        {name}
      </div>

      <AnimatePresence>
        {handRaised && (
          <motion.div initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }} 
            className="absolute top-4 right-4 bg-orange-500 text-white p-2.5 rounded-full shadow-xl">
            <Hand size={20} fill="currentColor" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileVoiceUI({ stream, isMicOn, time, participantName, participantAvatar }) {
  const circularBarsRef = useRef([]);
  const linearBarsRef = useRef([]);
  const numCircularBars = 60; 
  const numLinearBars = 21;

  useEffect(() => {
    if (!stream || !isMicOn) {
      circularBarsRef.current.forEach(bar => { if (bar) bar.style.height = '4px'; });
      linearBarsRef.current.forEach(bar => { if (bar) bar.style.height = '4px'; });
      return;
    }
    let audioContext, analyser, source, animationId;
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 128; 
      analyser.smoothingTimeConstant = 0.7; 
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        source = audioContext.createMediaStreamSource(new MediaStream([audioTracks[0]]));
        source.connect(analyser);
      }
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const draw = () => {
        analyser.getByteFrequencyData(dataArray);
        circularBarsRef.current.forEach((bar, i) => {
          if (bar) {
            const val = dataArray[i] || 0; 
            const height = 4 + (val / 255) * 45; 
            bar.style.height = `${height}px`;
          }
        });
        linearBarsRef.current.forEach((bar, i) => {
          if (bar) {
            const centerDist = Math.abs((numLinearBars / 2) - i);
            const valIndex = Math.min(dataArray.length - 1, centerDist * 2);
            const val = dataArray[valIndex] || 0;
            const edgeDamping = Math.max(0, 1 - (centerDist / (numLinearBars / 2)));
            const height = 4 + ((val / 255) * 20 * edgeDamping);
            bar.style.height = `${height}px`;
          }
        });
        animationId = requestAnimationFrame(draw);
      };
      draw();
    } catch (e) {}
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (source) source.disconnect();
      if (analyser) analyser.disconnect();
      if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {});
    };
  }, [stream, isMicOn]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center pb-24 z-10 w-full h-full relative">
      <div className="relative w-64 h-64 flex items-center justify-center">
        <img src={participantAvatar} alt={participantName} className="w-44 h-44 rounded-full object-cover z-10 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-[#1e232e]" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {Array.from({ length: numCircularBars }).map((_, i) => (
            <div key={i} className="absolute top-1/2 left-1/2 w-0 h-0">
              <div ref={el => circularBarsRef.current[i] = el}
                className="absolute bottom-0 left-1/2 bg-indigo-500 rounded-full transition-all duration-75 ease-out shadow-[0_0_8px_rgba(79,70,229,0.8)]"
                style={{ width: '3px', height: '4px', transformOrigin: 'bottom center', transform: `translateX(-50%) rotate(${i * (360 / numCircularBars)}deg) translateY(-95px)` }}
              />
            </div>
          ))}
        </div>
      </div>
      
      <h2 className="text-2xl font-medium mt-10 tracking-wide text-center text-gray-100">{participantName}</h2>
      <p className="text-sm text-gray-500 mt-2">{formatTime(time)}</p>
      
      <div className="flex items-center justify-center gap-1.5 h-12 mt-6">
          {Array.from({ length: numLinearBars }).map((_, i) => (
            <div 
              key={i} ref={el => linearBarsRef.current[i] = el}
              className="w-1.5 bg-indigo-500 rounded-full transition-all duration-75 ease-out shadow-[0_0_6px_rgba(79,70,229,0.6)]"
              style={{ height: '4px' }}
            />
          ))}
      </div>
    </div>
  );
}

function BottomControls({ 
  isMicOn, toggleMic, isVideoOn, toggleVideo, isHandRaised, toggleHand, 
  screenSharing, shareScreen, onLeave, participantCount, 
  toggleChat, togglePeople, isMobileView, isVoiceMode, toggleInvite
}) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 bg-[#11141c] border border-[#1e232e] px-4 py-3 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.6)] w-max max-w-[95%] overflow-x-auto no-scrollbar">
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
       
       <button onClick={onLeave} className="p-3 flex-shrink-0 bg-[#ea4335] hover:bg-red-700 text-white rounded-full transition-all shadow-[0_4px_14px_rgba(234,67,53,0.4)]"><PhoneOff size={20}/></button>
    </div>
  );
}

export default function MeetingInterface({ 
  roomId, currentUser, socket, callType, onLeave 
}) {
  const { users, statusConfig, handleInviteToCall } = useChat();
  const [streams, setStreams] = useState({});
  const [localStream, setLocalStream] = useState(null);       
  const [cameraStream, setCameraStream] = useState(null);     
  const [screenSharing, setScreenSharing] = useState(false);
  const [hasConnected, setHasConnected] = useState(false);
  
  const [windowIsMobile, setWindowIsMobile] = useState(checkIsMobileWindow());
  const [time, setTime] = useState(0);

  // Proteção contra F5 e fechamento acidental
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      const msg = 'A chamada será encerrada se você sair ou atualizar a página. Deseja continuar?';
      e.returnValue = msg;
      return msg;
    };

    const handleKeyDown = (e) => {
      // Bloquear F5 (116) e Ctrl+R (82 + ctrl)
      if (e.keyCode === 116 || (e.ctrlKey && e.keyCode === 82)) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  
  // Transforma callType 'audio' em voice mode automaticamente
  const isVoiceMode = callType === 'audio'; 
  
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(!isVoiceMode);
  const [isHandRaised, setIsHandRaised] = useState(false); 

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCamHidden, setIsCamHidden] = useState(false); 

  const [messages, setMessages] = useState([{ sender: 'Sistema', text: `Você entrou na sala!`, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), isSelf: false }]);
  const [roomParticipants, setRoomParticipants] = useState([]);

  const peersRef = useRef([]);

  // Auto-leave for DMs (Mantido como fallback, mas o evento 'call-ended' é o principal agora)
  useEffect(() => {
    if (roomId && roomId.startsWith('dm_')) {
      if (roomParticipants.length > 1) {
        setHasConnected(true);
      } else if (hasConnected && roomParticipants.length <= 1) {
        onLeave();
      }
    }
  }, [roomParticipants, roomId, hasConnected, onLeave]);

  // Synchronize internal state with server room-participants
  const allParticipants = [
    { 
      id: socket?.id || 'local', 
      stream: localStream, 
      isLocal: true, 
      name: currentUser?.name || 'Você (Eu)', 
      avatarUrl: currentUser?.avatarUrl,
      handRaised: isHandRaised, 
      isMicOn, 
      isCamOn: isVideoOn 
    },
    ...Object.entries(streams).map(([socketId, stream]) => {
       const serverState = roomParticipants.find(p => p.socketId === socketId);
       return {
         id: socketId, 
         stream, 
         isLocal: false, 
         name: serverState?.name || `Convidado ${socketId.substring(0,4)}`, 
         avatarUrl: serverState?.avatarUrl,
         handRaised: serverState?.isHandRaised || false,
         isMicOn: serverState?.isMicOn ?? true,
         isCamOn: serverState?.isCamOn ?? true
       };
    })
  ];

  const getGridClasses = (count) => {
    if (count === 1) return "grid-cols-1 grid-rows-1 max-w-4xl mx-auto";
    if (count === 2) return "grid-cols-1 md:grid-cols-2 grid-rows-1";
    if (count <= 4) return "grid-cols-2 grid-rows-2";
    return "grid-cols-2 lg:grid-cols-3 grid-rows-2";
  };

  const activeRemote = allParticipants.length > 1 ? allParticipants[1] : null;

  useEffect(() => {
    const timer = setInterval(() => setTime(t => t + 1), 1000);
    const handleResize = () => setWindowIsMobile(checkIsMobileWindow());
    window.addEventListener("resize", handleResize);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener("resize", handleResize);
      peersRef.current.forEach(p => p.peer.destroy());
      
      // Garantir que todos os tracks de mídia sejam parados ao sair
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop();
          console.log(`[MEDIA] Track ${track.kind} parado.`);
        });
      }
      if (cameraStream && cameraStream !== localStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream, cameraStream]);

  // Efeito separado para inicializar mídia e socket quando ambos estiverem prontos
  useEffect(() => {
    if (socket && roomId && !hasConnected) {
      initMedia();
    }
  }, [socket, roomId]);

  // Update backend state
  useEffect(() => {
    if (socket && roomId) {
      socket.emit('update-user-state', { roomId, state: { isMicOn, isCamOn: isVideoOn, isHandRaised } });
    }
  }, [isMicOn, isVideoOn, isHandRaised]);

  const initMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: !isVoiceMode, audio: true });
      setLocalStream(stream);
      setCameraStream(stream);

      if (socket) {
        socket.emit("join-room", { 
          roomId, 
          uid: currentUser.uid, 
          name: currentUser.name,
          avatarUrl: currentUser.avatarUrl
        });
        
        socket.on('room-participants', updated => setRoomParticipants(updated));
        socket.on('receive-chat', msg => setMessages(prev => [...prev, { sender: msg.sender, text: msg.text, time: new Date().toLocaleTimeString(), isSelf: false }]));
        socket.on('call-ended', () => {
          console.log("Chamada encerrada pelo outro participante.");
          onLeave();
        });

        socket.on("all-users", users => {
          users.forEach(id => {
            const peer = createPeer(id, socket.id, stream);
            peer.on("stream", s => setStreams(prev => ({ ...prev, [id]: s })));
            peersRef.current.push({ peerID: id, peer });
          });
        });
        
        socket.on("user-joined", payload => {
          const existingPeer = peersRef.current.find(p => p.peerID === payload.callerID);
          if (existingPeer) {
            existingPeer.peer.signal(payload.signal);
          } else {
            const peer = addPeer(payload.signal, payload.callerID, stream);
            peer.on("stream", s => setStreams(prev => ({ ...prev, [payload.callerID]: s })));
            peersRef.current.push({ peerID: payload.callerID, peer });
          }
        });
        
        socket.on("receiving-returned-signal", p => {
          const item = peersRef.current.find(i => i.peerID === p.id);
          if (item) item.peer.signal(p.signal);
        });

        socket.on("user-disconnected", userId => {
          console.log(`[NETWORK] User ${userId} disconnected.`);
          
          // Encontrar nome do participante para o chat
          setRoomParticipants(currentParticipants => {
            const participant = currentParticipants.find(p => p.socketId === userId);
            if (participant) {
              setMessages(prev => [...prev, { 
                sender: 'Sistema', 
                text: `${participant.name} saiu da reunião.`, 
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
                isSelf: false 
              }]);
            }
            return currentParticipants.filter(p => p.socketId !== userId);
          });

          // Limpar Peer e Stream
          const peerObj = peersRef.current.find(p => p.peerID === userId);
          if (peerObj) {
            peerObj.peer.destroy();
            peersRef.current = peersRef.current.filter(p => p.peerID !== userId);
          }
          setStreams(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        });
      }
    } catch (err) { console.error(err); }
  };

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({ initiator: true, trickle: true, stream });
    peer.on("signal", signal => socket.emit("sending-signal", { userToSignal, callerID, signal }));
    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({ initiator: false, trickle: true, stream });
    peer.on("signal", signal => socket.emit("returning-signal", { signal, callerID }));
    peer.signal(incomingSignal);
    return peer;
  }

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) { audioTrack.enabled = !audioTrack.enabled; setIsMicOn(audioTrack.enabled); }
    }
  };

  const toggleVideo = () => {
    if (cameraStream) {
      const videoTrack = cameraStream.getVideoTracks()[0];
      if (videoTrack) { videoTrack.enabled = !videoTrack.enabled; setIsVideoOn(videoTrack.enabled); }
    }
  };

  const shareScreen = async () => {
    try {
      if (screenSharing) {
        setLocalStream(cameraStream);
        const videoTrack = cameraStream.getVideoTracks()[0];
        peersRef.current.forEach(({ peer }) => {
          const sender = peer._pc.getSenders().find(s => s.track && s.track.kind === "video");
          if (sender) sender.replaceTrack(videoTrack);
        });
        setScreenSharing(false);
        return;
      }
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = screenStream.getVideoTracks()[0];
      setScreenSharing(true);
      setLocalStream(new MediaStream([track, cameraStream.getAudioTracks()[0]]));

      peersRef.current.forEach(({ peer }) => {
        const sender = peer._pc.getSenders().find(s => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(track);
      });
      track.onended = () => {
        setScreenSharing(false);
        setLocalStream(cameraStream);
        peersRef.current.forEach(({ peer }) => {
            const sender = peer._pc.getSenders().find(s => s.track && s.track.kind === "video");
            if (sender) sender.replaceTrack(cameraStream.getVideoTracks()[0]);
        });
      };
    } catch (err) { setScreenSharing(false); }
  };

  const handleSendMessage = (text) => {
    const msg = { sender: currentUser.name, text };
    socket.emit('send-chat', { roomId, message: msg });
    setMessages(prev => [...prev, { ...msg, time: new Date().toLocaleTimeString(), isSelf: true }]);
  };

  const handleExit = () => {
    if (socket && roomId) {
      if (roomId.startsWith('dm_')) {
        socket.emit('end-call', { roomId });
      } else {
        socket.emit('leave-room', { roomId });
      }
    }
    onLeave();
  };

  if (isVoiceMode) {
    return (
      <div className="h-screen w-full bg-[#11141c] flex flex-col relative">
        {allParticipants.filter(p => !p.isLocal).map(p => (
           <audio key={p.id} autoPlay playsInline ref={el => { if (el && p.stream && el.srcObject !== p.stream) el.srcObject = p.stream }} />
        ))}
        
        <header className="px-8 py-5 flex justify-center items-center z-40 shrink-0">
            <img src="/image/logo.png" alt="Hubify" className="h-8 w-auto object-contain" />
        </header>
        <MobileVoiceUI 
          stream={activeRemote?.stream || localStream} 
          isMicOn={isMicOn} 
          time={time} 
          participantName={activeRemote?.name || "Aguardando convidados..."} 
          participantAvatar={activeRemote?.avatarUrl || currentUser.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"} 
        />
        
        <BottomControls isMicOn={isMicOn} toggleMic={toggleMic} isVideoOn={isVideoOn} toggleVideo={toggleVideo} isHandRaised={isHandRaised} toggleHand={() => setIsHandRaised(!isHandRaised)} screenSharing={screenSharing} shareScreen={shareScreen} onLeave={handleExit} participantCount={allParticipants.length} toggleChat={() => setIsChatOpen(true)} togglePeople={() => setIsPeopleOpen(true)} isMobileView={windowIsMobile} isVoiceMode={true} toggleInvite={() => setIsInviteOpen(true)} />
        
        <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} messages={messages} sendMessage={handleSendMessage} isMobileView={windowIsMobile} />
        <PeopleSidebar isOpen={isPeopleOpen} onClose={() => setIsPeopleOpen(false)} participants={allParticipants} isMobileView={windowIsMobile} isMicOn={isMicOn} />
        <InviteModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#0a0d14] text-white flex flex-col font-sans overflow-hidden relative">
      <header className="px-8 py-5 flex justify-between items-center z-40">
        <div className="flex items-center gap-4"><span className="text-sm font-medium text-gray-300">{formatTime(time)}</span><Signal size={14} className="text-indigo-500" /></div>
        <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <img src="/image/logo.png" alt="Hubify" className="h-8 w-auto object-contain" />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative px-4 sm:px-8 pb-20">
        <div className={`flex-1 transition-all duration-300 relative ${(isChatOpen || isPeopleOpen) && !windowIsMobile ? 'mr-80' : ''}`}>
           
           {screenSharing ? (
             windowIsMobile ? (
                 <div className="w-full h-full relative bg-black rounded-3xl overflow-hidden flex items-center justify-center border-4 border-[#25d366]/30 shadow-2xl">
                    <video autoPlay playsInline className="w-full h-full object-contain bg-black" ref={el => { if (el) el.srcObject = localStream }} />
                    <div className="absolute bottom-6 right-6 z-30">
                        <div className={`w-32 aspect-[3/4] bg-[#1e232e] rounded-2xl overflow-hidden border-2 transition-all ${isHandRaised ? 'border-orange-500' : 'border-[#11141c]'}`}>
                           <video autoPlay muted playsInline className="w-full h-full object-cover" ref={el => { if (el) el.srcObject = cameraStream }} />
                           {isHandRaised && <Hand size={16} className="absolute top-2 right-2 text-orange-500 fill-orange-500" />}
                        </div>
                    </div>
                 </div>
             ) : (
                 <div className="w-full h-full flex gap-4">
                    <div className="flex-1 relative bg-black rounded-[24px] overflow-hidden flex items-center justify-center border-4 border-[#25d366]/30 shadow-xl">
                       <video autoPlay playsInline className="w-full h-full object-contain" ref={el => { if (el) el.srcObject = localStream }} />
                    </div>
                    {!isCamHidden && (
                        <div className="w-64 flex flex-col gap-3 h-full">
                            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3 pr-1">
                                {allParticipants.map(p => (
                                   <div key={p.id} className="w-full aspect-video flex-shrink-0">
                                      <DesktopVideoTile stream={p.stream} name={p.name} avatarUrl={p.avatarUrl} isLocal={p.isLocal} muted={p.isLocal ? !isMicOn : false} handRaised={p.handRaised} />
                                   </div>
                                ))}
                            </div>
                            <button onClick={() => setIsCamHidden(true)} className="bg-[#1e232e] text-gray-300 text-xs px-4 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-700 shadow-lg shrink-0 transition-colors">
                                <EyeOff size={14} /> Ocultar webcams
                            </button>
                        </div>
                    )}
                    {isCamHidden && (
                        <button onClick={() => setIsCamHidden(false)} className="absolute bottom-6 right-6 z-50 bg-[#1e232e] text-gray-300 text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-700 shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-colors">
                            <Eye size={14} /> Mostrar webcams
                        </button>
                    )}
                 </div>
             )
           ) : allParticipants.length === 2 ? (
             <div className="w-full h-full relative rounded-[24px] overflow-hidden shadow-2xl bg-[#1e232e]">
                <div className="absolute inset-0">
                   <DesktopVideoTile stream={allParticipants[1].stream} name={allParticipants[1].name} avatarUrl={allParticipants[1].avatarUrl} isLocal={false} muted={false} handRaised={allParticipants[1].handRaised} />
                </div>
                <motion.div drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} className={`absolute bottom-6 right-6 z-30 cursor-grab active:cursor-grabbing rounded-[20px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.6)] border-2 border-[#11141c] ${windowIsMobile ? 'w-32 aspect-[3/4]' : 'w-64 aspect-video'}`}>
                   <DesktopVideoTile stream={allParticipants[0].stream} name="Você" avatarUrl={allParticipants[0].avatarUrl} isLocal={true} muted={!isMicOn} handRaised={isHandRaised} />
                </motion.div>
             </div>
           ) : (
             <div className={`w-full h-full grid gap-2 sm:gap-4 p-1 sm:p-2 ${getGridClasses(allParticipants.length)}`}>
                {allParticipants.map(p => <DesktopVideoTile key={p.id} stream={p.stream} name={p.name} avatarUrl={p.avatarUrl} isLocal={p.isLocal} muted={p.isLocal ? !isMicOn : false} handRaised={p.handRaised} />)}
             </div>
           )}
        </div>
        
        <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} messages={messages} sendMessage={handleSendMessage} isMobileView={windowIsMobile} />
        <PeopleSidebar isOpen={isPeopleOpen} onClose={() => setIsPeopleOpen(false)} participants={allParticipants} isMobileView={windowIsMobile} isMicOn={isMicOn} />
      </div>

      <BottomControls isMicOn={isMicOn} toggleMic={toggleMic} isVideoOn={isVideoOn} toggleVideo={toggleVideo} isHandRaised={isHandRaised} toggleHand={() => setIsHandRaised(!isHandRaised)} screenSharing={screenSharing} shareScreen={shareScreen} onLeave={handleExit} participantCount={allParticipants.length} toggleChat={() => { setIsPeopleOpen(false); setIsChatOpen(!isChatOpen); }} togglePeople={() => { setIsChatOpen(false); setIsPeopleOpen(!isPeopleOpen); }} isMobileView={windowIsMobile} isVoiceMode={false} toggleInvite={() => setIsInviteOpen(true)} />
      
      <InviteModal 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
        users={users} 
        statusConfig={statusConfig} 
        currentUser={currentUser} 
        roomId={roomId} 
        callType={callType}
        onInvite={(u) => handleInviteToCall(u.id, roomId, callType)}
      />
    </div>
  );
}
