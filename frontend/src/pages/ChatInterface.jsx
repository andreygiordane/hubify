import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../features/chat/Sidebar';
import MessageList from '../features/chat/MessageList';
import MessageInput from '../features/chat/MessageInput';
import api from '../services/api';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CallMenu from '../features/chat/CallMenu';
import CallNotification from '../features/chat/CallNotification';
import PreCallScreen from '../features/chat/PreCallScreen';
import MeetingRoom from '../features/chat/MeetingRoom';
import InviteModal from '../features/chat/InviteModal';
import CreateGroupModal from '../features/chat/CreateGroupModal';

const STATUS_META = {
  ONLINE: { label: 'online', className: 'online' },
  OFFLINE: { label: 'offline', className: 'offline' },
  AWAY: { label: 'ausente', className: 'away' },
  BUSY: { label: 'ocupado', className: 'busy' },
};

const normalizeStatus = (status = 'OFFLINE') => status.toString().toUpperCase();

const avatarColors = [
  'linear-gradient(135deg,#5b4ff5,#a78bfa)',
  'linear-gradient(135deg,#0ea5e9,#38bdf8)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#f59e0b,#fbbf24)',
  'linear-gradient(135deg,#ec4899,#f472b6)',
  'linear-gradient(135deg,#ef4444,#f87171)',
];
const getAvatarColor = (name = '') => avatarColors[(name.charCodeAt(0) || 0) % avatarColors.length];
const getAvatarStyle = (participant) => {
  if (participant.avatarUrl) {
    return {
      backgroundImage: `url(${participant.avatarUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  return {
    background: getAvatarColor(participant.username),
  };
};

/* ── Header icon SVGs ─────────────────────────────────────────────── */
const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const BellIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const MoreIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

const PhoneIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

/* ══════════════════════════════════════════════════════════════════════
   ChatInterface — 3-column layout
══════════════════════════════════════════════════════════════════════ */
const ChatInterface = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [streams, setStreams] = useState([]);
  const [activeStream, setActiveStream] = useState(null);
  const [privateConversations, setPrivateConversations] = useState([]);
  const [activePrivateChat, setActivePrivateChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ username: '', avatarUrl: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [showCallMenu, setShowCallMenu] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [preCallState, setPreCallState] = useState(null); // { mode }
  const [activeMeeting, setActiveMeeting] = useState(null); // { mode, localStream, callId }
  const [callEvents, setCallEvents] = useState([]);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [selectedStreamProfile, setSelectedStreamProfile] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [activeInviteStream, setActiveInviteStream] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({}); // { stream_ID: count, conv_ID: count }
  const [previewFile, setPreviewFile] = useState(null);  // { url, name, type } — bound to active chat
  const activeChannelRef = useRef({ streamId: null, convId: null });
  const callPreviewRef = useRef(null);
  const audioRef = useRef(new Audio('/audio/toque.m4a'));

  const handleStatusChange = async (nextStatus) => {
    try {
      const response = await api.put('/users/me/status', { status: nextStatus });
      updateUser(response.data);
      setParticipants((currentParticipants) =>
        currentParticipants.map((participant) =>
          participant.id === response.data.id ? response.data : participant
        )
      );
    } catch (error) {
      console.error('Error updating status', error);
    }
  };

  // Persistir estado da reunião para suportar F5
  useEffect(() => {
    if (activeMeeting) {
      const { localStream, ...rest } = activeMeeting;
      localStorage.setItem('hubify_active_meeting', JSON.stringify({
        ...rest,
        streamId: activeMeeting.streamId,
        conversationId: activeMeeting.conversationId
      }));
    } else {
      localStorage.removeItem('hubify_active_meeting');
    }
  }, [activeMeeting]);

  // Restaurar reunião ao carregar a página
  useEffect(() => {
    const saved = localStorage.getItem('hubify_active_meeting');
    if (saved) {
      const data = JSON.parse(saved);
      // Define o estado de pré-chamada para que o usuário possa re-conectar mídia
      setPreCallState({ 
        mode: data.mode, 
        incomingCallId: data.callId,
        streamId: data.streamId,
        conversationId: data.conversationId,
        isRestoring: true
      });
    }
  }, []);

  // Prevenir fechamento acidental (F5 ou fechar aba)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (activeMeeting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeMeeting]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        setAllUsers(response.data);
      } catch (error) {
        console.error('Error fetching users', error);
      }
    };
    if (isConnected) fetchUsers();
  }, [isConnected]);

  const handleHeaderClick = () => {
    if (activePrivateChat) {
      const other = activePrivateChat.participants?.find(p => p.id !== user?.id);
      if (other) setSelectedUserProfile(other);
    } else if (activeStream) {
      setSelectedStreamProfile(activeStream);
    }
  };

  const handleDeleteCurrentChat = () => {
    setDeleteConfirmOpen(true);
    setHeaderMenuOpen(false);
  };

  const confirmDeleteChat = async () => {
    try {
      if (activePrivateChat) {
        await api.delete(`/conversations/${activePrivateChat.id}`);
        setPrivateConversations(prev => prev.filter(c => c.id !== activePrivateChat.id));
        setActivePrivateChat(null);
      } else if (activeStream) {
        if (activeStream.ownerId === user?.id) {
            await api.delete(`/streams/${activeStream.id}`);
        } else {
            await api.delete(`/streams/${activeStream.id}/members/${user.id}`);
        }
        setStreams(prev => prev.filter(s => s.id !== activeStream.id));
        setActiveStream(null);
      }
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Error deleting chat', error);
      alert('Erro ao excluir.');
    }
  };

  const handleKickMember = async (userId) => {
    if (!window.confirm('Tem certeza que deseja remover este membro?')) return;
    try {
      await api.delete(`/streams/${activeStream.id}/members/${userId}`);
      setParticipants(prev => prev.filter(p => p.id !== userId));
    } catch (error) {
      console.error('Error kicking member', error);
      alert('Erro ao remover membro.');
    }
  };

  const handleUpdateStream = async (e) => {
    e.preventDefault();
    try {
      const form = new FormData(e.target);
      const data = {
        description: form.get('description'),
        avatarUrl: form.get('avatarUrl'),
      };
      const res = await api.put(`/streams/${activeStream.id}`, data);
      setActiveStream(res.data);
      setSelectedStreamProfile(res.data);
      setStreams(prev => prev.map(s => s.id === res.data.id ? res.data : s));
      alert('Grupo atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating stream', error);
      alert('Erro ao atualizar grupo.');
    }
  };

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user, settingsOpen]);

  useEffect(() => {
    if (!user) return;

    const fetchStreams = async () => {
      try {
        const response = await api.get('/streams');
        setStreams(response.data);
        // Only auto-select if nothing is active
        if (response.data.length > 0 && !activeStream && !activePrivateChat) {
          setActiveStream(response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching streams', error);
      }
    };

    const fetchConversations = async () => {
      try {
        const response = await api.get('/conversations');
        setPrivateConversations(response.data);
        // If we have no streams but have private chats, auto-select the first private chat
        if (response.data.length > 0 && !activeStream && !activePrivateChat) {
          setActivePrivateChat(response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching conversations', error);
      }
    };

    fetchStreams();
    fetchConversations();

    const fetchParticipants = async () => {
      try {
        const response = await api.get('/users');
        setParticipants(response.data);
      } catch (error) {
        console.error('Error fetching participants', error);
      }
    };
    fetchParticipants();

    const fetchInvites = async () => {
      try {
        const response = await api.get('/invites/me');
        setPendingInvites(response.data);
      } catch (err) {
        console.error('Error fetching invites', err);
      }
    };
    fetchInvites();

    const socket = new SockJS('http://localhost:8080/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        console.log('Connected to WebSocket');
        setIsConnected(true);

        // Global User Subscription (Invites, Private Calls)
        client.subscribe(`/topic/user/${user.id}`, (message) => {
          const data = JSON.parse(message.body);
          if (data.type === 'STREAM_INVITE') {
            setPendingInvites(prev => {
              if (prev.some(inv => inv.id === data.inviteId)) return prev;
              return [...prev, {
                id: data.inviteId,
                stream: { id: data.streamId, name: data.streamName },
                inviter: { username: data.senderName }
              }];
            });
          } else if (data.eventType === 'INVITE') {
            // Check if it's NOT from the current user
            if (String(data.userId) !== String(user.id)) {
              setIncomingCall(data);
            }
          }
        });

        // Global Notifications for Messages (Unread Counts)
        client.subscribe(`/topic/user/${user.id}/notifications`, (message) => {
          const data = JSON.parse(message.body);
          
          const isFromCurrentActive = (activeChannelRef.current.streamId === data.streamId && data.streamId !== null) || 
                                      (activeChannelRef.current.convId === data.conversationId && data.conversationId !== null);
          
          if (!isFromCurrentActive) {
            const key = data.streamId ? `stream_${data.streamId}` : `conv_${data.conversationId}`;
            setUnreadCounts(prev => ({
              ...prev,
              [key]: (prev[key] || 0) + 1
            }));
          }

          // If it's a new conversation, add it to the list
          if (data.conversation) {
            setPrivateConversations(prev => {
              if (prev.some(c => c.id === data.conversation.id)) return prev;
              return [...prev, data.conversation];
            });
          }
        });

        // Listen for user status changes
        client.subscribe('/topic/users/status', (message) => {
          const updatedUser = JSON.parse(message.body);
          setParticipants(prev => prev.map(p => 
            p.id === updatedUser.id ? { ...p, status: updatedUser.status } : p
          ));
        });
      },
    });
    client.activate();
    setStompClient(client);

    return () => {
      setIsConnected(false);
      if (client) client.deactivate();
      audioRef.current.pause();
    };
  }, [user]);

  // Private Chat Subscription
  useEffect(() => {
    if (!activePrivateChat || !stompClient || !isConnected) return;

    const dest = `/topic/conversations/${activePrivateChat.id}`;
    const sub = stompClient.subscribe(dest, (msg) => {
      const data = JSON.parse(msg.body);
      if (data.eventType) {
        setCallEvents(prev => [...prev, data]);
        if (data.eventType === 'INVITE' && String(data.userId) !== String(user.id)) {
          setIncomingCall(data);
        }
      } else if (data.type === 'MESSAGE_EDITED') {
        setMessages(prev => prev.map(m =>
          String(m.id) === String(data.id) ? { ...m, content: data.content, edited: true } : m
        ));
      } else if (data.type === 'MESSAGE_DELETED') {
        setMessages(prev => prev.filter(m => String(m.id) !== String(data.id)));
      } else {
        // It's a chat message
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    });

    // Load message history
    api.get(`/messages?conversationId=${activePrivateChat.id}`)
      .then(r => setMessages(r.data))
      .catch(e => console.error('Error fetching private messages', e));

    return () => sub.unsubscribe();
  }, [activePrivateChat?.id, stompClient, isConnected, user.id]);

  // Stream Subscription
  useEffect(() => {
    if (!activeStream || !stompClient || !isConnected) return;

    const dest = `/topic/stream/${activeStream.id}`;
    const sub = stompClient.subscribe(dest, (msg) => {
      const data = JSON.parse(msg.body);
      
      if (data.eventType) {
        if (data.streamId === activeStream.id || !data.streamId) {
          setCallEvents(prev => [...prev, data]);
          if (data.eventType === 'INVITE' && String(data.userId) !== String(user.id)) {
            setIncomingCall(data);
          }
        }
      } else if (data.type === 'MESSAGE_EDITED') {
        setMessages(prev => prev.map(m =>
          String(m.id) === String(data.id) ? { ...m, content: data.content, edited: true } : m
        ));
      } else if (data.type === 'MESSAGE_DELETED') {
        setMessages(prev => prev.filter(m => String(m.id) !== String(data.id)));
      } else {
        // It's a chat message for this stream
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    });

    api.get(`/messages?streamId=${activeStream.id}`)
      .then(r => setMessages(r.data))
      .catch(e => console.error('Error fetching stream messages', e));

    return () => sub.unsubscribe();
  }, [activeStream?.id, stompClient, isConnected, user.id]);

  useEffect(() => {
    if (!user || !activeStream) {
      setViewers([]);
      return;
    }

    const loadViewers = async () => {
      try {
        const response = await api.get('/conversations/viewers', {
          params: {
            streamId: activeStream.id,
          },
        });
        setViewers(response.data || []);
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error('Error loading viewers', error);
        }
      }
    };

    const registerView = async () => {
      try {
        const response = await api.post('/conversations/views', null, {
          params: {
            streamId: activeStream.id,
          },
        });
        setViewers(response.data || []);
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error('Error registering conversation view', error);
        }
      }
    };

    loadViewers();
    registerView();
  }, [user, activeStream]);

  // Reset unread count when channel becomes active
  useEffect(() => {
    activeChannelRef.current = { streamId: activeStream?.id || null, convId: activePrivateChat?.id || null };
    
    if (activeStream) {
      setUnreadCounts(prev => {
        const next = { ...prev };
        delete next[`stream_${activeStream.id}`];
        return next;
      });
    }
    if (activePrivateChat) {
      setUnreadCounts(prev => {
        const next = { ...prev };
        delete next[`conv_${activePrivateChat.id}`];
        return next;
      });
    }
  }, [activeStream?.id, activePrivateChat?.id]);

  // Close file preview when the user switches channel
  useEffect(() => {
    setPreviewFile(null);
  }, [activeStream?.id, activePrivateChat?.id]);

  // Check if there is an active call we can return to
  const getActiveCallInCurrentChannel = () => {
    if (activeMeeting) return null;
    
    // Look for JOIN events without corresponding LEAVE in current channel history
    const channelEvents = callEvents.filter(e => {
      if (activeStream) return e.streamId === activeStream.id;
      if (activePrivateChat) return e.conversationId === activePrivateChat.id;
      return false;
    });

    if (channelEvents.length === 0) return null;

    // Check if anyone is still in
    const activeParticipants = participants.filter(p => {
      const pEvents = channelEvents.filter(e => String(e.userId) === String(p.id));
      if (pEvents.length === 0) return false;
      const latestJoin = [...pEvents].reverse().find(e => e.eventType === 'JOIN' || e.eventType === 'INVITE');
      const latestLeave = [...pEvents].reverse().find(e => e.eventType === 'LEAVE');
      return latestJoin && (!latestLeave || new Date(latestLeave.timestamp) < new Date(latestJoin.timestamp));
    });

    if (activeParticipants.length > 0) {
      // Find the first JOIN to get the callId and mode
      const firstJoin = [...channelEvents].reverse().find(e => e.eventType === 'JOIN' || e.eventType === 'INVITE');
      return firstJoin;
    }
    return null;
  };

  const callToReturn = getActiveCallInCurrentChannel();

  useEffect(() => {
    if (!callPreviewRef.current || !activeMeeting?.localStream) {
      return undefined;
    }

    callPreviewRef.current.srcObject = activeMeeting.localStream;
    return () => {
      if (callPreviewRef.current) {
        callPreviewRef.current.srcObject = null;
      }
    };
  }, [activeMeeting?.localStream]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeSettings = () => {
    setSettingsOpen(false);
    setSettingsError('');
    setSettingsMessage('');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleAvatarFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSavingProfile(true);
    setSettingsError('');
    setSettingsMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/uploads/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setProfileForm((currentForm) => ({ ...currentForm, avatarUrl: response.data.url }));
      setSettingsMessage('Foto enviada e salva como URL persistida.');
    } catch (error) {
      const message = error.response?.data?.message || 'Não foi possível enviar a foto.';
      setSettingsError(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSettingsError('');
    setSettingsMessage('');
    setSavingProfile(true);

    try {
      const response = await api.put('/users/me/profile', {
        username: profileForm.username,
        avatarUrl: profileForm.avatarUrl,
      });

      updateUser(response.data);
      setParticipants((currentParticipants) =>
        currentParticipants.map((participant) =>
          participant.id === response.data.id ? response.data : participant
        )
      );
      setProfileForm({
        username: response.data.username || '',
        avatarUrl: response.data.avatarUrl || '',
      });
      setSettingsMessage('Perfil atualizado com sucesso.');
    } catch (error) {
      const message = error.response?.data?.message || 'Não foi possível atualizar o perfil.';
      setSettingsError(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendMessage = async ({ content, attachmentUrl, attachmentName, attachmentType }) => {
    if (!activeStream && !activePrivateChat) return;

    const trimmedContent = content?.trim() || '';
    if (!trimmedContent && !attachmentUrl) return;

    try {
      await api.post('/messages', {
        content: trimmedContent,
        senderId: user.id,
        streamId: activeStream?.id,
        conversationId: activePrivateChat?.id,
        attachmentUrl,
        attachmentName,
        attachmentType,
      });
    } catch (error) {
      console.error('Error sending message', error);
    }
  };

  const handleStartCall = (mode) => {
    if (!activeStream && !activePrivateChat) return;
    localStorage.removeItem('hubify_active_meeting'); // Limpa estados antigos
    setPreCallState({ mode });
  };

  const handleJoinMeeting = async ({ audioEnabled, videoEnabled, stream }) => {
    // If it's an incoming call we're accepting, use its callId and IDs
    const callId = preCallState.incomingCallId || `call_${Date.now()}`;
    const targetStreamId = preCallState.streamId || activeStream?.id;
    const targetConvId = preCallState.conversationId || activePrivateChat?.id;

    // Broadcast JOIN or INVITE
    try {
      await api.post('/calls/events', {
        streamId: targetStreamId,
        conversationId: targetConvId,
        callId,
        eventType: 'JOIN',
        mode: preCallState.mode
      });
      
      // If it's a new call, also send the INVITE for notifications
      if (!preCallState.incomingCallId) {
        await api.post('/calls/events', {
          streamId: targetStreamId,
          conversationId: targetConvId,
          callId,
          eventType: 'INVITE',
          mode: preCallState.mode
        });
      }
    } catch (err) {
      console.error('Error broadcasting call event:', err);
    }

    setActiveMeeting({
      mode: preCallState.mode,
      localStream: stream,
      callId,
      audioEnabled,
      videoEnabled,
      streamId: targetStreamId,
      conversationId: targetConvId
    });
    setPreCallState(null);

    // For private chats, also notify the other user directly on their personal topic
    if (activePrivateChat) {
      const joinedParticipants = participants.filter(p => 
        callEvents.some(e => e.eventType === 'JOIN' && String(e.userId) === String(p.id))
      );
      const otherParticipant = activePrivateChat.participants?.find(p => p.id !== user.id);
      if (otherParticipant && stompClient?.connected) {
        // The backend CallController already broadcasts to /topic/conversations/{id}
        // This is just a safety measure — the backend handles routing
      }
    }
  };

  const handleAcceptCall = (call) => {
    setIncomingCall(null);
    setPreCallState({ 
      mode: call.mode, 
      incomingCallId: call.callId,
      streamId: call.streamId,
      conversationId: call.conversationId
    });
  };

  const handleLeaveMeeting = () => {
    if (activeMeeting) {
      handleMeetingEvent('LEAVE');
      if (activeMeeting.localStream) {
        activeMeeting.localStream.getTracks().forEach(t => t.stop());
      }
    }
    setActiveMeeting(null);
  };

  const handleMeetingEvent = async (type, data = {}) => {
    if (!activeMeeting) return;
    try {
      await api.post('/calls/events', {
        streamId: activeMeeting.streamId,
        conversationId: activeMeeting.conversationId,
        callId: activeMeeting.callId,
        eventType: type,
        ...data
      });
    } catch (err) {
      console.error('Error sending meeting event:', err);
    }
  };

  const handleDeleteStream = async (streamId) => {
    if (!window.confirm('Tem certeza que deseja excluir este grupo?')) return;
    try {
      await api.delete(`/streams/${streamId}`);
      setStreams(streams.filter(s => s.id !== streamId));
      if (activeStream?.id === streamId) setActiveStream(null);
    } catch (err) {
      alert(err.response?.data || 'Erro ao excluir grupo');
    }
  };


  const handleDeleteConversation = async (convId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conversa?')) return;
    try {
      await api.delete(`/conversations/${convId}`);
      setPrivateConversations(privateConversations.filter(c => c.id !== convId));
      if (activePrivateChat?.id === convId) setActivePrivateChat(null);
    } catch (err) {
      alert('Erro ao excluir conversa');
    }
  };

  const handleInviteMember = (stream) => {
    setActiveInviteStream(stream);
    setInviteModalOpen(true);
  };

  const onSendInvite = async (userId) => {
    try {
      await api.post(`/invites/stream/${activeInviteStream.id}/user/${userId}`);
      alert('Convite enviado!');
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao enviar convite');
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    try {
      await api.post(`/invites/${inviteId}/accept`);
      setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId));
      // Refresh streams to show the new one
      const res = await api.get('/streams');
      setStreams(res.data);
    } catch (err) {
      console.error('Error accepting invite', err);
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    try {
      await api.post(`/invites/${inviteId}/decline`);
      setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId));
    } catch (err) {
      console.error('Error declining invite', err);
    }
  };

  const handleStartPrivateChat = async (otherUser) => {
    if (otherUser.id === user.id) return;
    try {
      const response = await api.post(`/conversations/user/${otherUser.id}`);
      const newConv = response.data;
      if (!privateConversations.find(c => c.id === newConv.id)) {
        setPrivateConversations([...privateConversations, newConv]);
      }
      setActivePrivateChat(newConv);
      setActiveStream(null);
    } catch (err) {
      console.error('Error starting private chat', err);
    }
  };

  const handleSavePassword = async (event) => {
    event.preventDefault();
    setSettingsError('');
    setSettingsMessage('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSettingsError('A nova senha e a confirmação não coincidem.');
      return;
    }
    setSavingPassword(true);
    try {
      const response = await api.put('/users/me/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setSettingsMessage(response.data.message || 'Senha atualizada com sucesso.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const message = error.response?.data?.message || 'Não foi possível alterar a senha.';
      setSettingsError(message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="app-container">
      {/* ── Column 1: Sidebar ─────────────────────── */}
      <Sidebar
        streams={streams}
        activeStream={activeStream}
        setActiveStream={setActiveStream}
        privateConversations={privateConversations}
        activePrivateChat={activePrivateChat}
        setActivePrivateChat={setActivePrivateChat}
        user={user}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={handleLogout}
        onStatusChange={handleStatusChange}
        onDeleteStream={handleDeleteStream}
        onDeleteConversation={handleDeleteConversation}
        onInviteMember={handleInviteMember}
        pendingInvites={pendingInvites}
        onAcceptInvite={handleAcceptInvite}
        onDeclineInvite={handleDeclineInvite}
        onStreamCreated={(newStream) => {
          setStreams(prev => [...prev, newStream]);
          setActiveStream(newStream);
          setActivePrivateChat(null);
        }}
        onNewChat={() => setNewChatModalOpen(true)}
        onOpenCreateGroupModal={() => setShowCreateGroupModal(true)}
        unreadCounts={unreadCounts}
      />

      {/* ── Column 2: Main Chat ───────────────────── */}
      <div className="main-content glass-card">
        {!(activeStream || activePrivateChat) ? (
          <div className="empty-state-container">
            <img src="/image/logotransparente.png" alt="Hubify" className="empty-state-logo" />
            <p className="empty-state-text">Selecione um grupo ou conversa para começar</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-info clickable" onClick={handleHeaderClick}>
                <div className="chat-header-icon">
                  {activePrivateChat ? '@' : (activeStream ? '#' : '?')}
                </div>
                <div>
                  <div className="chat-header-title">
                    {activePrivateChat ? (
                      (() => {
                        const other = activePrivateChat.participants?.find(p => p.id !== user?.id);
                        return other?.displayName || other?.username || 'Chat';
                      })()
                    ) : (
                      activeStream ? activeStream.name : 'Selecione'
                    )}
                  </div>
                  <div className="chat-header-subtitle">
                    {activePrivateChat ? 'Conversa privada' : (activeStream ? `Grupo ${activeStream.name}` : 'Escolha um chat para começar')}
                  </div>
                </div>
              </div>
              <div className="chat-header-actions">
                <div style={{ position: 'relative' }}>
                  <button className="chat-header-icon-btn" title="Chamada de voz" onClick={() => setShowCallMenu(!showCallMenu)}>
                    <PhoneIcon />
                  </button>
                  {showCallMenu && (
                    <CallMenu 
                      onStartCall={handleStartCall} 
                      onClose={() => setShowCallMenu(false)} 
                    />
                  )}
                </div>
                <button className="chat-header-icon-btn" title="Buscar"><SearchIcon /></button>
                <button className="chat-header-icon-btn" title="Notificações"><BellIcon /></button>
                <div style={{ position: 'relative' }}>
                  <button className="chat-header-icon-btn" title="Mais opções" onClick={() => setHeaderMenuOpen(!headerMenuOpen)}><MoreIcon /></button>
                  {headerMenuOpen && (
                    <div className="sidebar-profile-menu header-dropdown" style={{ width: '200px' }}>
                      <button className="sidebar-profile-menu-item" onClick={handleHeaderClick} style={{ gap: '0.75rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <InfoIcon />
                        </div>
                        <span>Informações</span>
                      </button>
                      <button className="sidebar-profile-menu-item logout" onClick={handleDeleteCurrentChat} style={{ gap: '0.75rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255, 77, 77, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TrashIcon />
                        </div>
                        <span>{activeStream ? (activeStream.ownerId === user?.id ? 'Excluir Grupo' : 'Sair do Grupo') : 'Excluir Conversa'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {viewers.length > 0 && (
              <div className="chat-viewers-strip">
                <span className="chat-viewers-label">Visualizado por</span>
                <div className="chat-viewers-list">
                  {viewers.slice(0, 5).map((viewer) => (
                    <div key={viewer.id} className="chat-viewer-chip" title={viewer.username}>
                      {viewer.avatarUrl ? <img src={viewer.avatarUrl} alt={viewer.username} /> : viewer.username.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {viewers.length > 5 && <span className="chat-viewers-more">+{viewers.length - 5}</span>}
                </div>
              </div>
            )}

            {/* Messages area */}
            {callToReturn && (
              <div className="call-return-banner">
                <div className="call-return-info">
                  <span className="call-return-icon">📞</span>
                  <span>Uma chamada está acontecendo agora.</span>
                </div>
                <button className="btn-primary btn-sm" onClick={() => handleAcceptCall(callToReturn)}>
                  Participar da Chamada
                </button>
              </div>
            )}

            <MessageList
              messages={messages}
              currentUser={user}
              previewFile={previewFile}
              setPreviewFile={setPreviewFile}
            />

            <MessageInput onSendMessage={handleSendMessage} onStartCall={handleStartCall} />
          </>
        )}
      </div>

      {/* ── Column 3: Participants ────────────────── */}
      <div className="participants-panel glass-card">
        <div className="participants-title">
          <span style={{ color: 'var(--accent)' }}>👥</span>
          Participantes <span>({participants.length})</span>
        </div>

        <div className="participants-scroll" style={{ flex: 1, overflowY: 'auto' }}>
          {participants.map((p) => (
            <div key={p.id} className="participant-card clickable" onClick={() => setSelectedUserProfile(p)}>
              <div
                className="participant-avatar-large"
                style={getAvatarStyle(p)}
              >
                {!p.avatarUrl && p.username.charAt(0).toUpperCase()}
              </div>
              <div className="participant-info-group">
                <div className="participant-name-large">{p.username}</div>
                <div className="participant-email-small">{p.email}</div>
              </div>
              <div className={`participant-status-indicator ${normalizeStatus(p.status).toLowerCase()}`}>
                {(STATUS_META[normalizeStatus(p.status)] || STATUS_META.OFFLINE).label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {settingsOpen && (
        <div className="settings-overlay" onClick={closeSettings}>
          <div className="settings-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="settings-header">
              <div>
                <h2>Configurações do usuário</h2>
                <p>Atualize seu perfil, foto e senha.</p>
              </div>
              <button className="settings-close-btn" onClick={closeSettings}>×</button>
            </div>

            {settingsError && <div className="settings-alert error">{settingsError}</div>}
            {settingsMessage && <div className="settings-alert success">{settingsMessage}</div>}

            <form className="settings-section" onSubmit={handleSaveProfile}>
              <div className="settings-section-title">Perfil</div>
              <div className="settings-avatar-preview">
                {profileForm.avatarUrl ? (
                  <img src={profileForm.avatarUrl} alt="Avatar do usuário" />
                ) : (
                  <span>{profileForm.username?.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>
              <label className="settings-field">
                <span>Nome de usuário</span>
                <input
                  className="input-base"
                  value={profileForm.username}
                  onChange={(event) => setProfileForm((currentForm) => ({ ...currentForm, username: event.target.value }))}
                />
              </label>
              <label className="settings-field">
                <span>Foto do perfil</span>
                <input className="input-base" type="file" accept="image/*" onChange={handleAvatarFileChange} />
              </label>
              <button className="btn-primary" type="submit" disabled={savingProfile}>
                {savingProfile ? 'Salvando...' : 'Salvar perfil'}
              </button>
            </form>

            <form className="settings-section" onSubmit={handleSavePassword}>
              <div className="settings-section-title">Senha</div>
              <label className="settings-field">
                <span>Senha atual</span>
                <input
                  className="input-base"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((currentForm) => ({ ...currentForm, currentPassword: event.target.value }))}
                />
              </label>
              <label className="settings-field">
                <span>Nova senha</span>
                <input
                  className="input-base"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((currentForm) => ({ ...currentForm, newPassword: event.target.value }))}
                />
              </label>
              <label className="settings-field">
                <span>Confirmar nova senha</span>
                <input
                  className="input-base"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((currentForm) => ({ ...currentForm, confirmPassword: event.target.value }))}
                />
              </label>
              <button className="btn-secondary" type="submit" disabled={savingPassword}>
                {savingPassword ? 'Alterando...' : 'Alterar senha'}
              </button>
            </form>

            <div className="settings-footer">
              <button className="sidebar-logout-btn settings-logout-btn" onClick={handleLogout} type="button">
                Sair para login
              </button>
            </div>
          </div>
        </div>
      )}

      {incomingCall && (
        <CallNotification 
          call={incomingCall} 
          onAccept={() => handleAcceptCall(incomingCall)} 
          onDecline={() => setIncomingCall(null)} 
        />
      )}

      {preCallState && (
        <PreCallScreen 
          mode={preCallState.mode} 
          onJoin={handleJoinMeeting} 
          onCancel={() => setPreCallState(null)} 
        />
      )}

      {activeMeeting && (
        <MeetingRoom 
          user={user}
          roomName={activeStream?.name}
          localStream={activeMeeting.localStream}
          participants={participants.filter(p => 
            callEvents.some(e => ['JOIN', 'INVITE', 'OFFER', 'ANSWER'].includes(e.eventType) && String(e.userId) === String(p.id))
          )}
          messages={messages}
          onSendMessage={handleSendMessage}
          onSendEvent={handleMeetingEvent}
          onLeave={handleLeaveMeeting}
          onToggleAudio={(enabled) => handleMeetingEvent('AUDIO_TOGGLE', { message: enabled ? 'ON' : 'OFF' })}
          onToggleVideo={(enabled) => handleMeetingEvent('VIDEO_TOGGLE', { message: enabled ? 'ON' : 'OFF' })}
          onRaiseHand={(raised) => handleMeetingEvent('HAND_RAISE', { handRaised: raised })}
          onToggleScreenShare={(sharing) => handleMeetingEvent('SCREEN_SHARE', { screenSharing: sharing })}
          events={callEvents}
        />
      )}

      {selectedUserProfile && (
        <div className="modal-overlay" onClick={() => setSelectedUserProfile(null)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="profile-modal-close" onClick={() => setSelectedUserProfile(null)}>×</button>
            
            <div className="profile-modal-avatar" style={getAvatarStyle(selectedUserProfile)}>
              {!selectedUserProfile.avatarUrl && selectedUserProfile.username.charAt(0).toUpperCase()}
            </div>

            <h2 className="profile-modal-name">{selectedUserProfile.displayName || selectedUserProfile.username}</h2>
            <div className="profile-modal-handle">@{selectedUserProfile.username}</div>
            <div className="profile-modal-email">{selectedUserProfile.email}</div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn-primary" onClick={() => { handleStartPrivateChat(selectedUserProfile); setSelectedUserProfile(null); }}>
                Mandar Mensagem
              </button>
              <button className="btn-secondary" onClick={() => setSelectedUserProfile(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {inviteModalOpen && (
        <InviteModal 
          users={participants.filter(p => p.id !== user.id)}
          onClose={() => setInviteModalOpen(false)}
          onInvite={onSendInvite}
        />
      )}
      {selectedStreamProfile && (
        <div className="modal-overlay" onClick={() => setSelectedStreamProfile(null)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()} style={{ width: '450px', maxWidth: '90vw' }}>
            <button className="profile-modal-close" onClick={() => setSelectedStreamProfile(null)}>×</button>
            
            <div className="profile-modal-avatar" style={{ background: selectedStreamProfile.avatarUrl ? 'transparent' : 'var(--accent-gradient)', overflow: 'hidden' }}>
              {selectedStreamProfile.avatarUrl ? <img src={selectedStreamProfile.avatarUrl} alt="Grupo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '#'}
            </div>
            <h2 className="profile-modal-name">{selectedStreamProfile.name}</h2>
            <div className="profile-modal-handle">Grupo Público</div>

            {selectedStreamProfile.ownerId === user?.id ? (
              <form onSubmit={handleUpdateStream} className="settings-section" style={{ textAlign: 'left', marginTop: '1rem' }}>
                <div className="settings-section-title">Editar Informações</div>
                <label className="settings-field">
                  <span>Descrição do Grupo</span>
                  <input name="description" className="input-base" defaultValue={selectedStreamProfile.description || ''} placeholder="Ex: Grupo para projetos..." />
                </label>
                <label className="settings-field">
                  <span>URL da Foto (Avatar)</span>
                  <input name="avatarUrl" className="input-base" defaultValue={selectedStreamProfile.avatarUrl || ''} placeholder="https://..." />
                </label>
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>Salvar Alterações</button>
              </form>
            ) : (
              selectedStreamProfile.description && (
                <div style={{ padding: '1rem', background: 'var(--bg-hover)', borderRadius: '12px', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {selectedStreamProfile.description}
                </div>
              )
            )}

            <div className="settings-section" style={{ textAlign: 'left', marginTop: '1.5rem' }}>
              <div className="settings-section-title">Membros do Grupo ({participants.length})</div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {participants.map(p => (
                  <div key={p.id} className="sidebar-nav-item" style={{ background: 'var(--bg-hover)', padding: '0.5rem', cursor: 'default' }}>
                    <div className="sidebar-nav-avatar" style={{ width: '32px', height: '32px' }}>
                      {p.avatarUrl ? <img src={p.avatarUrl} alt={p.username} /> : p.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="sidebar-nav-info" style={{ flex: 1 }}>
                      <div className="nav-item-text" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {p.username}
                        {selectedStreamProfile.ownerId === p.id && (
                          <span style={{ background: 'var(--accent)', color: '#fff', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>ADMIN</span>
                        )}
                      </div>
                    </div>
                    {selectedStreamProfile.ownerId === user?.id && p.id !== user?.id && (
                      <button onClick={() => handleKickMember(p.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer', padding: '0.25rem 0.5rem' }}>
                        Remover
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}


      {deleteConfirmOpen && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255, 77, 77, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <TrashIcon />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {activeStream ? (activeStream.ownerId === user?.id ? 'Excluir Grupo?' : 'Sair do Grupo?') : 'Excluir Conversa?'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              {activeStream 
                ? (activeStream.ownerId === user?.id 
                    ? 'Tem certeza de que deseja apagar permanentemente este grupo? Todos os membros perderão o acesso.' 
                    : 'Tem certeza de que deseja sair deste grupo? Você não terá mais acesso às mensagens.') 
                : 'Tem certeza de que deseja apagar permanentemente esta conversa? Esta ação não pode ser desfeita.'}
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirmOpen(false)}>
                Não, cancelar
              </button>
              <button className="btn-primary" style={{ flex: 1, background: 'var(--danger)' }} onClick={confirmDeleteChat}>
                {activeStream && activeStream.ownerId !== user?.id ? 'Sim, sair' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {newChatModalOpen && (
        <InviteModal 
          users={allUsers.filter(u => u.id !== user.id)}
          onClose={() => setNewChatModalOpen(false)}
          onInvite={(userId) => {
            const existing = privateConversations.find(c => c.participants.some(p => p.id === userId));
            if (existing) {
              setActivePrivateChat(existing);
              setActiveStream(null);
            } else {
              handleStartPrivateChat({ id: userId });
            }
            setNewChatModalOpen(false);
          }}
        />
      )}

      {showCreateGroupModal && (
        <CreateGroupModal 
          onClose={() => setShowCreateGroupModal(false)}
          currentUser={user}
          allUsers={allUsers}
          onStreamCreated={(newStream) => {
            setStreams(prev => [...prev, newStream]);
            setActiveStream(newStream);
            setActivePrivateChat(null);
            setShowCreateGroupModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ChatInterface;
