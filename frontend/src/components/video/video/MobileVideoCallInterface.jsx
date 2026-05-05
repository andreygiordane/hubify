import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Signal, Hand, ShieldCheck, VideoOff, ZoomIn, RotateCcw, Monitor } from "lucide-react";
import { useMotionValue } from "framer-motion";
import { 
  formatTime, useAudioActivity, AudioWave, ChatSidebar, PeopleSidebar, InviteModal, BottomControls 
} from '../shared/CallComponents';

function MobileVideoTile({ stream, name, avatarUrl, muted = false, isLocal = false, handRaised = false, isScreenSharing = false, isActuallySharing = false, isCamOn = true }) {
  const ref = useRef(null);
  const isSpeaking = useAudioActivity(stream, muted);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
      if (typeof ref.current.play === 'function') {
        ref.current.play().catch(() => {});
      }
    } else if (ref.current) { ref.current.srcObject = null; }
  }, [stream, isCamOn]);

  // Simulação de nível de áudio para animação se estiver falando
  const [audioLevel, setAudioLevel] = React.useState(0);
  useEffect(() => {
    let interval;
    if (isSpeaking) {
      interval = setInterval(() => setAudioLevel(Math.random()), 150);
    } else {
      setAudioLevel(0);
    }
    return () => clearInterval(interval);
  }, [isSpeaking]);

  return (
    <div className={`relative w-full h-full bg-[#080808] border-[0.5px] border-white/5 flex items-center justify-center overflow-hidden transition-all duration-300 
      ${handRaised ? 'ring-inset ring-2 ring-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : isSpeaking ? 'ring-inset ring-2 ring-blue-500/20' : ''}`}>
      
      {stream && isCamOn ? (
        <video ref={ref} autoPlay playsInline muted={isLocal || muted} className={`w-full h-full ${isScreenSharing ? 'object-contain' : 'object-cover'}`} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#0a0a0a]">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={name} 
              className={`w-24 h-24 rounded-2xl object-cover border-2 border-white/5 shadow-xl transition-all duration-300 ${isSpeaking ? 'scale-105 opacity-100 border-blue-400' : 'opacity-50'}`} 
            />
          ) : (
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center bg-zinc-900 text-white font-black text-xl transition-all duration-300 ${isSpeaking ? 'ring-4 ring-blue-500/30' : 'opacity-50'}`}>
              {(name || 'U').substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent z-20 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-tight opacity-80 uppercase text-white">{name}</span>
        {isSpeaking && (
            <div className="flex gap-0.5 items-end h-3">
                {[1, 2, 3].map(i => <div key={i} className="w-0.5 bg-blue-400" style={{ height: `${2 + (audioLevel * 8 * (i / 3))}px` }} />)}
            </div>
        )}
      </div>

      <AnimatePresence>
        {handRaised && (
          <motion.div initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }} 
            className="absolute top-3 right-3 bg-orange-500 text-white p-1.5 rounded-full shadow-lg">
            <Hand size={14} fill="currentColor" />
          </motion.div>
        )}
      </AnimatePresence>

      {isScreenSharing && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-blue-600 px-2.5 py-1 rounded-full shadow-lg">
          <Monitor size={10} className="text-white" />
          <span className="text-[7px] font-black uppercase tracking-widest text-white">Tela</span>
        </div>
      )}

      {isActuallySharing && !isScreenSharing && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-blue-600/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 shadow-lg animate-pulse">
          <Monitor size={8} className="text-white" />
          <span className="text-[6px] font-black uppercase tracking-tighter text-white">Transmitindo</span>
        </div>
      )}
    </div>
  );
}

export default function MobileVideoCallInterface({ 
  roomId, currentUser, allParticipants, localStream, cameraStream, screenSharing, time,
  isMicOn, isVideoOn, isHandRaised, setIsHandRaised,
  messages, toggleMic, toggleVideo, shareScreen, handleSendMessage, handleExit,
  invitedUserIds, inviteUser, users, statusConfig, handleInviteToCall,
  isChatOpen, setIsChatOpen, isPeopleOpen, setIsPeopleOpen, isInviteOpen, setIsInviteOpen
}) {
  const [scale, setScale] = React.useState(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const resetView = () => {
    setScale(1);
    x.set(0);
    y.set(0);
  };

  return (
    <div className="h-dynamic-screen w-full bg-black text-white flex flex-col font-sans overflow-hidden relative selection:bg-blue-500/30">
      <header className="shrink-0 z-50 flex justify-between items-center bg-black h-20 px-4">
        <div className="flex items-center gap-3 bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-2 rounded-2xl shadow-xl">
            <div className="bg-blue-600 px-2.5 py-1 rounded-lg font-black italic text-[10px] shadow-lg shadow-blue-600/30">HUBIFY</div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex flex-col">
                <h1 className="text-[10px] font-bold uppercase tracking-widest text-white/90 truncate max-w-[120px]">
                    {roomId.startsWith('dm_') ? 'Conversa' : 'Reunião'}
                </h1>
                <div className="flex items-center gap-1.5 opacity-40">
                    <ShieldCheck size={10} className="text-blue-400" />
                    <span className="text-[9px] font-mono tracking-tighter uppercase">Protegido</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em]">{formatTime(time)}</span>
            <Signal size={16} className="text-blue-500" />
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-col">
          {allParticipants.some(p => p.isScreenSharing) ? (
            <div className="flex flex-col h-full w-full bg-black">
              {/* Prioridade: Tela Compartilhada com Zoom */}
              <div className="flex-[3] relative border-b border-white/5 overflow-hidden group">
                {allParticipants.filter(p => p.isScreenSharing).map(p => (
                  <motion.div 
                    key={p.id}
                    drag={scale > 1}
                    style={{ x, y, scale }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <MobileVideoTile 
                      stream={p.stream} 
                      name={p.name} 
                      avatarUrl={p.avatarUrl} 
                      isLocal={p.isLocal} 
                      muted={true} 
                      handRaised={p.handRaised} 
                      isScreenSharing={p.isScreenSharing}
                      isCamOn={p.isCamOn}
                    />
                  </motion.div>
                ))}

                {/* ZOOM CONTROLS */}
                <div className="absolute top-4 right-4 flex gap-2 z-50">
                    <button onClick={() => setScale(s => Math.min(s + 0.5, 3))} className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl text-white shadow-2xl">
                        <ZoomIn size={20} />
                    </button>
                    {scale > 1 && <button onClick={resetView} className="p-3 bg-blue-600 rounded-xl text-white shadow-lg"><RotateCcw size={20} /></button>}
                </div>
              </div>

              {/* Participantes: Lista Horizontal (Telas menores para se adaptar) */}
              <div className="flex-1 min-h-[140px] bg-[#050505] flex items-center overflow-x-auto overflow-y-hidden px-3 gap-3 no-scrollbar">
                {allParticipants.filter(p => !p.isScreenSharing).map(p => (
                  <div key={p.id} className="w-32 h-[80%] flex-shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                    <MobileVideoTile 
                      stream={p.stream} 
                      name={p.name} 
                      avatarUrl={p.avatarUrl} 
                      isLocal={p.isLocal} 
                      muted={p.isLocal ? !isMicOn : false} 
                      handRaised={p.handRaised} 
                      isScreenSharing={false}
                      isActuallySharing={p.isActuallySharing}
                      isCamOn={p.isCamOn}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={`grid gap-0 h-full w-full ${
              allParticipants.length === 1 ? 'grid-cols-1 grid-rows-1' : 
              allParticipants.length === 2 ? 'grid-cols-1 grid-rows-2' : 
              allParticipants.length === 3 ? 'grid-cols-1 grid-rows-3' :
              'grid-cols-2'
            }`}>
              {allParticipants.map(p => (
                <MobileVideoTile 
                  key={p.id} 
                  stream={p.stream} 
                  name={p.name} 
                  avatarUrl={p.avatarUrl} 
                  isLocal={p.isLocal} 
                  muted={p.isLocal ? !isMicOn : false} 
                  handRaised={p.handRaised} 
                  isScreenSharing={p.isScreenSharing}
                  isActuallySharing={p.isActuallySharing}
                  isCamOn={p.isCamOn}
                />
              ))}
            </div>
          )}

      </main>
      
      <div className="h-28 shrink-0" />

      <BottomControls 
        isMicOn={isMicOn} toggleMic={toggleMic} 
        isVideoOn={isVideoOn} toggleVideo={toggleVideo} 
        isHandRaised={isHandRaised} toggleHand={() => setIsHandRaised(!isHandRaised)} 
        screenSharing={screenSharing} shareScreen={shareScreen} 
        onLeave={handleExit} participantCount={allParticipants.length} 
        toggleChat={() => { setIsPeopleOpen(false); setIsChatOpen(!isChatOpen); }} 
        togglePeople={() => { setIsChatOpen(false); setIsPeopleOpen(!isPeopleOpen); }} 
        isMobileView={true} isVoiceMode={false} 
        toggleInvite={() => setIsInviteOpen(true)} 
      />

      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} messages={messages} sendMessage={handleSendMessage} isMobileView={true} />
      <PeopleSidebar isOpen={isPeopleOpen} onClose={() => setIsPeopleOpen(false)} participants={allParticipants} isMobileView={true} isMicOn={isMicOn} />
      
      <InviteModal 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
        users={users} 
        statusConfig={statusConfig} 
        currentUser={currentUser} 
        roomId={roomId} 
        callType="video"
        onInvite={(u) => inviteUser(u.id, handleInviteToCall)}
        invitedUserIds={invitedUserIds}
        participants={allParticipants}
      />

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/10 rounded-full z-[150] pointer-events-none" />
    </div>
  );
}
