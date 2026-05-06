
import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  getDatabase, getCollectionPath, getDocumentPath, listenToCollection,
  fetchCollection, patchDocument, saveDocument, removeDocument, createDocument
} from '../api-client';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';
const SOCKET_OPTIONS = { 
  transports: ['polling', 'websocket'],
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  timeout: 20000
};

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { user, currentUserProfile, userStatus, setUserStatus } = useAuth();
  const appId = 'hubify';
  const db = getDatabase();

  // Estados
  const [activeRoomId, setActiveRoomId] = useState(() => localStorage.getItem('hubify_active_room_id') || null);
  const [callType, setCallType] = useState('video');
  const [mediaSettings, setMediaSettings] = useState({ video: true, audio: true });
  const [allMessages, setAllMessages] = useState([]);

  const handleUpdateProfile = async (data) => {
    try {
      await saveDocument(`artifacts/hubify/public/data/users/${user.id}`, data, { merge: true });
      
      // Emitir via socket para atualização instantânea para todos
      if (socketRef.current) {
        socketRef.current.emit('profile-update', { userId: user.id, data });
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      throw error;
    }
  };

  const markRoomAsRead = async (roomId) => {
    if (!roomId || !user?.id) return;

    const now = Date.now();
    console.log(`[MARK_READ] Marking room ${roomId} as read at ${new Date(now).toISOString()}`);
    
    setReadTimestamps(prev => {
      if ((prev[roomId] || 0) >= now) {
        console.log(`[MARK_READ] Room ${roomId} already marked as read more recently`);
        return prev;
      }

      const next = { ...prev, [roomId]: now };
      console.log(`[MARK_READ] Updated local readTimestamps:`, next);
      
      handleUpdateProfile({ readTimestamps: JSON.stringify(next) }).catch(err => {
        console.error(`[MARK_READ] Error updating profile:`, err);
      });

      if (socketRef.current) {
        console.log(`[MARK_READ] Emitting messages-read event via socket`);
        socketRef.current.emit('messages-read', {
          roomId,
          userId: user.id,
          timestamp: now
        });
      } else {
        console.warn(`[MARK_READ] Socket not available for room ${roomId}`);
      }

      return next;
    });
  };

  const [groups, setGroups] = useState([]);
  const groupsRef = useRef(groups);
  useEffect(() => { groupsRef.current = groups; }, [groups]);
  
  // Rastrear salas em processo de deleção para evitar que reapareçam via polling
  const processingDeletions = useRef(new Set());
  
  // Rastrear timestamps de ordenação para evitar que deletar mensagens mude a posição do card
  const roomSortTimestamps = useRef({}); // { roomId: timestamp }
  const [users, setUsers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [activeDMs, setActiveDMs] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // { roomId: { userId: userName } }
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const [readTimestamps, setReadTimestamps] = useState({});
  
  // 🔥 NOVO: Estado separado para readTimestamps dos outros usuários (atualizado APENAS via Socket.IO)
  // Isso evita que o polling de usuários sobrescreva os dados
  const [otherUsersReadTimestamps, setOtherUsersReadTimestamps] = useState({});
  const [roomWallpapers, setRoomWallpapers] = useState(() => {
    try {
      const saved = localStorage.getItem('hubify_room_wallpapers');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  const handleUpdateRoomWallpaper = (roomId, wallpaperId) => {
    setRoomWallpapers(prev => {
      const next = { ...prev, [roomId]: wallpaperId };
      localStorage.setItem('hubify_room_wallpapers', JSON.stringify(next));
      return next;
    });
  };
  
  useEffect(() => {
    if (currentUserProfile?.readTimestamps) {
      try {
        setReadTimestamps(JSON.parse(currentUserProfile.readTimestamps));
      } catch (e) {
        setReadTimestamps({});
      }
    }
  }, [currentUserProfile]);
  const [mutedRooms, setMutedRooms] = useState(() => {
    try {
      const saved = localStorage.getItem('hubify_muted_rooms');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  // Interface e Modais
  const [view, setView] = useState(() => localStorage.getItem('hubify_active_view') || 'chat');
  const [incomingCall, setIncomingCall] = useState(null);
  const [isOutgoingCall, setIsOutgoingCall] = useState(false);
  const [outgoingTarget, setOutgoingTarget] = useState(null);
  const [showMediaSetup, setShowMediaSetup] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDMModal, setShowDMModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showContactDetailModal, setShowContactDetailModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [previewDocument, setPreviewDocument] = useState(null);
  const [selectedChatMobile, setSelectedChatMobile] = useState(null);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [groupInvites, setGroupInvites] = useState([]);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [deletedRoomIds, setDeletedRoomIds] = useState([]);
  const deletedRoomIdsRef = useRef(deletedRoomIds);
  useEffect(() => {
    deletedRoomIdsRef.current = deletedRoomIds;
  }, [deletedRoomIds]);

  // Estados de formulário/dados temporários
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingDate, setNewMeetingDate] = useState('');
  const [calendarItemType, setCalendarItemType] = useState('meeting');
  const [selectedInvitees, setSelectedInvitees] = useState([]);
  const [editingMeetingId, setEditingMeetingId] = useState(null);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [selectedContactDetail, setSelectedContactDetail] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadComment, setUploadComment] = useState('');
  const [meetingNotifications, setMeetingNotifications] = useState([]);
  const [newGroupAvatar, setNewGroupAvatar] = useState('');

  const statusConfig = {
    online: { label: 'Online', color: 'bg-green-500' },
    offline: { label: 'Offline', color: 'bg-gray-500' },
    ausente: { label: 'Ausente', color: 'bg-yellow-500' },
    reuniao: { label: 'Em Reunião', color: 'bg-blue-500' },
    ocupado: { label: 'Ocupado', color: 'bg-red-500' }
  };

  // Refs
  const messagesEndRef = useRef(null);
  const notificationAudio = useRef(new Audio('/audio/notificacao.mp3'));
  const isFirstLoadMessages = useRef(true);
  const lastMessagesCount = useRef(0);
  const notified10 = useRef(new Set());
  const notified5 = useRef(new Set());
  const notified0 = useRef(new Set());
  const notifiedHostJoined = useRef(new Set());

  const activeRoomIdRef = useRef(activeRoomId);
  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
    localStorage.setItem('hubify_active_room_id', activeRoomId);
  }, [activeRoomId]);

  const mutedRoomsRef = useRef(mutedRooms);
  useEffect(() => {
    mutedRoomsRef.current = mutedRooms;
  }, [mutedRooms]);

  const playNotificationSound = (roomId = null) => {
    if (roomId && (mutedRoomsRef.current || []).includes(roomId)) return;
    
    notificationAudio.current.currentTime = 0;
    notificationAudio.current.play().catch(e => {
      // Browsers often block auto-play until user interaction
      console.log('Audio playback pending user interaction');
    });
  };

  // Persistência
  const viewRef = useRef(view);
  const processedCallsRef = useRef(new Set());
  const incomingCallRef = useRef(incomingCall);
  const isOutgoingCallRef = useRef(isOutgoingCall);

  useEffect(() => {
    viewRef.current = view;
    localStorage.setItem('hubify_active_view', view);
  }, [view]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
    isOutgoingCallRef.current = isOutgoingCall;
  }, [isOutgoingCall]);

  useEffect(() => {
    if (activeRoomId) localStorage.setItem('hubify_active_room_id', activeRoomId);
    else localStorage.removeItem('hubify_active_room_id');
  }, [activeRoomId]);

  const handleStartMeeting = async (forcedRoomId = null) => {
    if (view === 'room') {
      alert("Você já está em uma chamada ativa. Encerre-a antes de iniciar outra.");
      return;
    }
    const rId = forcedRoomId || activeRoomId;
    if (!rId) return;

    if (rId.startsWith('dm_')) {
      const otherId = rId.replace('dm_', '').split('_').find(id => id !== user.id);
      const contact = users.find(u => u.id === otherId);

      if (contact?.status === 'reuniao' || contact?.status === 'ocupado') {
        alert(`${contact.name} está em outra reunião ou ocupado no momento.`);
        return;
      }

      setCallType('video');
      setMediaSettings({ video: true, audio: true });
      setIsOutgoingCall(true);
      setOutgoingTarget({
        id: otherId,
        name: contact?.name || 'Colega',
        avatarUrl: contact?.avatarUrl || "/images/default-avatar.png"
      });

      const callId = `call_${Date.now()}`;
      
      // Enviar convite de forma assíncrona para não travar a UI de discagem
      createDocument(`artifacts/${appId}/public/data/calls`, {
        id: callId,
        from: user.id,
        fromName: currentUserProfile?.name || user.username,
        fromAvatar: currentUserProfile?.avatarUrl,
        to: otherId,
        type: 'video',
        status: 'ringing',
        roomId: rId,
        timestamp: Date.now()
      }).catch(err => {
        console.error("Erro ao criar convite de chamada:", err);
        setIsOutgoingCall(false);
        alert("Falha ao iniciar a chamada. Tente novamente.");
      });
    } else {
      // É uma reunião agendada (começa com meeting_id)
      const mtgId = rId.replace('meeting_', '');
      const meeting = meetings.find(m => m.id === mtgId);

      if (meeting) {
        const isHost = meeting.creatorId === user.id;

        if (isHost) {
          // Anfitrião entra e inicia a reunião
          await saveDocument(`artifacts/${appId}/public/data/meetings/${mtgId}`, { status: 'ongoing' }, { merge: true });
        } else if (meeting.status !== 'ongoing') {
          // Convidado tentando entrar antes do host
          setSuccessMessage("Aguarde, a reunião começa em breve. O anfitrião ainda não iniciou a sala.");
          setShowSuccessModal(true);
          return;
        }
      }

      // Para grupos ou reuniões, convidar/entrar
      const group = groups.find(g => g.id === rId);
      if (group) {
        setIsOutgoingCall(true);
        setOutgoingTarget({
          id: group.id,
          name: group.name,
          isGroup: true
        });

        group.members.forEach(async (memberId) => {
          if (memberId !== user.id) {
            const member = users.find(u => u.id === memberId);
            if (member?.status === 'reuniao' || member?.status === 'ocupado') return;

            const callId = `call_${Date.now()}_${memberId}`;
            await createDocument(`artifacts/${appId}/public/data/calls`, {
              id: callId,
              from: user.id,
              fromName: `${currentUserProfile?.name || user.username} (Grupo: ${group.name})`,
              fromAvatar: currentUserProfile?.avatarUrl,
              to: memberId,
              type: 'video',
              status: 'ringing',
              roomId: rId,
              timestamp: Date.now()
            });
          }
        });
      }
      setCallType('video');
      setMediaSettings({ video: true, audio: true });
      setActiveRoomId(rId);
      setView('room');
      setUserStatus('reuniao');
      // For groups, we don't show the dialer to the initiator
      setIsOutgoingCall(false); 
    }
  };

  const handleStartAudioCall = async (forcedRoomId = null) => {
    if (view === 'room') {
      alert("Você já está em uma chamada ativa. Encerre-a antes de iniciar outra.");
      return;
    }
    const rId = forcedRoomId || activeRoomId;
    if (!rId) return;

    if (rId.startsWith('dm_')) {
      const otherId = rId.replace('dm_', '').split('_').find(id => id !== user.id);
      const contact = users.find(u => u.id === otherId);

      if (contact?.status === 'reuniao' || contact?.status === 'ocupado') {
        alert(`${contact.name} está em outra reunião ou ocupado no momento.`);
        return;
      }

      setCallType('audio');
      setMediaSettings({ video: false, audio: true });
      setIsOutgoingCall(true);
      setOutgoingTarget({
        id: otherId,
        name: contact?.name || 'Colega',
        avatarUrl: contact?.avatarUrl || "/images/default-avatar.png"
      });

      const callId = `call_${Date.now()}`;
      
      // Enviar convite de forma assíncrona
      createDocument(`artifacts/${appId}/public/data/calls`, {
        id: callId,
        from: user.id,
        fromName: currentUserProfile?.name || user.username,
        fromAvatar: currentUserProfile?.avatarUrl,
        to: otherId,
        type: 'audio',
        status: 'ringing',
        roomId: rId,
        timestamp: Date.now()
      }).catch(err => {
        console.error("Erro ao criar convite de áudio:", err);
        setIsOutgoingCall(false);
      });
    } else {
      // Para grupos, convidar todos os membros
      const group = groups.find(g => g.id === rId);
      if (group) {
        setIsOutgoingCall(true);
        setOutgoingTarget({
          id: group.id,
          name: group.name,
          isGroup: true
        });

        group.members.forEach(async (memberId) => {
          if (memberId !== user.id) {
            const member = users.find(u => u.id === memberId);
            if (member?.status === 'reuniao' || member?.status === 'ocupado') return;

            const callId = `call_${Date.now()}_${memberId}`;
            await createDocument(`artifacts/${appId}/public/data/calls`, {
              id: callId,
              from: user.id,
              fromName: `${currentUserProfile?.name || user.username} (Grupo: ${group.name})`,
              fromAvatar: currentUserProfile?.avatarUrl,
              to: memberId,
              type: 'audio',
              status: 'ringing',
              roomId: rId,
              timestamp: Date.now()
            });
          }
        });
      }
      setCallType('audio');
      setMediaSettings({ video: false, audio: true });
      setActiveRoomId(rId);
      setView('room');
      setUserStatus('reuniao');
      setIsOutgoingCall(false);
    }
  };

  const handleInviteToCall = async (targetId, roomId, type) => {
    if (view !== 'room') {
      // Se não estivermos em uma sala, não faz sentido convidar para uma (a menos que seja o fluxo de início)
      // Mas aqui especificamente bloqueamos se estivermos tentando convidar de fora? 
      // Na verdade, o usuário quer que se estivermos em uma chamada, não possamos convidar (para outra?).
    }
    
    const contact = users.find(u => u.id === targetId);
    if (contact?.status === 'reuniao' || contact?.status === 'ocupado') {
      alert(`${contact.name} já está em uma reunião ou ocupado.`);
      return;
    }

    const callId = `call_invite_${Date.now()}_${targetId}`;
    await createDocument(`artifacts/${appId}/public/data/calls`, {
      id: callId,
      from: user.id,
      fromName: `${currentUserProfile?.name || user.username} (Convidando...)`,
      fromAvatar: currentUserProfile?.avatarUrl,
      to: targetId,
      type: type || 'video',
      status: 'ringing',
      roomId: roomId,
      timestamp: Date.now()
    });
  };

  const handleSendMessage = async (text, attachment = null, replyToId = null) => {
    if (!activeRoomId || !user) return;
    const msgId = `msg_${Date.now()}_${user.id}_${Math.random().toString(36).substr(2, 5)}`;
    const now = Date.now();
    const newMsg = {
      id: msgId,
      roomId: activeRoomId,
      senderId: user.id,
      senderName: currentUserProfile?.name || user.username,
      text,
      attachment,
      replyToId,
      timestamp: now,
      isOptimistic: true
    };

    // Atualização otimista: adiciona à lista local imediatamente
    setAllMessages(prev => [...prev, newMsg]);

    try {
      await createDocument(`artifacts/${appId}/public/data/messages`, newMsg);
      if (socketRef.current) {
        socketRef.current.emit('message-created', newMsg);
      }
      // O listener do Firebase/API cuidará de remover a flag isOptimistic ao receber a mensagem oficial
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      // Remover a mensagem otimista em caso de falha crítica
      setAllMessages(prev => prev.filter(m => m.id !== msgId));
    }
  };

  const handleForwardMessages = async (messageIds, targetRoomIds) => {
    for (const roomId of targetRoomIds) {
      for (const msgId of messageIds) {
        const originalMsg = allMessages.find(m => m.id === msgId);
        if (!originalMsg) continue;

        const newId = `msg_fwd_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        await createDocument(`artifacts/${appId}/public/data/messages`, {
          id: newId,
          roomId: roomId,
          senderId: user.id,
          senderName: currentUserProfile?.name || user.username,
          text: originalMsg.text,
          attachment: originalMsg.attachment,
          timestamp: Date.now(),
          isForwarded: true
        });
      }
    }
  };

  useEffect(() => {
    if (activeRoomId && user?.id) {
      console.log(`[ACTIVE_ROOM] Room activated: ${activeRoomId}`);
      localStorage.setItem('hubify_active_room_id', activeRoomId);
      markRoomAsRead(activeRoomId).catch(err => console.error(`[ACTIVE_ROOM] Error marking read:`, err));
    } else {
      console.log(`[ACTIVE_ROOM] No active room`);
      localStorage.removeItem('hubify_active_room_id');
    }
  }, [activeRoomId, user?.id]);

  // Sistema de Notificações de Reunião (10m, 5m, 0m e Host Entrou)
  useEffect(() => {
    if (!user || meetings.length === 0) return;

    const checkMeetings = () => {
      const now = Date.now();

      meetings.forEach(m => {
        if (m.type !== 'meeting') return;
        const meetingTime = new Date(m.date).getTime();
        const diffMinutes = (meetingTime - now) / (1000 * 60);

        // 1. Notificação 10 minutos antes
        if (diffMinutes > 9 && diffMinutes <= 10.5 && !notified10.current.has(m.id)) {
          notified10.current.add(m.id);
          playNotificationSound();
          setMeetingNotifications(prev => [...prev, { ...m, label: 'Faltam 10 minutos', type: '10m', notifiedAt: now }]);
        }

        // 2. Notificação 5 minutos antes
        if (diffMinutes > 4 && diffMinutes <= 5.5 && !notified5.current.has(m.id)) {
          notified5.current.add(m.id);
          playNotificationSound();
          setMeetingNotifications(prev => [...prev, { ...m, label: 'Faltam 5 minutos', type: '5m', notifiedAt: now }]);
        }

        // 3. Notificação no Horário (0 minutos)
        if (diffMinutes > -1 && diffMinutes <= 0.5 && !notified0.current.has(m.id)) {
          notified0.current.add(m.id);
          playNotificationSound();
          setMeetingNotifications(prev => [...prev, { ...m, label: 'A reunião vai começar', type: '0m', notifiedAt: now }]);
        }

        // 4. Notificação de Anfitrião Entrou (para convidados)
        if (m.status === 'ongoing' && m.creatorId !== user.id && !notifiedHostJoined.current.has(m.id)) {
          // Verificar se o usuário está convidado
          if (m.participants?.includes(user.id)) {
            notifiedHostJoined.current.add(m.id);
            playNotificationSound();
            setMeetingNotifications(prev => [...prev, { ...m, label: 'Anfitrião já está na sala', type: 'host_joined', notifiedAt: now }]);
          }
        }
      });
    };

    const timer = setInterval(checkMeetings, 30000);
    checkMeetings();
    return () => clearInterval(timer);
  }, [user, meetings]);

  // Socket Connection
  useEffect(() => {
    if (!user) return;

    console.log(`[SOCKET_INIT] Initializing socket connection to ${SOCKET_URL}`);
    const newSocket = io(SOCKET_URL, SOCKET_OPTIONS);
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log(`[SOCKET_CONNECT] Connected with ID: ${newSocket.id}`);
      // If there's an active room, join it immediately
      if (activeRoomIdRef.current && view !== 'room') {
        const profileAvatar = currentUserProfile?.avatarUrl || currentUserProfile?.avatar;
        newSocket.emit('join-room', { 
          roomId: activeRoomIdRef.current, 
          uid: user.id, 
          name: currentUserProfile?.name || user.username,
          avatarUrl: profileAvatar
        });
      }
    });

    newSocket.on('user-typing', ({ userId, userName }) => {
      const roomId = activeRoomIdRef.current;
      if (!roomId) return;
      setTypingUsers(prev => ({
        ...prev,
        [roomId]: { ...(prev[roomId] || {}), [userId]: userName }
      }));
    });

    newSocket.on('user-stop-typing', ({ userId }) => {
      const roomId = activeRoomIdRef.current;
      if (!roomId) return;
      setTypingUsers(prev => {
        const roomTyping = { ...(prev[roomId] || {}) };
        delete roomTyping[userId];
        return { ...prev, [roomId]: roomTyping };
      });
    });

    newSocket.on('user-read-messages', ({ userId, roomId, timestamp }) => {
      console.log(`[SOCKET_READ] Received user-read-messages from user ${userId} for room ${roomId} at ${new Date(timestamp).toISOString()}`);
      // 🔥 Atualizar o estado separado de readTimestamps que NÃO é sobrescrito pelo polling
      setOtherUsersReadTimestamps(prev => {
        const userTs = prev[userId] || {};
        const nextUserTs = { ...userTs, [roomId]: timestamp };
        console.log(`[SOCKET_READ] Updated otherUsersReadTimestamps for ${userId}:`, nextUserTs);
        return { ...prev, [userId]: nextUserTs };
      });
    });

    newSocket.on('profile-update', ({ userId, data }) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    });

    newSocket.on('message-created', (message) => {
      if (!message?.id || !message?.roomId) return;
      console.log(`[SOCKET_MSG] New message received in room ${message.roomId} from ${message.senderId}`);
      const isDm = message.roomId.startsWith('dm_');
      const group = isDm ? null : groupsRef.current.find(g => g.id === message.roomId);
      const canSeeRoom = isDm ? message.roomId.includes(user.id) : !!group;
      if (!canSeeRoom || processingDeletions.current.has(message.roomId) || deletedRoomIdsRef.current.includes(message.roomId)) return;

      setAllMessages(prev => prev.some(m => m.id === message.id) ? prev : [...prev, { ...message, isOptimistic: false }]);
      roomSortTimestamps.current[message.roomId] = Math.max(roomSortTimestamps.current[message.roomId] || 0, message.timestamp || Date.now());

      if (activeRoomIdRef.current === message.roomId && message.senderId !== user.id) {
        console.log(`[SOCKET_MSG] Active room matched - marking as read for room ${message.roomId}`);
        markRoomAsRead(message.roomId).catch(err => console.error(`[SOCKET_MSG] Error marking read:`, err));
      }
    });

    newSocket.on('message-deleted', ({ messageId, roomId }) => {
      if (!messageId) return;
      setAllMessages(prev => prev.filter(m => m.id !== messageId));
      if (roomId) {
        roomSortTimestamps.current[roomId] = roomSortTimestamps.current[roomId] || Date.now();
      }
    });

    newSocket.on('conversation-deleted', ({ roomId }) => {
      if (!roomId) return;
      setDeletedRoomIds(prev => (prev.includes(roomId) ? prev : [...prev, roomId]));
      processingDeletions.current.add(roomId);

      if (activeRoomIdRef.current === roomId) {
        setActiveRoomId(null);
        setShowChatInfo(false);
        setView('chat');
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Sync socket with active room
  useEffect(() => {
    if (socketRef.current && activeRoomId && user && view !== 'room') {
      socketRef.current.emit('join-room', { 
        roomId: activeRoomId, 
        uid: user.id, 
        name: currentUserProfile?.name || user.username 
      });
    }
  }, [activeRoomId]);

  // Listeners
    useEffect(() => {
    localStorage.setItem('hubify_muted_rooms', JSON.stringify(mutedRooms));
  }, [mutedRooms]);

  useEffect(() => {
    if (!user) return;

    const unsubUsers = listenToCollection(`artifacts/${appId}/public/data/users`, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMe = listenToCollection(`artifacts/${appId}/public/data/users/${user.id}`, (snap) => {
      const myDoc = snap.docs.find(d => d.id === user.id);
      if (myDoc) {
        const data = myDoc.data();
        if (data.activeDMs) {
          const parseResilient = (val) => {
            if (!val) return [];
            if (Array.isArray(val)) return val;
            if (typeof val !== 'string') return [];
            try {
              return JSON.parse(val);
            } catch (e) {
              if (val.startsWith('[') && val.endsWith(']')) {
                return val.slice(1, -1).split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
              }
              return [];
            }
          };
          setActiveDMs(parseResilient(data.activeDMs));
        }
      }
    });

    const unsubMessages = listenToCollection(`artifacts/${appId}/public/data/messages`, (snap) => {
      let fetchedMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // FILTRAR MENSAGENS: Apenas se for DM do usuário ou se o usuário estiver no grupo
      fetchedMsgs = fetchedMsgs.filter(m => {
        if (!m.roomId || processingDeletions.current.has(m.roomId) || deletedRoomIdsRef.current.includes(m.roomId)) return false;
        if (m.roomId.startsWith('dm_')) {
          return m.roomId.includes(user.id);
        }
        // Para grupos, precisamos verificar se o usuário é membro ou pendente
        // Usamos o ref para ter sempre o estado mais atual sem precisar reiniciar o listener
        const group = groupsRef.current.find(g => g.id === m.roomId);
        return !!group; // Se o grupo está no estado 'groups', o usuário tem acesso a ele
      });

      fetchedMsgs.sort((a, b) => a.timestamp - b.timestamp);

      // Som de notificação para novas mensagens de terceiros
      if (!isFirstLoadMessages.current && fetchedMsgs.length > lastMessagesCount.current) {
        const lastMsg = fetchedMsgs[fetchedMsgs.length - 1];
        if (lastMsg && lastMsg.senderId !== user?.id && lastMsg.roomId !== activeRoomIdRef.current) {
          playNotificationSound(lastMsg.roomId);
        }
      }

      setAllMessages(prev => {
        // Preservar mensagens otimistas que ainda não voltaram do servidor
        const optimistic = prev.filter(m => m.isOptimistic && !fetchedMsgs.find(f => f.id === m.id));
        const merged = [...fetchedMsgs, ...optimistic];
        merged.sort((a, b) => a.timestamp - b.timestamp);
        
        // Atualizar timestamps de ordenação apenas se houver novas mensagens reais (não deleção)
        merged.forEach(m => {
          if (!roomSortTimestamps.current[m.roomId] || m.timestamp > roomSortTimestamps.current[m.roomId]) {
            roomSortTimestamps.current[m.roomId] = m.timestamp;
          }
        });
        
        return merged;
      });

      // NOVO: Se houver sala ativa, atualizar readTimestamps para o momento atual
      // Isso garante que se novas mensagens chegarem na sala aberta, elas sejam marcadas como lidas
      if (activeRoomIdRef.current && user?.id) {
        markRoomAsRead(activeRoomIdRef.current).catch(() => {});
      }

      lastMessagesCount.current = fetchedMsgs.length;
      isFirstLoadMessages.current = false;
    });

    const unsubMeetings = listenToCollection(`artifacts/${appId}/public/data/meetings`, (snap) => {
      let fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMeetings(fetched.filter(m => m.creatorId === user.id || m.participants?.includes(user.id)));
    });

    const unsubGroups = listenToCollection(`artifacts/${appId}/public/data/groups`, (snap) => {
      let fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setGroups(fetched.filter(g => 
        (g.members?.includes(user.id) || g.pendingMembers?.includes(user.id)) && 
        !processingDeletions.current.has(g.id) &&
        !deletedRoomIdsRef.current.includes(g.id)
      ));
    });

    const unsubCalls = listenToCollection(`artifacts/${appId}/public/data/calls`, (snap) => {
      const allCallsRaw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const now = Date.now();
      
      // Filtrar apenas chamadas RECENTES (últimos 5 minutos) para evitar lixo de sessões anteriores
      const allCalls = allCallsRaw.filter(c => c.timestamp && (now - c.timestamp < 300000));
      
      setIncomingCall(prev => {
        if (prev && !allCalls.find(c => c.id === prev.id)) return null;
        return prev;
      });

      allCalls.forEach((callData) => {
        const isFromMe = callData.from === user.id;
        const isToMe = callData.to === user.id;

        // Recebendo chamada
        if (isToMe && callData.status === 'ringing') {
          if (!incomingCallRef.current || incomingCallRef.current.id !== callData.id) {
            console.log(`[Chamada] Convite recebido: ${callData.id} para sala ${callData.roomId}`);
            setIncomingCall(callData);
            if (callData.type) setCallType(callData.type);
          }
        }

        // Chamada aceita (ambos entram)
        if (callData.status === 'accepted' && callData.roomId && (isFromMe || isToMe)) {
          if (viewRef.current !== 'room') {
            console.log(`[Chamada] Conexão estabelecida na sala: ${callData.roomId}`);
            setActiveRoomId(callData.roomId);
            setIncomingCall(null);
            setIsOutgoingCall(false);
            setShowMediaSetup(false);
            setView('room');
          }
          
          if (isFromMe && !processedCallsRef.current.has(callData.id)) {
            processedCallsRef.current.add(callData.id);
            setTimeout(() => removeDocument(`artifacts/${appId}/public/data/calls/${callData.id}`).catch(() => { }), 2000);
          }
        }

        // Chamada recusada ou cancelada
        if ((callData.status === 'declined' || callData.status === 'cancelled') && (isFromMe || isToMe)) {
          if (isOutgoingCallRef.current || incomingCallRef.current || viewRef.current === 'room') {
            setIncomingCall(null);
            setIsOutgoingCall(false);
            setShowMediaSetup(false);
            if (isFromMe && callData.status === 'declined') {
              setSuccessMessage("Chamada recusada.");
              setShowSuccessModal(true);
            }
          }
          if (isFromMe && !processedCallsRef.current.has(callData.id)) {
            processedCallsRef.current.add(callData.id);
            setTimeout(() => removeDocument(`artifacts/${appId}/public/data/calls/${callData.id}`).catch(() => { }), 2000);
          }
        }
      });
    });

    const unsubInvites = listenToCollection(`artifacts/${appId}/public/data/invites`, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setGroupInvites(all);
    });

    return () => {
      unsubUsers(); unsubMe(); unsubMessages(); unsubMeetings(); unsubGroups(); unsubCalls(); unsubInvites();
    };
  }, [user]);

  // Ações
  const startConversation = async (contactId) => {
    const roomId = `dm_${[user.id, contactId].sort().join('_')}`;

    // Se a sala tinha sido marcada como deletada, removê-la para permitir recriação imediata
    setDeletedRoomIds(prev => prev.filter(id => id !== roomId));
    processingDeletions.current.delete(roomId);

    if (!activeDMs.includes(contactId)) {
      const newDMs = [...activeDMs, contactId];
      setActiveDMs(newDMs);
      await saveDocument(`artifacts/${appId}/public/data/users/${user.id}`, { activeDMs: JSON.stringify(newDMs) }, { merge: true });
    }

    setActiveRoomId(roomId);
    setView('chat');
  };

  const handleCallComplete = (settings) => {
    setMediaSettings(settings);
    setShowMediaSetup(false);
    if (incomingCall) {
      console.log(`[Chamada] Aceitando chamada ${incomingCall.id}. Sala: ${incomingCall.roomId}`);
      const rId = incomingCall.roomId;
      setActiveRoomId(rId);
      localStorage.setItem('hubify_active_room_id', rId);

      patchDocument(`artifacts/${appId}/public/data/calls/${incomingCall.id}`, {
        status: 'accepted',
        roomId: rId
      });
    }
    setView('room');
    setUserStatus('reuniao');
  };

  const handleCallCancel = async () => {
    if (isOutgoingCall) {
      // Encontrar todos os convites de chamada que enviamos que ainda estão tocando
      const { docs } = await fetchCollection(`artifacts/${appId}/public/data/calls`);
      const myCalls = docs.filter(d => d.data().from === user.id && d.data().status === 'ringing');
      for (const callDoc of myCalls) {
        await removeDocument(`artifacts/${appId}/public/data/calls/${callDoc.id}`);
      }
    }
    setIsOutgoingCall(false);
    setIncomingCall(null);
    setShowMediaSetup(false);
  };

  const handleCallDecline = async (call) => {
    await patchDocument(`artifacts/${appId}/public/data/calls/${call.id}`, { status: 'declined' });
    setTimeout(() => {
      removeDocument(`artifacts/${appId}/public/data/calls/${call.id}`);
    }, 1000);
    setIncomingCall(null);
  };





  const [processingInvites, setProcessingInvites] = useState(new Set());

  const handleAcceptGroup = async (groupId) => {
    if (processingInvites.has(groupId)) return;
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    setProcessingInvites(prev => new Set(prev).add(groupId));
    try {
      const newMembers = [...new Set([...(group.members || []), user.id])];
      const newPending = (group.pendingMembers || []).filter(id => id !== user.id);
      await saveDocument(`artifacts/${appId}/public/data/groups/${groupId}`, {
        ...group, members: newMembers, pendingMembers: newPending
      }, { merge: true });
      setActiveRoomId(groupId);
      setView('chat');
    } catch (error) { console.error(error); }
    finally { setProcessingInvites(prev => { const n = new Set(prev); n.delete(groupId); return n; }); }
  };

  const handleDeclineGroup = async (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const newPending = (group.pendingMembers || []).filter(id => id !== user.id);
    await saveDocument(`artifacts/${appId}/public/data/groups/${groupId}`, {
      ...group, pendingMembers: newPending
    }, { merge: true });
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await saveDocument(`artifacts/${appId}/public/data/groups/${groupId}`, {
      id: groupId,
      name: newGroupName,
      description: newGroupDesc || "Grupo de colaboração corporativa.",
      members: [user.id],
      createdBy: user.id,
      admins: [user.id],
      isGroup: true,
      avatar: newGroupName.substring(0, 2).toUpperCase(),
      avatarUrl: newGroupAvatar || null,
      createdAt: Date.now()
    });

    // Enviar convites para os membros selecionados e adicionar ao pendingMembers do grupo
    const group = (await fetchCollection(`artifacts/${appId}/public/data/groups`)).docs
      .find(d => d.id === groupId)?.data();

    if (group) {
      const newPending = [...new Set([...(group.pendingMembers || []), ...selectedGroupMembers])];
      await saveDocument(`artifacts/${appId}/public/data/groups/${groupId}`, { pendingMembers: newPending }, { merge: true });
    }

    for (const memberId of selectedGroupMembers) {
      const inviteId = `invite_${Date.now()}_${memberId}`;
      await saveDocument(`artifacts/${appId}/public/data/invites/${inviteId}`, {
        id: inviteId,
        groupId,
        groupName: newGroupName,
        fromId: user.id,
        fromName: currentUserProfile?.name || user.username || user.displayName,
        toId: memberId,
        timestamp: Date.now(),
        status: 'pending'
      });
    }

    setNewGroupName(''); setNewGroupDesc(''); setNewGroupAvatar(''); setSelectedGroupMembers([]); setShowGroupModal(false);
    setActiveRoomId(groupId); setView('chat');
  };

  const handleUpdateGroup = async (groupId, data) => {
    try {
      await saveDocument(`artifacts/${appId}/public/data/groups/${groupId}`, data, { merge: true });
      // Emitir via socket se necessário (o listener cuidará da atualização local)
    } catch (error) {
      console.error("Erro ao atualizar grupo:", error);
      throw error;
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!newMeetingTitle || !newMeetingDate) return;
    const meetingId = editingMeetingId || `mtg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const meetingData = {
      id: meetingId,
      title: newMeetingTitle,
      date: newMeetingDate,
      type: calendarItemType,
      creatorId: user.id,
      creatorName: currentUserProfile?.name,
      participants: calendarItemType === 'meeting' ? selectedInvitees : [],
      timestamp: Date.now()
    };

    if (editingMeetingId) {
      await saveDocument(`artifacts/${appId}/public/data/meetings/${editingMeetingId}`, meetingData, { merge: true });
    } else {
      await saveDocument(`artifacts/${appId}/public/data/meetings/${meetingId}`, meetingData);
    }
    setNewMeetingTitle(''); setNewMeetingDate(''); setSelectedInvitees([]); setEditingMeetingId(null);
    setShowCalendarModal(false);
  };

  const handleDeleteMeeting = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este item?")) {
      await removeDocument(`artifacts/${appId}/public/data/meetings/${id}`);
    }
  };

  const openEditMeeting = (meeting) => {
    setEditingMeetingId(meeting.id);
    setNewMeetingTitle(meeting.title);
    setNewMeetingDate(meeting.date);
    setCalendarItemType(meeting.type);
    setSelectedInvitees(meeting.participants || []);
    setShowCalendarModal(true);
  };

  const handleLeaveRoom = async () => {
    // Se for uma reunião agendada e eu sou o host, apagar o agendamento
    if (activeRoomId && activeRoomId.startsWith('meeting_')) {
      const mtgId = activeRoomId.replace('meeting_', '');
      const meeting = meetings.find(m => m.id === mtgId);
      if (meeting && meeting.creatorId === user.id) {
        await removeDocument(`artifacts/${appId}/public/data/meetings/${mtgId}`);
      }
      // Ao sair de uma reunião agendada, voltamos para a lista
      setActiveRoomId(null);
      setSelectedChatMobile(false);
    }
    
    setIsOutgoingCall(false);
    setOutgoingTarget(null);
    setIncomingCall(null);
    setShowMediaSetup(false);
    setActiveRoomId(null); // Limpar sempre ao sair
    setView('chat');
    setUserStatus('online');
    setSelectedChatMobile(false);
  };

  const toggleMuteRoom = (roomId) => {
    setMutedRooms(prev => 
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };

  const handleEditMessage = async (messageId, newText) => {
    const now = Date.now();
    
    // Atualização otimista local
    setAllMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, text: newText, isEdited: true, editedAt: now } : m
    ));

    try {
      await patchDocument(`artifacts/${appId}/public/data/messages/${messageId}`, { 
        text: newText,
        isEdited: true,
        editedAt: now
      });
    } catch (error) {
      console.error("Erro ao editar mensagem:", error);
      // Reverter em caso de erro (opcional, mas aqui vamos apenas logar)
    }
  };

  const [deletingMessages, setDeletingMessages] = useState(new Set());

  const handleDeleteMessage = async (messageId) => {
    if (deletingMessages.has(messageId)) return;
    if (window.confirm("Excluir esta mensagem?")) {
      const previousMessages = allMessages;
      setDeletingMessages(prev => new Set(prev).add(messageId));
      setAllMessages(prev => prev.filter(m => m.id !== messageId));
      try {
        await removeDocument(`artifacts/${appId}/public/data/messages/${messageId}`);
        if (socketRef.current) {
          socketRef.current.emit('message-deleted', {
            messageId,
            roomId: activeRoomIdRef.current,
            deletedBy: user?.id,
            deletedAt: Date.now()
          });
        }
      } catch (error) {
        console.error("Erro ao deletar mensagem:", error);
        setAllMessages(previousMessages);
      } finally {
        setDeletingMessages(prev => {
          const next = new Set(prev);
          next.delete(messageId);
          return next;
        });
      }
    }
  };



  const setTyping = (isTyping) => {
    if (!socketRef.current || !activeRoomId || !user) return;
    if (isTyping) {
      socketRef.current.emit('typing', { 
        roomId: activeRoomId, 
        userId: user.id, 
        userName: currentUserProfile?.name || user.username 
      });
    } else {
      socketRef.current.emit('stop-typing', { roomId: activeRoomId, userId: user.id });
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm("Tem certeza que deseja excluir esta conversa? Todas as mensagens serão perdidas.")) {
      // 1. Marcar como em processamento de deleção
      processingDeletions.current.add(roomId);
      setDeletedRoomIds(prev => (prev.includes(roomId) ? prev : [...prev, roomId]));

      // 2. Atualização Otimista Local (Imediata)
      const roomMsgs = allMessages.filter(m => m.roomId === roomId);
      setAllMessages(prev => prev.filter(m => m.roomId !== roomId));
      
      if (activeRoomId === roomId) {
        setActiveRoomId(null);
        setView('chat');
      }

      // 3. Processar remoção no Banco de Dados
      try {
        // Para DM: não apagar mensagens do banco. Apenas remover localmente e atualizar activeDMs do usuário.
        if (roomId.startsWith('dm_')) {
          const otherId = roomId.replace('dm_', '').split('_').find(id => id !== user.id);
          const newDMs = activeDMs.filter(id => id !== otherId);
          setActiveDMs(newDMs);
          await saveDocument(`artifacts/${appId}/public/data/users/${user.id}`, { activeDMs: JSON.stringify(newDMs) }, { merge: true });

          // Não emitir evento de deleção global — apenas esconder localmente
          processingDeletions.current.delete(roomId);
        } else {
          // Para grupos: verificar se usuário é admin (apagar para todos) ou apenas sair do grupo
          const group = groups.find(g => g.id === roomId);
          const isAdmin = group && ((group.admins || []).includes(user.id) || group.createdBy === user.id);
          if (group) {
            if (isAdmin) {
              // Confirmar exclusão global
              if (window.confirm('Você é administrador. Deseja excluir o grupo para todos os membros?')) {
                // Apagar todas as mensagens do grupo
                try {
                  const msgsToDelete = roomMsgs || [];
                  await Promise.all(msgsToDelete.map(msg => removeDocument(`artifacts/${appId}/public/data/messages/${msg.id}`)));
                } catch (e) {
                  console.error('Erro ao apagar mensagens do grupo:', e);
                }
                // Apagar o documento do grupo
                await removeDocument(`artifacts/${appId}/public/data/groups/${roomId}`);
                // Emitir evento para todos
                if (socketRef.current) {
                  socketRef.current.emit('conversation-deleted', { roomId, deletedBy: user.id, deletedAt: Date.now() });
                }
              } else {
                // Administrador cancelou — restaurar estado local
                setDeletedRoomIds(prev => prev.filter(id => id !== roomId));
              }
            } else {
              // Sair do grupo apenas para o usuário atual
              const newMembers = (group.members || []).filter(id => id !== user.id);
              await saveDocument(`artifacts/${appId}/public/data/groups/${roomId}`, { members: newMembers }, { merge: true });
              setGroups(prev => prev.filter(g => g.id !== roomId));
            }
          }

          processingDeletions.current.delete(roomId);
        }

      } catch (error) {
        console.error("Erro ao deletar conversa:", error);
        processingDeletions.current.delete(roomId);
        setDeletedRoomIds(prev => prev.filter(id => id !== roomId));
      }
      // Não limpar o activeRoomId aqui novamente — já foi limpo no início quando necessário.
      setShowChatInfo(false);
    }
  };

  const handleSendGroupInvite = async (groupId, targetUserId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    // Verificar se já é membro
    if (group.members.includes(targetUserId)) {
      alert("Este usuário já é membro do grupo.");
      return;
    }

    // Verificar se já tem convite pendente
    const alreadyInvited = groupInvites.find(i => i.groupId === groupId && i.toId === targetUserId && i.status === 'pending');
    if (alreadyInvited) {
      alert("Um convite já foi enviado para este usuário.");
      return;
    }

    // Adicionar ao pendingMembers do grupo para garantir visibilidade
    const updatedGroup = { ...group, pendingMembers: [...new Set([...(group.pendingMembers || []), targetUserId])] };
    await saveDocument(`artifacts/${appId}/public/data/groups/${groupId}`, { pendingMembers: updatedGroup.pendingMembers }, { merge: true });

    const inviteId = `invite_${Date.now()}_${targetUserId}`;
    await saveDocument(`artifacts/${appId}/public/data/invites/${inviteId}`, {
      id: inviteId,
      groupId,
      groupName: group.name,
      fromId: user.id,
      fromName: currentUserProfile?.name || user.displayName || user.username || "Usuário",
      toId: targetUserId,
      timestamp: Date.now(),
      status: 'pending'
    });
    alert("Convite enviado com sucesso!");
  };

  const handleAcceptGroupInvite = async (inviteId) => {
    const invite = groupInvites.find(i => i.id === inviteId);
    if (!invite) return;

    // Buscar o grupo - tentar no estado local primeiro, depois via API
    let group = groups.find(g => g.id === invite.groupId);

    if (!group) {
      try {
        const { docs } = await fetchCollection(`artifacts/${appId}/public/data/groups`);
        const found = docs.find(d => d.id === invite.groupId);
        if (found) group = { id: found.id, ...found.data() };
      } catch (e) { console.error("Erro ao buscar grupo:", e); }
    }

    if (group) {
      const newMembers = [...new Set([...(group.members || []), user.id])];
      const newPending = (group.pendingMembers || []).filter(id => id !== user.id);

      await saveDocument(`artifacts/${appId}/public/data/groups/${invite.groupId}`, {
        members: newMembers,
        pendingMembers: newPending
      }, { merge: true });

      setActiveRoomId(invite.groupId);
      setView('chat');
    }

    await removeDocument(`artifacts/${appId}/public/data/invites/${inviteId}`);
  };

  const handleDeclineGroupInvite = async (inviteId) => {
    await removeDocument(`artifacts/${appId}/public/data/invites/${inviteId}`);
  };

  const handleRemoveMember = async (groupId, memberId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group || group.createdBy !== user.id) return;

    if (window.confirm("Remover este membro do grupo?")) {
      const newMembers = group.members.filter(id => id !== memberId);
      await saveDocument(`artifacts/${appId}/public/data/groups/${groupId}`, { members: newMembers }, { merge: true });
    }
  };
  const chatRooms = useMemo(() => {
    if (!user) return [];

    // Pegar IDs de usuários com quem temos mensagens
    // 1. DMs: Extrair contatos ativos baseados em mensagens enviadas/recebidas
    const usersWithMessages = new Set();
    allMessages.forEach(m => {
      if (m.roomId && m.roomId.startsWith('dm_') && m.roomId.includes(user.id) && !processingDeletions.current.has(m.roomId) && !deletedRoomIds.includes(m.roomId)) {
        const parts = m.roomId.replace('dm_', '').split('_');
        const otherId = parts.find(id => id !== user.id);
        if (otherId) usersWithMessages.add(otherId);
      }
    });

    // Combinar com activeDMs (que são os iniciados manualmente), filtrando os que estão sendo deletados
    const filteredActiveDMs = activeDMs.filter(id => {
      const roomId = `dm_${[user.id, id].sort().join('_')}`;
      return !processingDeletions.current.has(roomId) && !deletedRoomIds.includes(roomId);
    });

    const allActiveContactIds = [...new Set([...filteredActiveDMs, ...Array.from(usersWithMessages)])];

    const rooms = [
      ...groups.filter(g => g.members?.includes(user.id) && !processingDeletions.current.has(g.id) && !deletedRoomIds.includes(g.id)).map(g => ({
        id: g.id, isGroup: true, name: g.name, avatar: g.name.substring(0, 2).toUpperCase(),
        avatarUrl: g.avatarUrl,
        members: g.members,
        pendingMembers: g.pendingMembers || [],
        createdBy: g.createdBy, admins: g.admins, description: g.description
      })),
      ...allActiveContactIds.map(id => {
        const u = users.find(x => x.id === id);
        return {
          id: `dm_${[user.id, id].sort().join('_')}`,
          isGroup: false,
          name: u?.name || 'Carregando...',
          avatarUrl: u?.avatarUrl,
          id_contact: id,
          status: u?.status,
          isOnline: u?.isOnline
        };
      })
    ];

    // Ordenar salas pela última mensagem (mais recente no topo)
    return rooms.map(room => {
      const roomMessages = allMessages.filter(m => m.roomId === room.id);
      const lastMsg = roomMessages[roomMessages.length - 1];
      
      // Usar o timestamp de ordenação persistente se disponível, senão o da última mensagem
      const sortTs = roomSortTimestamps.current[room.id] || (lastMsg ? lastMsg.timestamp : 0);

      const unreadCount = allMessages.filter(m => 
        m.roomId === room.id && 
        m.senderId !== user?.id && 
        m.timestamp > (readTimestamps[room.id] || 0)
      ).length;

      return {
        ...room,
        lastMessage: lastMsg,
        unreadCount,
        lastMessageTimestamp: sortTs
      };
    }).sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
  }, [groups, activeDMs, users, user, allMessages, deletedRoomIds]);

  const value = {
    socket,
    activeRoomId, setActiveRoomId,
    allMessages, users, groups, meetings, chatRooms, readTimestamps,
    otherUsersReadTimestamps, // 🔥 Novo: readTimestamps dos outros usuários (via Socket.IO)
    view, setView,
    incomingCall, setIncomingCall,
    isOutgoingCall, setIsOutgoingCall,
    outgoingTarget, setOutgoingTarget,
    callType, setCallType,
    showMediaSetup, setShowMediaSetup,
    mediaSettings, setMediaSettings,
    handleCallComplete, handleCallCancel, handleCallDecline,
    showInviteModal, setShowInviteModal,
    showDMModal, setShowDMModal,
    showGroupModal, setShowGroupModal,
    showCalendarModal, setShowCalendarModal,
    showContactDetailModal, setShowContactDetailModal,
    showEditProfileModal, setShowEditProfileModal,
    showUploadModal, setShowUploadModal,
    showDocumentModal, setShowDocumentModal,
    showDayEventsModal, setShowDayEventsModal,
    showAddMemberModal, setShowAddMemberModal,
    showSuccessModal, setShowSuccessModal,
    showProfileMenu, setShowProfileMenu,
    statusConfig,
    showSecurityModal, setShowSecurityModal,
    newGroupName, setNewGroupName,
    newGroupDesc, setNewGroupDesc,
    selectedGroupMembers, setSelectedGroupMembers,
    newMeetingTitle, setNewMeetingTitle,
    newMeetingDate, setNewMeetingDate,
    calendarItemType, setCalendarItemType,
    selectedInvitees, setSelectedInvitees,
    editingMeetingId, setEditingMeetingId,
    selectedCalendarDay, setSelectedCalendarDay,
    selectedContactDetail, setSelectedContactDetail,
    previewDocument, setPreviewDocument,
    pendingFile, setPendingFile,
    uploadComment, setUploadComment,
    successMessage, setSuccessMessage,
    startConversation, handleSendMessage,
    handleAcceptGroup, handleDeclineGroup, processingInvites,
    handleCreateGroup, handleCreateMeeting, handleDeleteMeeting, openEditMeeting,
    handleUpdateProfile, handleUpdateGroup, handleDeleteRoom, handleDeleteMessage, handleEditMessage,
    handleForwardMessages,
    roomWallpapers, handleUpdateRoomWallpaper,
    roomToDelete, setRoomToDelete,
    showChatInfo, setShowChatInfo,
    groupInvites, handleSendGroupInvite, handleAcceptGroupInvite, handleDeclineGroupInvite,
    handleRemoveMember,
    handleStartMeeting, handleStartAudioCall, handleInviteToCall,
    handleLeaveRoom,
    selectedChatMobile, setSelectedChatMobile,
    meetingNotifications, setMeetingNotifications,
    mutedRooms, toggleMuteRoom,
    typingUsers, setTyping, userStatus,
    newGroupAvatar, setNewGroupAvatar
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
