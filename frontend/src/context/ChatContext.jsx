
import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  getDatabase, getCollectionPath, getDocumentPath, listenToCollection,
  fetchCollection, patchDocument, saveDocument, removeDocument, createDocument
} from '../api-client';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';

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
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      throw error;
    }
  };

  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [activeDMs, setActiveDMs] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // { roomId: { userId: userName } }
  const socketRef = useRef(null);
  const [readTimestamps, setReadTimestamps] = useState({});
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
  useEffect(() => {
    localStorage.setItem('hubify_active_view', view);
  }, [view]);

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
        avatarUrl: contact?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"
      });

      const callId = `call_${Date.now()}`;
      await createDocument(`artifacts/${appId}/public/data/calls`, {
        id: callId,
        from: user.id,
        fromName: currentUserProfile?.name || user.username,
        fromAvatar: currentUserProfile?.avatarUrl,
        to: otherId,
        type: 'video',
        status: 'ringing',
        roomId: rId,
        timestamp: Date.now()
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
        avatarUrl: contact?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"
      });

      const callId = `call_${Date.now()}`;
      await createDocument(`artifacts/${appId}/public/data/calls`, {
        id: callId,
        from: user.id,
        fromName: currentUserProfile?.name || user.username,
        fromAvatar: currentUserProfile?.avatarUrl,
        to: otherId,
        type: 'audio',
        status: 'ringing',
        roomId: rId,
        timestamp: Date.now()
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
      localStorage.setItem('hubify_active_room_id', activeRoomId);
      const now = Date.now();
      setReadTimestamps(prev => {
        const next = { ...prev, [activeRoomId]: now };
        handleUpdateProfile({ readTimestamps: JSON.stringify(next) }).catch(() => {});
        
        // Emitir via socket para atualização em tempo real para o remetente
        if (socketRef.current) {
          socketRef.current.emit('messages-read', {
            roomId: activeRoomId,
            userId: user.id,
            timestamp: now
          });
        }
        
        return next;
      });
    } else {
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

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Global Socket Connected');
      // If there's an active room, join it immediately
      if (activeRoomIdRef.current) {
        socket.emit('join-room', { 
          roomId: activeRoomIdRef.current, 
          uid: user.id, 
          name: currentUserProfile?.name || user.username 
        });
      }
    });

    socket.on('user-typing', ({ userId, userName }) => {
      const roomId = activeRoomIdRef.current;
      if (!roomId) return;
      setTypingUsers(prev => ({
        ...prev,
        [roomId]: { ...(prev[roomId] || {}), [userId]: userName }
      }));
    });

    socket.on('user-stop-typing', ({ userId }) => {
      const roomId = activeRoomIdRef.current;
      if (!roomId) return;
      setTypingUsers(prev => {
        const roomTyping = { ...(prev[roomId] || {}) };
        delete roomTyping[userId];
        return { ...prev, [roomId]: roomTyping };
      });
    });

    socket.on('user-read-messages', ({ userId, roomId, timestamp }) => {
      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          let currentTimestamps = {};
          try {
            currentTimestamps = u.readTimestamps ? JSON.parse(u.readTimestamps) : {};
          } catch (e) {}
          const nextTimestamps = { ...currentTimestamps, [roomId]: timestamp };
          return { ...u, readTimestamps: JSON.stringify(nextTimestamps) };
        }
        return u;
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Sync socket with active room
  useEffect(() => {
    if (socketRef.current && activeRoomId && user) {
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
        return merged;
      });

      // NOVO: Se houver sala ativa, atualizar readTimestamps para o momento atual
      // Isso garante que se novas mensagens chegarem na sala aberta, elas sejam marcadas como lidas
      if (activeRoomIdRef.current && user?.id) {
        const now = Date.now();
        setReadTimestamps(prev => {
          const next = { ...prev, [activeRoomIdRef.current]: now };
          // Apenas atualizar no banco se houver mudança significativa
          handleUpdateProfile({ readTimestamps: JSON.stringify(next) }).catch(() => {});

          // Emitir via socket para atualização em tempo real
          if (socketRef.current) {
            socketRef.current.emit('messages-read', {
              roomId: activeRoomIdRef.current,
              userId: user.id,
              timestamp: now
            });
          }

          return next;
        });
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
      setGroups(fetched.filter(g => g.members?.includes(user.id) || g.pendingMembers?.includes(user.id)));
    });

    const processedCalls = new Set();
    const unsubCalls = listenToCollection(`artifacts/${appId}/public/data/calls`, (snap) => {
      const allCalls = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Verificar se a chamada recebida atual ainda existe no snapshot
      // Se não existir, significa que foi cancelada/removida pelo originador
      setIncomingCall(prev => {
        if (prev && !allCalls.find(c => c.id === prev.id)) {
          return null;
        }
        return prev;
      });

      allCalls.forEach((callData) => {
        // Recebendo chamada
        if ((callData.to === user.id) && callData.status === 'ringing') {
          setIncomingCall(callData);
          if (callData.type) {
            setCallType(callData.type);
          }
        }

        // Chamada aceita (ambos entram)
        if (callData.status === 'accepted' && callData.roomId && (callData.from === user.id || callData.to === user.id)) {
          setActiveRoomId(callData.roomId);
          setIncomingCall(null);
          setIsOutgoingCall(false);
          setShowMediaSetup(false);
          setView('room');
          // Apenas quem ligou limpa o documento (com atraso) para garantir que o outro receba o evento
          if (callData.from === user.id && !processedCalls.has(callData.id)) {
            processedCalls.add(callData.id);
            setTimeout(() => removeDocument(`artifacts/${appId}/public/data/calls/${callData.id}`).catch(() => { }), 2000);
          }
        }

        // Chamada recusada ou cancelada (pelo status explícito)
        if ((callData.status === 'declined' || callData.status === 'cancelled') && (callData.from === user.id || callData.to === user.id)) {
          setIncomingCall(null);
          setIsOutgoingCall(false);
          setShowMediaSetup(false);
          if (callData.from === user.id && callData.status === 'declined') {
            setSuccessMessage("Chamada recusada.");
            setShowSuccessModal(true);
          }
          if (callData.from === user.id && !processedCalls.has(callData.id)) {
            processedCalls.add(callData.id);
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
    if (!activeDMs.includes(contactId)) {
      const newDMs = [...activeDMs, contactId];
      setActiveDMs(newDMs);
      await saveDocument(`artifacts/${appId}/public/data/users/${user.id}`, { activeDMs: JSON.stringify(newDMs) }, { merge: true });
    }
    setActiveRoomId(`dm_${[user.id, contactId].sort().join('_')}`);
    setView('chat');
  };

  const handleCallComplete = (settings) => {
    setMediaSettings(settings);
    setShowMediaSetup(false);
    if (incomingCall) {
      // CRITICAL: Definir o roomId ativo IMEDIATAMENTE ao aceitar
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

    setNewGroupName(''); setNewGroupDesc(''); setSelectedGroupMembers([]); setShowGroupModal(false);
    setActiveRoomId(groupId); setView('chat');
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
    setView('chat');
    setUserStatus('online');
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

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm("Excluir esta mensagem?")) {
      await removeDocument(`artifacts/${appId}/public/data/messages/${messageId}`);
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
      // Remover mensagens do banco
      const roomMsgs = allMessages.filter(m => m.roomId === roomId);
      for (const msg of roomMsgs) {
        await removeDocument(`artifacts/${appId}/public/data/messages/${msg.id}`);
      }

      // Se for DM, remover da lista de DMs ativos
      if (roomId.startsWith('dm_')) {
        const otherId = roomId.replace('dm_', '').split('_').find(id => id !== user.id);
        const newDMs = activeDMs.filter(id => id !== otherId);
        setActiveDMs(newDMs);
        await saveDocument(`artifacts/${appId}/public/data/users/${user.id}`, { activeDMs: JSON.stringify(newDMs) }, { merge: true });
      } else {
        // Se for grupo, remover o usuário do grupo
        const group = groups.find(g => g.id === roomId);
        if (group) {
          const newMembers = group.members.filter(id => id !== user.id);
          if (newMembers.length === 0) {
            await removeDocument(`artifacts/${appId}/public/data/groups/${roomId}`);
          } else {
            await saveDocument(`artifacts/${appId}/public/data/groups/${roomId}`, { members: newMembers }, { merge: true });
          }
        }
      }
      setActiveRoomId(null);
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
    const usersWithMessages = new Set();
    allMessages.forEach(m => {
      if (m?.roomId?.startsWith('dm_')) {
        const parts = m.roomId.replace('dm_', '').split('_');
        if (parts.includes(user.id)) {
          const otherId = parts.find(id => id !== user.id);
          if (otherId) usersWithMessages.add(otherId);
        }
      }
    });

    // Combinar com activeDMs (que são os iniciados manualmente)
    const allActiveContactIds = [...new Set([...activeDMs, ...Array.from(usersWithMessages)])];

    return [
      ...groups.filter(g => g.members?.includes(user.id)).map(g => ({
        id: g.id, isGroup: true, name: g.name, avatar: g.name.substring(0, 2).toUpperCase(),
        members: g.members, createdBy: g.createdBy, admins: g.admins, description: g.description
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
  }, [groups, activeDMs, users, user, allMessages]);

  const value = {
    activeRoomId, setActiveRoomId,
    allMessages, users, groups, meetings, chatRooms, readTimestamps,
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
    handleUpdateProfile, handleDeleteRoom, handleDeleteMessage, handleEditMessage,
    handleForwardMessages,
    showChatInfo, setShowChatInfo,
    groupInvites, handleSendGroupInvite, handleAcceptGroupInvite, handleDeclineGroupInvite,
    handleRemoveMember,
    handleStartMeeting, handleStartAudioCall, handleInviteToCall,
    handleLeaveRoom,
    selectedChatMobile, setSelectedChatMobile,
    meetingNotifications, setMeetingNotifications,
    mutedRooms, toggleMuteRoom,
    typingUsers, setTyping, userStatus
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
