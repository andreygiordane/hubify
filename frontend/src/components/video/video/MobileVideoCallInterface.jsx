import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Signal, Hand, ShieldCheck, VideoOff, ZoomIn, RotateCcw } from "lucide-react";
import { useMotionValue } from "framer-motion";
import { 
  formatTime, useAudioActivity, AudioWave, ChatSidebar, PeopleSidebar, InviteModal, BottomControls 
} from '../shared/CallComponents';

function MobileVideoTile({ stream, name, avatarUrl, muted = false, isLocal = false, handRaised = false }) {
  const ref = useRef(null);
  const isSpeaking = useAudioActivity(stream, muted);

  useEffect(() => {
    if (ref.current && stream) { ref.current.srcObject = stream; }
  }, [stream]);

  return (
    <div className={`relative w-full h-full bg-[#080808] border-[0.5px] border-white/5 flex items-center justify-center overflow-hidden 
      ${handRaised ? 'ring-2 ring-orange-500/50' : isSpeaking ? 'ring-2 ring-indigo-500/30' : ''}`}>
      
      {stream ? (
        <video ref={ref} autoPlay playsInline muted={isLocal || muted} className="w-full h-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#0a0a0a]">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={name} 
              className={`w-20 h-20 rounded-full object-cover border-2 transition-all duration-300 ${isSpeaking ? 'border-indigo-400 scale-105' : 'border-transparent'}`} 
            />
          ) : (
            <div className={`w-20 h-20 rounded-full flex items-center justify-center bg-gray-800 text-white font-bold text-xl ${isSpeaking ? 'ring-4 ring-indigo-400/30 bg-gray-700' : ''}`}>
              {(name || 'U').substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent z-20 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-tight opacity-80 uppercase text-white">{name}</span>
        {isSpeaking && <AudioWave isSpeaking={isSpeaking} />}
      </div>

      <AnimatePresence>
        {handRaised && (
          <motion.div initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }} 
            className="absolute top-3 right-3 bg-orange-500 text-white p-1.5 rounded-full shadow-lg">
            <Hand size={14} fill="currentColor" />
          </motion.div>
        )}
      </AnimatePresence>
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
    <div className="h-dynamic-screen w-full bg-[#050505] text-white flex flex-col font-sans overflow-hidden relative">
      <header className="shrink-0 z-50 flex justify-between items-center bg-black h-20 px-4">
        <div className="flex items-center gap-3 bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-2 rounded-2xl shadow-xl">
            <div className="bg-indigo-600 px-2.5 py-1 rounded-lg font-black italic text-[10px] shadow-lg shadow-indigo-600/30">HUBIFY</div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex flex-col">
                <h1 className="text-[10px] font-bold uppercase tracking-widest text-white/90 truncate max-w-[120px]">Sala de Vídeo</h1>
                <div className="flex items-center gap-1.5 opacity-40">
                    <ShieldCheck size={10} className="text-indigo-400" />
                    <span className="text-[9px] font-mono tracking-tighter">CRIPTOGRAFIA</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold opacity-40 uppercase tracking-widest">{formatTime(time)}</span>
            <Signal size={16} className="text-indigo-500" />
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-col">
          {screenSharing ? (
              <div className="w-full h-full relative bg-black flex items-center justify-center border-4 border-indigo-500/30 shadow-2xl overflow-hidden">
                <motion.div 
                    drag={scale > 1}
                    style={{ x, y, scale }}
                    className="w-full h-full flex items-center justify-center"
                >
                    <video autoPlay playsInline className="w-full h-full object-contain bg-black" ref={el => { if (el) el.srcObject = localStream }} />
                </motion.div>

                {/* ZOOM CONTROLS */}
                <div className="absolute top-4 right-4 flex gap-2 z-50">
                    <button onClick={() => setScale(s => Math.min(s + 0.5, 3))} className="p-2.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-white shadow-2xl">
                        <ZoomIn size={18} />
                    </button>
                    {scale > 1 && <button onClick={resetView} className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg"><RotateCcw size={18} /></button>}
                </div>
                
                {/* Mobile PiP in Screen Sharing */}
                <div className="absolute bottom-6 right-6 z-30">
                    <div className={`w-32 aspect-[3/4] bg-[#1e232e] rounded-2xl overflow-hidden border-2 transition-all shadow-2xl ${isHandRaised ? 'border-orange-500' : 'border-white/10'}`}>
                        {isVideoOn ? (
                           <video autoPlay muted playsInline className="w-full h-full object-cover" ref={el => { if (el) el.srcObject = cameraStream }} />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center bg-gray-900">
                              <VideoOff size={24} className="text-white/10" />
                           </div>
                        )}
                        {isHandRaised && <Hand size={16} className="absolute top-2 right-2 text-orange-500 fill-orange-500" />}
                    </div>
                </div>
              </div>
          ) : (
              <div className="grid grid-cols-2 gap-0 h-full w-full">
                {allParticipants.map(p => (
                  <MobileVideoTile key={p.id} stream={p.stream} name={p.name} avatarUrl={p.avatarUrl} isLocal={p.isLocal} muted={p.isLocal ? !isMicOn : false} handRaised={p.handRaised} />
                ))}
                
                {/* If odd number of participants, maybe fill space? But 2 columns is fine */}
              </div>
          )}

          {/* VÍDEO LOCAL (PIP) - Fixed for Mobile when not sharing and > 1 participants */}
          {!screenSharing && allParticipants.length > 1 && (
              <motion.div drag dragConstraints={{ left: -100, right: 10, top: -100, bottom: 10 }} className="absolute bottom-24 right-4 w-28 aspect-[3/4] bg-[#111] border border-white/20 shadow-2xl z-40 overflow-hidden flex items-center justify-center rounded-2xl">
                {!isVideoOn ? (
                    <VideoOff size={24} className="text-white/10" />
                ) : (
                    <video autoPlay muted playsInline className="w-full h-full object-cover" ref={el => { if (el && cameraStream) el.srcObject = cameraStream }} />
                )}
                <div className="absolute bottom-2 inset-x-0 text-[8px] font-bold text-center opacity-50 uppercase bg-black/40 py-1">Você</div>
              </motion.div>
          )}
      </main>
      
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
    </div>
  );
}
