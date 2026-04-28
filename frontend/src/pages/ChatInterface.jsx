import React, { useState, useEffect } from 'react';
import Sidebar from '../features/chat/Sidebar';
import MessageList from '../features/chat/MessageList';
import MessageInput from '../features/chat/MessageInput';
import api from '../services/api';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/* ── Mock participants (will show real data when backend provides it) ── */
const MOCK_PARTICIPANTS = [
  { id: 1, name: 'Lucas',   status: 'online'  },
  { id: 2, name: 'Ana',     status: 'online'  },
  { id: 3, name: 'Diego',   status: 'online'  },
  { id: 4, name: 'Mariana', status: 'away'    },
  { id: 5, name: 'Rafael',  status: 'offline' },
  { id: 6, name: 'Juliana', status: 'online'  },
  { id: 7, name: 'Gustavo', status: 'offline' },
  { id: 8, name: 'Camila',  status: 'offline' },
];

const STATUS_LABEL = { online: 'online', away: 'ausente', offline: 'offline' };

const avatarColors = [
  'linear-gradient(135deg,#5b4ff5,#a78bfa)',
  'linear-gradient(135deg,#0ea5e9,#38bdf8)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#f59e0b,#fbbf24)',
  'linear-gradient(135deg,#ec4899,#f472b6)',
  'linear-gradient(135deg,#ef4444,#f87171)',
];
const getAvatarColor = (name = '') => avatarColors[name.charCodeAt(0) % avatarColors.length];

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

/* ══════════════════════════════════════════════════════════════════════
   ChatInterface — 3-column layout
══════════════════════════════════════════════════════════════════════ */
const ChatInterface = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [streams, setStreams] = useState([]);
  const [activeStream, setActiveStream] = useState(null);
  const [activeTopic, setActiveTopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [stompClient, setStompClient] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchStreams = async () => {
      try {
        const response = await api.get('/streams');
        setStreams(response.data);
        if (response.data.length > 0) setActiveStream(response.data[0]);
      } catch (error) {
        console.error('Error fetching streams', error);
      }
    };
    fetchStreams();

    const socket = new SockJS('http://localhost:8080/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => console.log('Connected to WebSocket'),
    });
    client.activate();
    setStompClient(client);

    return () => { if (client) client.deactivate(); };
  }, [user, navigate]);

  useEffect(() => {
    if (activeStream && stompClient) {
      const fetchMessages = async () => {
        try {
          const url = activeTopic
            ? `/messages?streamId=${activeStream.id}&topicId=${activeTopic.id}`
            : `/messages?streamId=${activeStream.id}`;
          const response = await api.get(url);
          setMessages(response.data);
        } catch (error) {
          console.error('Error fetching messages', error);
        }
      };
      fetchMessages();

      const subscription = stompClient.subscribe(`/topic/stream/${activeStream.id}`, (message) => {
        const received = JSON.parse(message.body);
        if (!activeTopic || received.topic?.id === activeTopic.id) {
          setMessages((prev) => [...prev, received]);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [activeStream, activeTopic, stompClient]);

  const handleSendMessage = async (content) => {
    if (!activeStream || !activeTopic || !content.trim()) return;
    try {
      await api.post('/messages', {
        content,
        senderId: user.id,
        streamId: activeStream.id,
        topicId: activeTopic.id,
      });
    } catch (error) {
      console.error('Error sending message', error);
    }
  };

  return (
    <div className="app-container">
      {/* ── Column 1: Sidebar ─────────────────────── */}
      <Sidebar
        streams={streams}
        activeStream={activeStream}
        setActiveStream={setActiveStream}
        activeTopic={activeTopic}
        setActiveTopic={setActiveTopic}
        user={user}
        logout={logout}
      />

      {/* ── Column 2: Main Chat ───────────────────── */}
      <div className="main-content">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-header-title">
              <span className="chat-header-hash">#</span>
              {activeStream ? activeStream.name : 'Selecione um stream'}
              {activeTopic && (
                <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.9rem' }}>
                  &nbsp;›&nbsp;{activeTopic.name}
                </span>
              )}
            </div>
            {activeTopic && (
              <div className="chat-header-subtitle">
                Discussão sobre {activeTopic.name.toLowerCase()}
              </div>
            )}
          </div>
          <div className="chat-header-actions">
            <button className="chat-header-icon-btn" title="Buscar"><SearchIcon /></button>
            <button className="chat-header-icon-btn" title="Notificações"><BellIcon /></button>
            <button className="chat-header-icon-btn" title="Mais opções"><MoreIcon /></button>
          </div>
        </div>

        {/* Messages area */}
        <MessageList
          messages={messages}
          currentUser={user}
          activeTopic={activeTopic}
        />

        {/* Input */}
        {activeTopic ? (
          <MessageInput onSendMessage={handleSendMessage} />
        ) : (
          <div style={{
            padding: '1.5rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.88rem',
            borderTop: '1px solid var(--border-color)',
          }}>
            Selecione um tópico para começar a conversar
          </div>
        )}
      </div>

      {/* ── Column 3: Participants ────────────────── */}
      <div className="participants-panel">
        <div className="participants-title">
          Participantes <span>({MOCK_PARTICIPANTS.length})</span>
        </div>

        {MOCK_PARTICIPANTS.map((p) => (
          <div key={p.id} className="participant-item">
            <div
              className="participant-avatar"
              style={{ background: getAvatarColor(p.name) }}
            >
              {p.name.charAt(0)}
              <div className={`participant-status-dot ${p.status}`} />
            </div>
            <div className="participant-info">
              <div className="participant-name">{p.name}</div>
              <div className={`participant-status-label ${p.status}`}>
                {STATUS_LABEL[p.status]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatInterface;
