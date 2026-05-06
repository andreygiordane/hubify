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

    const onParticipants = updated => {
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
    };

    const onReceiveChat = msg => {
      const isSelf = msg.sender === currentUser.name;
      setMessages(prev => [...prev, {
        sender: msg.sender,
        text: msg.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSelf
      }]);
    };

    const onCallEnded = () => onLeave();

    const onAllUsers = users => {
      console.log(`[Socket] Recebida lista de usuários (${users.length}):`, users);
      users.forEach(id => {
        if (peersRef.current.find(p => p.peerID === id)) return;
        const peer = createPeer(id, socket.id, localStreamRef.current);
        peer.on("stream", s => {
          console.log(`[WebRTC] Stream recebido de ${id}`);
          setStreams(prev => ({ ...prev, [id]: { ...(prev[id] || {}), webcam: s } }));
        });
        peersRef.current.push({ peerID: id, peer });
      });
    };

    const onUserJoined = payload => {
      console.log(`[Socket] Sinal recebido de ${payload.callerID}`);
      const existingPeer = peersRef.current.find(p => p.peerID === payload.callerID);
      if (existingPeer) {
        try {
          existingPeer.peer.signal(payload.signal);
        } catch (e) { console.warn("[WebRTC] Erro ao sinalizar peer existente:", e.message); }
      } else {
        const peer = addPeer(payload.signal, payload.callerID, localStreamRef.current);
        peer.on("stream", s => {
          console.log(`[WebRTC] Stream recebido de ${payload.callerID} (via user-joined)`);
          setStreams(prev => ({ ...prev, [payload.callerID]: { ...(prev[payload.callerID] || {}), webcam: s } }));
        });
        peersRef.current.push({ peerID: payload.callerID, peer });
      }
    };

    const onReturnSignal = p => {
      const item = peersRef.current.find(i => i.peerID === p.id);
      if (item) {
        try {
          item.peer.signal(p.signal);
        } catch (e) { console.warn("[WebRTC] Erro ao sinalizar peer retornado:", e.message); }
      }
    };

    const onUserDisconnected = userId => {
      console.log(`[Socket] Usuário saiu:`, userId);
      setRoomParticipants(prev => prev.filter(p => p.socketId !== userId));
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
    };

    socket.on('room-participants', onParticipants);
    socket.on('receive-chat', onReceiveChat);
    socket.on('call-ended', onCallEnded);
    socket.on('all-users', onAllUsers);
    socket.on('user-joined', onUserJoined);
    socket.on('receiving-returned-signal', onReturnSignal);
    socket.on('user-disconnected', onUserDisconnected);

    return () => {
      socket.off('room-participants', onParticipants);
      socket.off('receive-chat', onReceiveChat);
      socket.off('call-ended', onCallEnded);
      socket.off('all-users', onAllUsers);
      socket.off('user-joined', onUserJoined);
      socket.off('receiving-returned-signal', onReturnSignal);
      socket.off('user-disconnected', onUserDisconnected);
    };
  }, [socket]);

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
  const initMedia = async () => {
    if (!socket || !socket.connected) return;

    console.log(`[Media] Obtendo mídia local na sala: ${roomId}`);

    // Tentar obter Media (Async)
    navigator.mediaDevices.getUserMedia({ video: !isVoiceMode, audio: true })
      .then(stream => {
        console.log(`[Media] Local stream obtido com sucesso`);
        setLocalStream(stream);
        setCameraStream(stream);
        // Adicionar o stream a todos os peers já conectados
        peersRef.current.forEach(({ peer }) => {
          try { peer.addStream(stream); } catch (e) {}
        });
      })
      .catch(err => {
        console.error(`[Media] Erro ao obter stream local:`, err);
      });
  };

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({ initiator: true, stream });
    peer.on("signal", signal => {
      socket.emit("sending-signal", { userToSignal, callerID, signal });
    });
    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({ initiator: false, stream });
    peer.on("signal", signal => {
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

  const allParticipants = participantsList;

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
