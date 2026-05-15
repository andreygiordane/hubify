import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Signal, EyeOff, Eye, Hand, ShieldCheck, ZoomIn, RotateCcw, Monitor } from "lucide-react";
import { useMotionValue } from "framer-motion";
import {
  formatTime, useAudioActivity, AudioWave, ChatSidebar, PeopleSidebar, InviteModal, BottomControls
} from '../shared/CallComponents';

function DesktopVideoTile({ stream, name, avatarUrl, muted = false, isLocal = false, handRaised = false, isScreenSharing = false, isActuallySharing = false, isCamOn = true }) {
  const ref = useRef(null);
  const isSpeaking = useAudioActivity(stream, muted);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
      if (typeof ref.current.play === 'function') {
        ref.current.play().catch(() => { });
      }
    } else if (ref.current) {
      ref.current.srcObject = null;
    }
  }, [stream, isCamOn]);

  return (
    <div className={`relative w-full h-full bg-[#080808] border-[0.5px] border-white/5 flex items-center justify-center overflow-hidden group transition-all duration-300 
      ${handRaised ? 'ring-inset ring-4 ring-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]' : isSpeaking ? 'ring-inset ring-2 ring-blue-500/50' : ''}`}>

      {stream && isCamOn ? (
        <video ref={ref} autoPlay playsInline muted={isLocal || muted} className={`w-full h-full ${isScreenSharing ? 'object-contain' : 'object-cover'}`} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#0a0a0a]">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className={`w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white/5 shadow-2xl transition-all duration-500 ${isSpeaking ? 'ring-4 ring-blue-500/30 scale-105' : 'opacity-60'}`}
            />
          ) : (
            <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center bg-zinc-900 text-white font-black text-2xl transition-all duration-300 ${isSpeaking ? 'ring-4 ring-blue-500/30 scale-105 shadow-[0_0_30px_rgba(37,99,235,0.2)]' : 'opacity-60'}`}>
              {(name || 'U').substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div className="absolute bottom-4 left-4 p-2.5 z-20 flex items-center justify-between bg-black/60 backdrop-blur-md border border-white/5 shadow-xl rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-tight opacity-80 uppercase text-white">{name}</span>
          {isSpeaking && <AudioWave isSpeaking={isSpeaking} />}
        </div>
      </div>

      <AnimatePresence>
        {handRaised && (
          <motion.div initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }}
            className="absolute top-4 right-4 bg-orange-500 text-white p-2.5 rounded-full shadow-xl">
            <Hand size={20} fill="currentColor" />
          </motion.div>
        )}
      </AnimatePresence>

      {isScreenSharing && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-blue-600 px-3 py-1.5 rounded-full shadow-lg border border-blue-400/30">
          <Monitor size={14} className="text-white" />
          <span className="text-[8px] font-black uppercase tracking-widest text-white">Tela Compartilhada</span>
        </div>
      )}

      {isActuallySharing && !isScreenSharing && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-blue-600/80 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-lg animate-pulse">
          <Monitor size={12} className="text-white" />
          <span className="text-[8px] font-black uppercase tracking-widest text-white">Transmitindo</span>
        </div>
      )}
    </div>
  );
}

function ScreenShareTile({ stream, scale, setScale, x, y }) {
  const ref = useRef(null);
  const [initialScale, setInitialScale] = React.useState(1);
  const [initialDist, setInitialDist] = React.useState(0);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
      if (typeof ref.current.play === 'function') ref.current.play().catch(() => {});
    }
  }, [stream]);

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      setInitialDist(dist);
      setInitialScale(scale);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && initialDist > 0) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const newScale = Math.min(Math.max(1, initialScale * (dist / initialDist)), 4);
      setScale(newScale);
    }
  };

  return (
    <motion.div
      drag={scale > 1}
      style={{ x, y, scale }}
      className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <video autoPlay playsInline className="w-full h-full object-contain" ref={ref} />
    </motion.div>
  );
}

export default function WebVideoCallInterface({
  roomId, currentUser, allParticipants, localStream, cameraStream, screenSharing, time,
  isMicOn, isVideoOn, isHandRaised, setIsHandRaised,
  messages, toggleMic, toggleVideo, shareScreen, handleSendMessage, handleExit,
  invitedUserIds, inviteUser, users, statusConfig, handleInviteToCall,
  isChatOpen, setIsChatOpen, isPeopleOpen, setIsPeopleOpen, isInviteOpen, setIsInviteOpen,
  isCamHidden, setIsCamHidden, isVoiceMode
}) {
  const [scale, setScale] = React.useState(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const resetView = () => {
    setScale(1);
    x.set(0);
    y.set(0);
  };

  const sharingParticipant = allParticipants.find(p => p.isScreenSharing);
  const isAnyScreenSharing = !!sharingParticipant;

  const getGridClasses = (count) => {
    if (count === 1) return "grid-cols-1 grid-rows-1";
    if (count === 2) return "grid-cols-2 grid-rows-1";
    if (count <= 4) return "grid-cols-2 grid-rows-2";
    return "grid-cols-2 lg:grid-cols-3 grid-rows-2";
  };

  return (
    <div className="h-dynamic-screen w-full bg-black text-white flex flex-col font-sans overflow-hidden relative selection:bg-blue-500/30">
      <header className="h-24 px-8 shrink-0 z-50 flex justify-between items-center bg-black">
        <div className="flex items-center gap-3 bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-2 rounded-2xl shadow-xl">
          <img src="/image/logo.png" alt="Hubify" className="h-7 w-auto object-contain" />
          <div className="h-4 w-px bg-white/10" />
          <div className="flex flex-col">
            <h1 className="text-xs font-bold uppercase tracking-widest text-white/90">
              {roomId.startsWith('dm_') ? 'Conversa Privada' : 'Sala de Reunião'}
            </h1>
            <div className="flex items-center gap-1.5 opacity-40">
              <ShieldCheck size={12} className="text-blue-400" />
              <span className="text-[9px] font-mono tracking-tighter">CRIPTOGRAFIA ATIVA</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/5 px-4 py-2 rounded-2xl flex items-center gap-4">
            <div className="flex -space-x-2">
              {allParticipants.slice(0, 3).map(p => (
                <div key={p.id} className="w-6 h-6 rounded-full border-2 border-zinc-950 bg-zinc-800 overflow-hidden">
                  {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold">{p.name[0]}</div>}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-300">{formatTime(time)}</span>
              <Signal size={14} className="text-blue-500" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className={`flex-1 transition-all duration-300 relative ${(isChatOpen || isPeopleOpen) ? 'mr-96' : ''}`}>

          {isAnyScreenSharing ? (
            <div className="w-full h-full flex">
              <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center group">
                <ScreenShareTile 
                  stream={sharingParticipant.stream} 
                  scale={scale} setScale={setScale} 
                  x={x} y={y} 
                />
              </div>
              {!isCamHidden && (
                <div className="w-72 flex flex-col border-l border-white/5 bg-black overflow-y-auto no-scrollbar shrink-0">
                  {allParticipants.map(p => (
                    <div key={p.id} className="w-full aspect-video border-b border-white/5">
                      <DesktopVideoTile
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
                    </div>
                  ))}
                  <button onClick={() => setIsCamHidden(true)} className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors bg-white/5 m-4 rounded-xl">
                    Ocultar webcams
                  </button>
                </div>
              )}
              {isCamHidden && (
                <button onClick={() => setIsCamHidden(false)} className="absolute bottom-6 right-6 z-50 bg-zinc-900/90 backdrop-blur-xl text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl border border-white/10 shadow-2xl hover:bg-zinc-800 transition-all">
                  Mostrar webcams
                </button>
              )}
            </div>
          ) : (
            <div className={`grid gap-0 h-full w-full ${getGridClasses(allParticipants.length)}`}>
              {allParticipants.map(p => (
                <DesktopVideoTile
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
        </div>

        <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} messages={messages} sendMessage={handleSendMessage} isMobileView={false} />
        <PeopleSidebar isOpen={isPeopleOpen} onClose={() => setIsPeopleOpen(false)} participants={allParticipants} isMobileView={false} isMicOn={isMicOn} />
      </div>

      <div className="h-24 shrink-0" /> {/* Espaço para o BottomControls que é absoluto */}

      <BottomControls
        isMicOn={isMicOn} toggleMic={toggleMic}
        isVideoOn={isVideoOn} toggleVideo={toggleVideo}
        isHandRaised={isHandRaised} toggleHand={() => setIsHandRaised(!isHandRaised)}
        screenSharing={screenSharing} shareScreen={shareScreen}
        onLeave={handleExit} participantCount={allParticipants.length}
        toggleChat={() => { setIsPeopleOpen(false); setIsChatOpen(!isChatOpen); }}
        togglePeople={() => { setIsChatOpen(false); setIsPeopleOpen(!isPeopleOpen); }}
        isMobileView={false} isVoiceMode={isVoiceMode}
        toggleInvite={() => setIsInviteOpen(true)}
      />

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        users={users}
        statusConfig={statusConfig}
        currentUser={currentUser}
        roomId={roomId}
        callType={isVoiceMode ? 'audio' : 'video'}
        onInvite={(u) => inviteUser(u.id, handleInviteToCall)}
        invitedUserIds={invitedUserIds}
        participants={allParticipants}
      />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
