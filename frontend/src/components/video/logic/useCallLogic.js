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
    console.log(`[Componente] useCallLogic montado para sala: ${roomId} | Socket: ${socket?.id || 'Desconectado'}`);
    if (socket && roomId && !hasConnected) {
      const handleInit = () => {
        console.log(`[Socket] Gatilho de inicialização disparado para ${socket.id}`);
        // 1. Entrar na sala IMEDIATAMENTE (Sinalização em paralelo com Mídia)
        socket.emit("join-room", {
          roomId,
          uid: currentUser.uid,
          name: currentUser.name,
          avatarUrl: currentUser.avatarUrl
        });
        // 2. Iniciar mídia em paralelo
        initMedia();
      };

      if (socket.connected) {
        handleInit();
      } else {
        socket.once('connect', handleInit);
      }
    }
  }, [socket, roomId]);

  // Gerenciamento de Listeners (Prevenção de Duplicidade)
  useEffect(() => {
    if (!socket) return;


    socket.off('room-participants');
    socket.on('room-participants', updated => {
      setRoomParticipants(updated);
      setStreams(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(sid => {
          const p = updated.find(part => part.socketId === sid);
          if (next[sid]?.screen && (!p || !p.isScreenSharing)) {
            next[sid] = { ...next[sid], screen: null };
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    });

    socket.off('receive-chat');
    socket.on('receive-chat', msg => {
      const isSelf = msg.sender === currentUser.name;
      setMessages(prev => [...prev, {
        sender: msg.sender,
        text: msg.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSelf
      }]);
    });

    socket.off('call-ended');
    socket.on('call-ended', () => onLeave());

    socket.off('user-connected');
    socket.on('user-connected', userId => {
      if (peersRef.current.find(p => p.peerID === userId)) return;
      console.log(`[Socket] Novo usuário na sala: ${userId}. Iniciando conexão...`);
      const peer = createPeer(userId, socket.id, localStreamRef.current);
      peersRef.current.push({ peerID: userId, peer });
    });

    socket.off('user-joined');
    socket.on("user-joined", payload => {
      const existing = peersRef.current.find(p => p.peerID === payload.callerID);
      if (existing) {
        console.log(`[Socket] Sinal recebido para conexão existente: ${payload.callerID}`);
        existing.peer.signal(payload.signal);
        return;
      }
      console.log(`[Socket] Sinal recebido de ${payload.callerID}. Respondendo...`);
      const peer = addPeer(payload.signal, payload.callerID, localStreamRef.current);
      peersRef.current.push({ peerID: payload.callerID, peer });
    });

    socket.off('receiving-returned-signal');
    socket.on("receiving-returned-signal", payload => {
      const item = peersRef.current.find(p => p.peerID === payload.id);
      if (item) item.peer.signal(payload.signal);
    });

    socket.off('user-disconnected');
    socket.on('user-disconnected', userId => {
      console.log(`[Socket] Usuário saiu:`, userId);
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

    return () => {
      socket.off('room-participants');
      socket.off('receive-chat');
      socket.off('call-ended');
      socket.off('user-connected');
      socket.off('user-joined');
      socket.off('receiving-returned-signal');
      socket.off('user-disconnected');
    };
  }, [socket, roomId, currentUser, onLeave]);

  useEffect(() => {
    if (socket && roomId) {
      socket.emit('update-user-state', { roomId, state: { isMicOn, isCamOn: isVideoOn, isHandRaised, isScreenSharing: screenSharing } });
    }
  }, [isMicOn, isVideoOn, isHandRaised, screenSharing]);

  // Removido temporariamente para evitar kicks acidentais
  /*
  useEffect(() => {
    if (roomId && roomId.startsWith('dm_')) {
      if (roomParticipants.length > 1) {
        setHasConnected(true);
      } else if (hasConnected && roomParticipants.length <= 1) {
        onLeave();
      }
    }
  }, [roomParticipants, roomId, hasConnected, onLeave]);
  */
  const isInitializingMedia = useRef(false);
  const initMedia = async () => {
    if (!socket || !socket.connected || isInitializingMedia.current || localStreamRef.current) return;

    isInitializingMedia.current = true;
    console.log(`[Media] Obtendo mídia local na sala: ${roomId}`);

    // Tentar obter Media (Async)
    navigator.mediaDevices.getUserMedia({ video: !isVoiceMode, audio: true })
      .then(stream => {
        console.log(`[Media] Local stream obtido com sucesso`);
        localStreamRef.current = stream;
        setLocalStream(stream);
        setCameraStream(stream);
        // Adicionar o stream a todos os peers já conectados
        peersRef.current.forEach(({ peer }) => {
          try { peer.addStream(stream); } catch (e) {}
        });
      })
      .catch(err => {
        console.error(`[Media] Erro ao obter stream local:`, err);
      })
      .finally(() => {
        isInitializingMedia.current = false;
      });
  };

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({ initiator: true, stream });
    peer.on("signal", signal => {
      socket.emit("sending-signal", { userToSignal, callerID, signal });
    });
    peer.on("stream", s => {
      console.log(`[WebRTC] Stream recebido de ${userToSignal}`);
      setStreams(prev => ({ ...prev, [userToSignal]: { ...(prev[userToSignal] || {}), webcam: s } }));
    });
    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({ initiator: false, stream });
    peer.on("signal", signal => {
      socket.emit("returning-signal", { signal, callerID });
    });
    peer.on("stream", s => {
      console.log(`[WebRTC] Stream recebido de ${callerID}`);
      setStreams(prev => ({ ...prev, [callerID]: { ...(prev[callerID] || {}), webcam: s } }));
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
          if (screenStream) { try { peer.removeStream(screenStream); } catch (e) {} }
        });
        if (screenStream) screenStream.getTracks().forEach(t => t.stop());
        setScreenStream(null);
        setScreenSharing(false);
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(stream);
      setScreenSharing(true);
      peersRef.current.forEach(({ peer }) => peer.addStream(stream));
      stream.getVideoTracks()[0].onended = () => {
        setScreenSharing(false);
        setScreenStream(null);
        peersRef.current.forEach(({ peer }) => { try { peer.removeStream(stream); } catch (e) {} });
      };
    } catch (err) { console.error(err); setScreenSharing(false); }
  };

  const handleSendMessage = (text) => {
    const msg = { sender: currentUser.name, text };
    socket.emit('send-chat', { roomId, message: msg });
  };

  const inviteUser = async (targetId, handleInviteToCall) => {
    if (invitedUserIds.has(targetId)) return;
    setInvitedUserIds(prev => new Set(prev).add(targetId));
    try {
      await handleInviteToCall(targetId, roomId, callType);
    } catch (err) {
      setInvitedUserIds(prev => { const next = new Set(prev); next.delete(targetId); return next; });
    }
  };

  const handleExit = () => {
    if (socket && roomId) {
      if (roomId.startsWith('dm_')) socket.emit('end-call', { roomId });
      else socket.emit('leave-room', { roomId });
    }
    onLeave();
  };

  // REATOR: allParticipants agora é guiado pela lista de participantes do servidor
  let participantsList = roomParticipants.map(p => {
    const isLocal = p.socketId === socket?.id;
    const userStreams = streams[p.socketId] || {};
    
    return {
      id: p.socketId,
      uid: p.uid,
      name: isLocal ? (currentUser?.name || p.name) : (p.name || 'Convidado'),
      avatarUrl: isLocal ? (currentUser?.avatarUrl || currentUser?.avatar || p.avatarUrl) : p.avatarUrl,
      isLocal,
      stream: isLocal ? cameraStream : userStreams.webcam,
      handRaised: isLocal ? isHandRaised : p.isHandRaised,
      isMicOn: isLocal ? isMicOn : p.isMicOn,
      isCamOn: isLocal ? isVideoOn : p.isCamOn,
      isActuallySharing: isLocal ? screenSharing : !!userStreams.screen,
      isScreenSharing: false
    };
  });

  // Fallback: se a lista do servidor estiver vazia ou não tiver o local, forçar o local
  const hasLocal = participantsList.some(p => p.isLocal);
  if (!hasLocal && currentUser) {
    participantsList.unshift({
      id: socket?.id || 'local',
      uid: currentUser.uid,
      name: `${currentUser.name} (Conectando...)`,
      avatarUrl: currentUser.avatarUrl,
      isLocal: true,
      stream: cameraStream,
      handRaised: isHandRaised,
      isMicOn: isMicOn,
      isCamOn: isVideoOn,
      isActuallySharing: screenSharing,
      isScreenSharing: false
    });
  }

  // Deduplicar por id e preferir entradas que possuam stream (evita tile de avatar + tile de stream do mesmo usuário)
  const participantsMap = new Map();
  participantsList.forEach(p => {
    const existing = participantsMap.get(p.id);
    if (!existing) participantsMap.set(p.id, p);
    else if (!existing.stream && p.stream) participantsMap.set(p.id, p);
  });
  const allParticipants = Array.from(participantsMap.values());

  // Adicionar telas compartilhadas como participantes virtuais
  if (screenSharing && screenStream && screenStream.active) {
    allParticipants.push({
      id: (socket?.id || 'local') + '-screen',
      uid: currentUser?.uid,
      stream: screenStream,
      isLocal: true,
      isScreenSharing: true,
      name: `Sua Tela`,
      handRaised: false, isMicOn: false, isCamOn: true
    });
  }

  Object.entries(streams).forEach(([sid, userStreams]) => {
    if (userStreams.screen && userStreams.screen.active) {
      const p = roomParticipants.find(part => part.socketId === sid);
      allParticipants.push({
        id: sid + '-screen',
        uid: p?.uid,
        stream: userStreams.screen,
        isLocal: false,
        isScreenSharing: true,
        name: `Tela de ${p?.name || 'Convidado'}`,
        avatarUrl: p?.avatarUrl,
        handRaised: false, isMicOn: false, isCamOn: true
      });
    }
  });

  return {
    streams, localStream, cameraStream, screenSharing, time,
    isMicOn, isVideoOn, isHandRaised, setIsHandRaised,
    messages, roomParticipants, allParticipants, invitedUserIds,
    toggleMic, toggleVideo, shareScreen, handleSendMessage, handleExit, inviteUser
  };
}
