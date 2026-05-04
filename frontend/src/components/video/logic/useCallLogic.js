import { useState, useEffect, useRef } from 'react';
import { Peer } from '../utils/WebRTCUtils';

export function useCallLogic({ roomId, currentUser, socket, callType, onLeave }) {
  const [streams, setStreams] = useState({});
  const [localStream, setLocalStream] = useState(null);       
  const [cameraStream, setCameraStream] = useState(null);     
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
    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
    isSelf: false 
  }]);
  const [roomParticipants, setRoomParticipants] = useState([]);

  const peersRef = useRef([]);
  const [invitedUserIds, setInvitedUserIds] = useState(new Set());

  useEffect(() => {
    const timer = setInterval(() => setTime(t => t + 1), 1000);
    return () => {
      clearInterval(timer);
      peersRef.current.forEach(p => p.peer.destroy());
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (cameraStream && cameraStream !== localStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream, cameraStream]);

  useEffect(() => {
    if (socket && roomId && !hasConnected) {
      initMedia();
    }
  }, [socket, roomId]);

  useEffect(() => {
    if (socket && roomId) {
      socket.emit('update-user-state', { roomId, state: { isMicOn, isCamOn: isVideoOn, isHandRaised } });
    }
  }, [isMicOn, isVideoOn, isHandRaised]);

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
        socket.emit("join-room", { 
          roomId, 
          uid: currentUser.uid, 
          name: currentUser.name,
          avatarUrl: currentUser.avatarUrl
        });
        
        socket.on('room-participants', updated => setRoomParticipants(updated));
        socket.on('receive-chat', msg => {
          const isSelf = msg.sender === currentUser.name;
          setMessages(prev => [...prev, { 
            sender: msg.sender, 
            text: msg.text, 
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
            isSelf 
          }]);
        });
        socket.on('call-ended', () => onLeave());

        socket.on('user-joined-room', payload => {
          setMessages(prev => [...prev, { 
            sender: 'Sistema', 
            text: `${payload.name} entrou na sala.`, 
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
            isSelf: false 
          }]);
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

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({ initiator: true, trickle: true, stream });
    peer.on("signal", signal => socket.emit("sending-signal", { userToSignal, callerID, signal }));
    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({ initiator: false, trickle: true, stream });
    peer.on("signal", signal => socket.emit("returning-signal", { signal, callerID }));
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

  return {
    streams, localStream, cameraStream, screenSharing, time,
    isMicOn, isVideoOn, isHandRaised, setIsHandRaised,
    messages, roomParticipants, allParticipants, invitedUserIds,
    toggleMic, toggleVideo, shareScreen, handleSendMessage, handleExit, inviteUser
  };
}
