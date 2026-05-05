
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import MeetingInterface from '../components/video/MeetingInterface';
import { io } from 'socket.io-client';

const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  if (envUrl) return envUrl;
  
  return 'https://hubify-video-server-358184322842.us-central1.run.app';
};

const SOCKET_URL = getSocketUrl();

export default function MeetingRoom() {
  const { user, currentUserProfile, setUserStatus } = useAuth();
  const { activeRoomId, setView, callType, mediaSettings, handleLeaveRoom } = useChat();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket'] });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  const handleLeave = () => {
    handleLeaveRoom();
  };

  if (!user || !activeRoomId || !socket) {
    return (
      <div className="h-screen w-full bg-[#0a0d14] flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold mb-2">Entrando na sala...</h2>
        <p className="text-gray-400 max-w-xs">Aguarde enquanto estabelecemos uma conexão segura com o servidor de chamadas.</p>
      </div>
    );
  }

  return (
    <MeetingInterface 
      roomId={activeRoomId}
      currentUser={{ 
        uid: user.id, 
        name: currentUserProfile?.name || user.displayName || user.username,
        avatarUrl: currentUserProfile?.avatarUrl
      }}
      socket={socket}
      callType={callType}
      onLeave={handleLeave}
      initialMediaSettings={mediaSettings}
    />
  );
}
