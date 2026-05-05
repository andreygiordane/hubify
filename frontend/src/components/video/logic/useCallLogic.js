import { useState, useEffect, useRef } from 'react';
import { Peer } from '../utils/WebRTCUtils';

export function useCallLogic({ roomId, currentUser, socket, callType, onLeave }) {
  const [streams, setStreams] = useState({}); // { [peerID]: { webcam: Stream, screen: Stream } }
  const [localStream, setLocalStream] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [screenSharing, setScreenSharing] = useState(false);
  const [hasConnected, setHasConnected] = useState(false);
  const [time, setTime] = useState(0);

  const isVoiceMode = callType === 'audio';
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(!isVoiceMode);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [messages, setMessages] = useState([{
    sender: 'Sistema',
    text: `Você entrou na sala!`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isSelf: false
  }]);
  const [roomParticipants, setRoomParticipants] = useState([]);

  const peersRef = useRef([]);
  const [invitedUserIds, setInvitedUserIds] = useState(new Set());
  const localStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(t => t + 1), 1000);
    return () => {
      clearInterval(timer);
      peersRef.current.forEach(p => p.peer.destroy());
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (cameraStreamRef.current && cameraStreamRef.current !== localStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socket) {
        socket.off('room-participants');
        socket.off('receive-chat');
        socket.off('call-ended');
        socket.off('user-joined-room');
        socket.off('all-users');
        socket.off('user-joined');
        socket.off('receiving-returned-signal');
        socket.off('user-disconnected');
      }
    };
  }, []);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    cameraStreamRef.current = cameraStream;
  }, [cameraStream]);

  useEffect(() => {
    screenStreamRef.current = screenStream;
  }, [screenStream]);

  useEffect(() => {
    console.log(`[Componente] useCallLogic montado para sala: ${roomId}`);
    if (socket && roomId && !hasConnected) {
      // Adicionar um pequeno delay para garantir que o socket.join no servidor terminou
      const timer = setTimeout(() => {
        initMedia();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [socket, roomId]);

  useEffect(() => {
    if (socket && roomId) {
      socket.emit('update-user-state', { roomId, state: { isMicOn, isCamOn: isVideoOn, isHandRaised, isScreenSharing: screenSharing } });
    }
  }, [isMicOn, isVideoOn, isHandRaised, screenSharing]);

  useEffect(() => {
    if (roomId && roomId.startsWith('dm_')) {
      if (roomParticipants.length > 1) {
        setHasConnected(true);
      } else if (hasConnected && roomParticipants.length <= 1) {
        onLeave();
      }
    }
  }, [roomParticipants, roomId, hasConnected, onLeave]);

  const initMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: !isVoiceMode, audio: true });
      setLocalStream(stream);
      setCameraStream(stream);

      if (socket) {
        socket.on('room-participants', updated => {
          setRoomParticipants(updated);
          setStreams(prev => {
            const next = { ...prev };
            let changed = false;
            Object.keys(next).forEach(sid => {
              const p = updated.find(part => part.socketId === sid);
              if (next[sid].screen && (!p || !p.isScreenSharing)) {
                next[sid] = { ...next[sid], screen: null };
                changed = true;
              }
            });
            return changed ? next : prev;
          });
        });
        socket.on('receive-chat', msg => {
          const isSelf = msg.sender === currentUser.name;
          setMessages(prev => [...prev, {
            sender: msg.sender,
            text: msg.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSelf
          }]);
        });
        socket.on('call-ended', () => onLeave());

        socket.on('user-joined-room', payload => {
          setMessages(prev => [...prev, {
            sender: 'Sistema',
            text: `${payload.name} entrou na sala.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSelf: false
          }]);
        });

        socket.on("all-users", users => {
          users.forEach(id => {
            // EVITAR DUPLICADOS
            if (peersRef.current.find(p => p.peerID === id)) return;

            const peer = createPeer(id, socket.id, stream);
            peer.on("stream", s => {
              console.log(`[WebRTC] Stream received from ${id}:`, s.id, "Tracks:", s.getTracks().map(t => t.kind));
              setStreams(prev => {
                const current = prev[id] || {};
                const currentHasVideo = current.webcam?.getVideoTracks().length > 0;
                const newHasVideo = s.getVideoTracks().length > 0;

                if (!current.webcam || (!currentHasVideo && newHasVideo)) {
                  return { ...prev, [id]: { ...current, webcam: s } };
                }

                if (current.webcam && current.webcam.id !== s.id) {
                  return { ...prev, [id]: { ...current, screen: s } };
                }
                return prev;
              });
            });
            peersRef.current.push({ peerID: id, peer });
          });
        });

        socket.on("user-joined", payload => {
          const existingPeer = peersRef.current.find(p => p.peerID === payload.callerID);
          if (existingPeer) {
            existingPeer.peer.signal(payload.signal);
          } else {
            const peer = addPeer(payload.signal, payload.callerID, stream);
            peer.on("stream", s => {
              const peerID = payload.callerID;
              console.log(`[WebRTC] Stream received from ${peerID}:`, s.id, "Tracks:", s.getTracks().map(t => t.kind));
              setStreams(prev => {
                const current = prev[peerID] || {};
                const currentHasVideo = current.webcam?.getVideoTracks().length > 0;
                const newHasVideo = s.getVideoTracks().length > 0;

                if (!current.webcam || (!currentHasVideo && newHasVideo)) {
                  return { ...prev, [peerID]: { ...current, webcam: s } };
                }

                if (current.webcam && current.webcam.id !== s.id) {
                  return { ...prev, [peerID]: { ...current, screen: s } };
                }
                return prev;
              });
            });
            peersRef.current.push({ peerID: payload.callerID, peer });
          }
        });

        socket.on("receiving-returned-signal", p => {
          const item = peersRef.current.find(i => i.peerID === p.id);
          if (item) item.peer.signal(p.signal);
        });

        socket.on("user-disconnected", userId => {
          setRoomParticipants(currentParticipants => {
            const participant = currentParticipants.find(p => p.socketId === userId);
            if (participant) {
              setMessages(prev => [...prev, {
                sender: 'Sistema',
                text: `${participant.name} saiu da reunião.`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isSelf: false
              }]);
            }
            return currentParticipants.filter(p => p.socketId !== userId);
          });

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

        socket.emit("join-room", {
          roomId,
          uid: currentUser.uid,
          name: currentUser.name,
          avatarUrl: currentUser.avatarUrl
        });
      }
    } catch (err) { console.error(err); }
  };

  const createPeer = (userToSignal, callerID, stream) => {
    console.log(`[WebRTC] Inciando oferta (Offer) para: ${userToSignal}`);
    const peer = new Peer({ initiator: true, stream });
    peer.on("signal", signal => {
      console.log(`[WebRTC] Sinal de oferta gerado para ${userToSignal}`);
      try {
        console.log(`[WebRTC] Offer signal details: type=${signal.type || 'n/a'} sdpLen=${signal.sdp ? signal.sdp.length : 0} hasCandidate=${'candidate' in signal}`);
      } catch (e) {}
      socket.emit("sending-signal", { userToSignal, callerID, signal });
    });
    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    console.log(`[WebRTC] Recebida oferta de ${callerID}. Gerando resposta (Answer)...`);
    const peer = new Peer({ initiator: false, stream });
    peer.on("signal", signal => {
      console.log(`[WebRTC] Sinal de resposta gerado para ${callerID}`);
      try {
        console.log(`[WebRTC] Answer signal details: type=${signal.type || 'n/a'} sdpLen=${signal.sdp ? signal.sdp.length : 0} hasCandidate=${'candidate' in signal}`);
      } catch (e) {}
      socket.emit("returning-signal", { signal, callerID });
    });
    peer.signal(incomingSignal);
    return peer;
  };

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
        peersRef.current.forEach(({ peer }) => {
          if (screenStream) {
            try { peer.removeStream(screenStream); } catch (e) { console.error("Error removing stream:", e); }
          }
        });
        if (screenStream) {
          screenStream.getTracks().forEach(t => t.stop());
        }
        setScreenStream(null);
        setScreenSharing(false);
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(stream);
      setScreenSharing(true);

      peersRef.current.forEach(({ peer }) => {
        peer.addStream(stream);
      });

      stream.getVideoTracks()[0].onended = () => {
        setScreenSharing(false);
        setScreenStream(null);
        peersRef.current.forEach(({ peer }) => {
          try { peer.removeStream(stream); } catch (e) { console.error("Error removing stream:", e); }
        });
      };
    } catch (err) {
      console.error("Screen share error:", err);
      setScreenSharing(false);
    }
  };

  const handleSendMessage = (text) => {
    const msg = { sender: currentUser.name, text };
    socket.emit('send-chat', { roomId, message: msg });
  };

  const inviteUser = async (targetId, handleInviteToCall) => {
    if (invitedUserIds.has(targetId)) return;

    // Optimistic update to block button immediately
    setInvitedUserIds(prev => new Set(prev).add(targetId));

    try {
      await handleInviteToCall(targetId, roomId, callType);
    } catch (err) {
      // Revert if failed
      setInvitedUserIds(prev => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
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

  const allParticipants = [
    // Local Webcam
    {
      id: socket?.id || 'local',
      uid: currentUser?.uid,
      stream: cameraStream,
      isLocal: true,
      name: currentUser?.name || 'Você (Eu)',
      avatarUrl: currentUser?.avatarUrl,
      handRaised: isHandRaised,
      isMicOn,
      isCamOn: isVideoOn,
      isActuallySharing: screenSharing
    },
    ...(screenSharing && screenStream && screenStream.active ? [{
      id: (socket?.id || 'local') + '-screen',
      uid: currentUser?.uid,
      stream: screenStream,
      isLocal: true,
      isScreenSharing: true,
      name: `Tela de ${currentUser?.name || 'Você'}`,
      handRaised: false,
      isMicOn: false,
      isCamOn: true
    }] : []),
    // Remote Participants
    ...Object.entries(streams).flatMap(([socketId, userStreams]) => {
      const serverState = roomParticipants.find(p => p.socketId === socketId);
      const isSharing = !!userStreams.screen;
      const res = [];
      if (userStreams.webcam) {
        res.push({
          id: socketId,
          uid: serverState?.uid,
          stream: userStreams.webcam,
          isLocal: false,
          name: serverState?.name || `Convidado`,
          avatarUrl: serverState?.avatarUrl,
          handRaised: serverState?.isHandRaised || false,
          isMicOn: serverState?.isMicOn ?? true,
          isCamOn: serverState?.isCamOn ?? true,
          isActuallySharing: isSharing
        });
      }
      if (userStreams.screen && userStreams.screen.active) {
        res.push({
          id: socketId + '-screen',
          uid: serverState?.uid,
          stream: userStreams.screen,
          isLocal: false,
          isScreenSharing: true,
          name: `Tela de ${serverState?.name || 'Convidado'}`,
          avatarUrl: serverState?.avatarUrl,
          handRaised: false,
          isMicOn: false,
          isCamOn: true
        });
      }
      return res;
    })
  ];

  return {
    streams, localStream, cameraStream, screenSharing, time,
    isMicOn, isVideoOn, isHandRaised, setIsHandRaised,
    messages, roomParticipants, allParticipants, invitedUserIds,
    toggleMic, toggleVideo, shareScreen, handleSendMessage, handleExit, inviteUser
  };
}
