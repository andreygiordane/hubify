import React, { useState, useEffect, useRef } from "react";
import { useChat } from '../../../context/ChatContext';
import { useCallLogic } from '../logic/useCallLogic';
import { 
  formatTime, ChatSidebar, PeopleSidebar, InviteModal, BottomControls 
} from '../shared/CallComponents';

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

function RemoteAudio({ stream, id }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      console.log(`[Audio] Atachando stream ao elemento de áudio do peer: ${id}`);
      audioRef.current.srcObject = stream;
      
      const playAudio = () => {
        audioRef.current.play().catch(err => {
          console.warn(`[Audio] Erro ao dar play automático para ${id}:`, err);
        });
      };

      // Tentar tocar após um pequeno delay para garantir que o elemento está pronto
      playAudio();
    }
  }, [stream, id]);

  return (
    <audio
      ref={audioRef}
      autoPlay
      playsInline
      style={{ display: 'none' }}
    />
  );
}

export default function AudioCallInterface({ roomId, currentUser, socket, onLeave }) {
  const { users, statusConfig, handleInviteToCall } = useChat();
  const {
    allParticipants, localStream, time, isMicOn, isVideoOn, isHandRaised, setIsHandRaised,
    messages, toggleMic, toggleVideo, shareScreen, handleSendMessage, handleExit,
    invitedUserIds, inviteUser
  } = useCallLogic({ roomId, currentUser, socket, callType: 'audio', onLeave });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [windowIsMobile, setWindowIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setWindowIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeRemote = allParticipants.find(p => !p.isLocal && p.uid !== currentUser?.uid);
  
  return (
    <div className="h-dynamic-screen w-full bg-[#0a0d14] flex flex-col relative overflow-hidden">
      {allParticipants.filter(p => !p.isLocal && p.stream).map(p => (
         <RemoteAudio key={p.id} stream={p.stream} id={p.id} />
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
      
      <BottomControls 
        isMicOn={isMicOn} toggleMic={toggleMic} 
        isVideoOn={isVideoOn} toggleVideo={toggleVideo} 
        isHandRaised={isHandRaised} toggleHand={() => setIsHandRaised(!isHandRaised)} 
        screenSharing={false} shareScreen={shareScreen} 
        onLeave={handleExit} participantCount={allParticipants.length} 
        toggleChat={() => setIsChatOpen(true)} togglePeople={() => setIsPeopleOpen(true)} 
        isMobileView={windowIsMobile} isVoiceMode={true} 
        toggleInvite={() => setIsInviteOpen(true)} 
      />
      
      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} messages={messages} sendMessage={handleSendMessage} isMobileView={windowIsMobile} />
      <PeopleSidebar isOpen={isPeopleOpen} onClose={() => setIsPeopleOpen(false)} participants={allParticipants} isMobileView={windowIsMobile} isMicOn={isMicOn} />
      
      <InviteModal 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
        users={users} 
        statusConfig={statusConfig} 
        currentUser={currentUser} 
        roomId={roomId} 
        callType="audio"
        onInvite={(u) => inviteUser(u.id, handleInviteToCall)}
        invitedUserIds={invitedUserIds}
        participants={allParticipants}
      />
    </div>
  );
}
