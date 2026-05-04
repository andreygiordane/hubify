import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Signal, EyeOff, Eye, Hand } from "lucide-react";
import { useChat } from '../../context/ChatContext';
import { useCallLogic } from './useCallLogic';
import { 
  formatTime, useAudioActivity, AudioWave, ChatSidebar, PeopleSidebar, InviteModal, BottomControls 
} from './CallComponents';

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
        <video ref={ref} autoPlay playsInline muted={isLocal || muted} className="w-full h-full object-cover" />
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

export default function VideoCallInterface({ roomId, currentUser, socket, onLeave }) {
  const { users, statusConfig, handleInviteToCall } = useChat();
  const {
    allParticipants, localStream, cameraStream, screenSharing, time,
    isMicOn, isVideoOn, isHandRaised, setIsHandRaised,
    messages, toggleMic, toggleVideo, shareScreen, handleSendMessage, handleExit,
    invitedUserIds, inviteUser
  } = useCallLogic({ roomId, currentUser, socket, callType: 'video', onLeave });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCamHidden, setIsCamHidden] = useState(false);
  const [windowIsMobile, setWindowIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setWindowIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getGridClasses = (count) => {
    if (count === 1) return "grid-cols-1 grid-rows-1 max-w-4xl mx-auto";
    if (count === 2) return "grid-cols-1 md:grid-cols-2 grid-rows-1";
    if (count <= 4) return "grid-cols-2 grid-rows-2";
    return "grid-cols-2 lg:grid-cols-3 grid-rows-2";
  };

  return (
    <div className="h-dynamic-screen w-full bg-[#0a0d14] text-white flex flex-col font-sans overflow-hidden relative">
      <header className="px-8 py-5 flex justify-between items-center z-40">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-300">{formatTime(time)}</span>
          <Signal size={14} className="text-indigo-500" />
        </div>
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

      <BottomControls 
        isMicOn={isMicOn} toggleMic={toggleMic} 
        isVideoOn={isVideoOn} toggleVideo={toggleVideo} 
        isHandRaised={isHandRaised} toggleHand={() => setIsHandRaised(!isHandRaised)} 
        screenSharing={screenSharing} shareScreen={shareScreen} 
        onLeave={handleExit} participantCount={allParticipants.length} 
        toggleChat={() => { setIsPeopleOpen(false); setIsChatOpen(!isChatOpen); }} 
        togglePeople={() => { setIsChatOpen(false); setIsPeopleOpen(!isPeopleOpen); }} 
        isMobileView={windowIsMobile} isVoiceMode={false} 
        toggleInvite={() => setIsInviteOpen(true)} 
      />
      
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
