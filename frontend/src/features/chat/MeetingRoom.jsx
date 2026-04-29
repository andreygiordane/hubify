import React, { useState, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

/* ── Teams Style SVGs ─────────────────────────────────────────────── */
const ParticipantsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);
const HandIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v10"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
  </svg>
);
const CameraIcon = ({ off }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    {off && <line x1="1" y1="1" x2="23" y2="23" stroke="red" />}
  </svg>
);
const MicIcon = ({ off }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
    {off && <line x1="1" y1="1" x2="23" y2="23" stroke="red" />}
  </svg>
);
const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

const GridIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const MeetingRoom = ({ 
  user, 
  roomName, 
  localStream, 
  participants, 
  messages, 
  onSendMessage, 
  onSendEvent,
  onLeave, 
  onToggleAudio, 
  onToggleVideo,
  onRaiseHand,
  onToggleScreenShare,
  events 
}) => {
  const [showParticipants, setShowParticipants] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid' or 'focus'
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [duration, setDuration] = useState(0);
  const [remoteStreams, setRemoteStreams] = useState({}); // { userId: MediaStream }
  
  const localVideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peers = useRef({}); // { userId: RTCPeerConnection }
  const processedEventIds = useRef(new Set());

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    return () => {
      clearInterval(timer);
      Object.values(peers.current).forEach(pc => pc.close());
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getLatestStatus = (participantId) => {
    const pEvents = events
      .filter(e => String(e.userId) === String(participantId))
      .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));

    if (pEvents.length === 0) return null;

    const latestJoin = [...pEvents].reverse().find(e => e.eventType === 'JOIN' || e.eventType === 'INVITE');
    const latestLeave = [...pEvents].reverse().find(e => e.eventType === 'LEAVE');

    if (latestLeave && (!latestJoin || new Date(latestLeave.timestamp) > new Date(latestJoin.timestamp))) {
      return null;
    }

    const latestAudio = [...pEvents].reverse().find(e => e.eventType === 'AUDIO_TOGGLE');
    const latestVideo = [...pEvents].reverse().find(e => e.eventType === 'VIDEO_TOGGLE');
    const latestHand = [...pEvents].reverse().find(e => e.eventType === 'HAND_RAISE');

    return {
      isMuted: latestAudio ? latestAudio.message === 'OFF' : false,
      isVideoOff: latestVideo ? latestVideo.message === 'OFF' : false,
      handRaised: latestHand ? latestHand.handRaised : false,
      active: true
    };
  };

  const rtcConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  const createPeerConnection = (remoteUserId) => {
    if (peers.current[remoteUserId]) {
      peers.current[remoteUserId].close();
    }

    const pc = new RTCPeerConnection(rtcConfig);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onSendEvent('ICE_CANDIDATE', {
          payload: JSON.stringify(event.candidate),
          targetUserId: remoteUserId
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [remoteUserId]: event.streams[0]
      }));
    };

    const streamToShare = screenStreamRef.current || localStream;
    if (streamToShare) {
      streamToShare.getTracks().forEach(track => pc.addTrack(track, streamToShare));
    }

    peers.current[remoteUserId] = pc;
    return pc;
  };

  useEffect(() => {
    events.forEach(async (event) => {
      if (processedEventIds.current.has(event.id)) return;
      if (String(event.userId) === String(user.id)) return;
      if (event.targetUserId && String(event.targetUserId) !== String(user.id)) return;

      processedEventIds.current.add(event.id);

      try {
        if (event.eventType === 'JOIN') {
          const pc = createPeerConnection(event.userId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          onSendEvent('OFFER', { payload: JSON.stringify(offer), targetUserId: event.userId });
        } 
        else if (event.eventType === 'OFFER') {
          const pc = createPeerConnection(event.userId);
          await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(event.payload)));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          onSendEvent('ANSWER', { payload: JSON.stringify(answer), targetUserId: event.userId });
        } 
        else if (event.eventType === 'ANSWER') {
          const pc = peers.current[event.userId];
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(event.payload)));
        } 
        else if (event.eventType === 'ICE_CANDIDATE') {
          const pc = peers.current[event.userId];
          if (pc) await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(event.payload)));
        }
        else if (event.eventType === 'LEAVE') {
          if (peers.current[event.userId]) {
            peers.current[event.userId].close();
            delete peers.current[event.userId];
          }
          setRemoteStreams(prev => {
            const next = { ...prev };
            delete next[event.userId];
            return next;
          });
        }
      } catch (err) {
        console.error('WebRTC Signaling Error:', err);
      }
    });
  }, [events, localStream]);

  const allAttendees = [
    { 
      id: 'local', 
      username: user.username, 
      avatarUrl: user.avatarUrl, 
      stream: screenStreamRef.current || localStream, 
      handRaised: isHandRaised, 
      videoOn: videoEnabled || isScreenSharing, 
      audioOn: audioEnabled 
    },
    ...participants
      .filter(p => String(p.id) !== String(user.id))
      .map(p => {
        const status = getLatestStatus(p.id);
        if (!status) return null;
        return { 
          ...p, 
          handRaised: status.handRaised, 
          videoOn: !status.isVideoOff, 
          audioOn: !status.isMuted,
          remoteStream: remoteStreams[p.id]
        };
      })
      .filter(Boolean)
  ];

  useEffect(() => {
    if (localVideoRef.current && (screenStreamRef.current || localStream) && (videoEnabled || isScreenSharing)) {
      localVideoRef.current.srcObject = screenStreamRef.current || localStream;
    }
  }, [localStream, videoEnabled, isScreenSharing]);

  const handleToggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    if (localStream) localStream.getAudioTracks().forEach(t => t.enabled = next);
    onToggleAudio(next);
  };

  const handleToggleVideo = () => {
    const next = !videoEnabled;
    setVideoEnabled(next);
    if (localStream) localStream.getVideoTracks().forEach(t => t.enabled = next);
    onToggleVideo(next);
  };

  const handleRaiseHand = () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    onRaiseHand(next);
  };

  const handleToggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
        
        // Substituir tracks em todos os peers
        const screenTrack = screenStream.getVideoTracks()[0];
        Object.values(peers.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        screenTrack.onended = () => stopScreenShare();
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    
    // Restaurar track da câmera
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      Object.values(peers.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      });
    }
  };

  return (
    <div className="teams-meeting">
      <div className="teams-header">
        <div className="teams-header-left">
          <div className="teams-meeting-title">{roomName || 'Hubify Meeting'}</div>
          <div className="teams-timer"><span className="rec-dot"></span>{formatDuration(duration)}</div>
        </div>
        <div className="teams-header-right">
          <button className={`teams-header-btn ${layoutMode === 'focus' ? 'active' : ''}`} onClick={() => setLayoutMode(prev => prev === 'grid' ? 'focus' : 'grid')} title="Mudar Layout">
            <GridIcon />
            <span style={{ fontSize: '0.7rem', marginLeft: '4px' }}>Visualização</span>
          </button>
          <div className="teams-divider"></div>
          <button className={`teams-header-btn ${showParticipants ? 'active' : ''}`} onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}><ParticipantsIcon /></button>
          <button className={`teams-header-btn ${showChat ? 'active' : ''}`} onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}><ChatIcon /></button>
          <button className={`teams-header-btn ${isHandRaised ? 'active' : ''}`} onClick={handleRaiseHand}><HandIcon /></button>
          <div className="teams-divider"></div>
          <button className={`teams-header-btn ${!videoEnabled ? 'off' : ''}`} onClick={handleToggleVideo}><CameraIcon off={!videoEnabled} /></button>
          <button className={`teams-header-btn ${!audioEnabled ? 'off' : ''}`} onClick={handleToggleAudio}><MicIcon off={!audioEnabled} /></button>
          <button className={`teams-header-btn ${isScreenSharing ? 'active' : ''}`} onClick={handleToggleScreenShare}><ShareIcon /></button>
          <button className="teams-leave-btn" onClick={onLeave}>Sair</button>
        </div>
      </div>

      <div className="teams-body">
        <div className="teams-content">
          <div className={`teams-video-grid count-${allAttendees.length} mode-${layoutMode}`}>
            {allAttendees.map(p => (
              <div 
                key={p.id} 
                className={`teams-video-card ${p.id === 'local' ? 'local-user-card' : ''} ${layoutMode === 'focus' && p.id === 'local' ? 'focus-overlay' : ''}`}
              >
                {p.videoOn ? (
                  p.id === 'local' ? <video ref={localVideoRef} autoPlay muted playsInline /> : <RemoteVideo stream={p.remoteStream} username={p.username} avatarUrl={p.avatarUrl} />
                ) : (
                  <div className="teams-video-placeholder muted">
                    {p.avatarUrl ? <img src={p.avatarUrl} alt={p.username} /> : p.username.charAt(0).toUpperCase()}
                    <div className="teams-muted-overlay">Câmera Desligada</div>
                  </div>
                )}
                <div className="teams-video-label">
                  {p.username}
                  <div className="label-icons">
                    {!p.audioOn && <span className="teams-muted-icon">🔇</span>}
                    {p.handRaised && <span className="teams-hand-icon"><HandIcon /></span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {(showParticipants || showChat) && (
          <div className="teams-side-panel">
            <div className="teams-side-header">
              <h3>{showParticipants ? 'Participantes' : 'Chat da Reunião'}</h3>
              <button className="teams-close-side" onClick={() => { setShowParticipants(false); setShowChat(false); }}>×</button>
            </div>
            
            {showParticipants && (
              <div className="teams-participants-list">
                <div className="teams-list-section">Na reunião ({allAttendees.length})</div>
                {allAttendees.map(p => (
                  <div key={p.id} className="teams-participant-row">
                    <div className="teams-row-avatar">
                      {p.avatarUrl ? <img src={p.avatarUrl} alt={p.username} /> : p.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="teams-row-name">
                      {p.username}
                      {p.id === 'local' && <span className="teams-me-tag">(Eu)</span>}
                    </div>
                    <div className="teams-row-icons">
                      {p.handRaised && <span className="teams-row-hand"><HandIcon /></span>}
                      <span className="teams-row-mic">{p.audioOn ? <MicIcon /> : <MicIcon off />}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showChat && (
              <div className="teams-chat-area">
                <div className="teams-chat-messages">
                  <MessageList messages={messages} currentUser={user} />
                </div>
                <div className="teams-chat-input-wrap">
                  <MessageInput onSendMessage={onSendMessage} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const RemoteVideo = ({ stream, username, avatarUrl }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  if (!stream) {
    return (
      <div className="teams-video-placeholder">
        {avatarUrl ? <img src={avatarUrl} alt={username} /> : username.charAt(0).toUpperCase()}
        <div style={{ marginTop: '10px', fontSize: '0.8rem', opacity: 0.7 }}>Conectando vídeo...</div>
      </div>
    );
  }
  return <video ref={videoRef} autoPlay playsInline />;
};

export default MeetingRoom;
