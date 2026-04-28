import React, { useState, useEffect } from 'react';
import Sidebar from '../features/chat/Sidebar';
import MessageList from '../features/chat/MessageList';
import MessageInput from '../features/chat/MessageInput';
import api from '../services/api';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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

    // Fetch Streams
    const fetchStreams = async () => {
      try {
        const response = await api.get('/streams');
        setStreams(response.data);
        if (response.data.length > 0) {
          setActiveStream(response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching streams', error);
      }
    };
    fetchStreams();

    // WebSocket connection
    const socket = new SockJS('http://localhost:8080/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        // console.log(str);
      },
      onConnect: () => {
        console.log('Connected to WebSocket');
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [user, navigate]);

  useEffect(() => {
    if (activeStream && stompClient) {
      // Fetch initial messages
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

      // Subscribe to active stream
      const subscription = stompClient.subscribe(`/topic/stream/${activeStream.id}`, (message) => {
        const receivedMessage = JSON.parse(message.body);
        if (!activeTopic || receivedMessage.topic.id === activeTopic.id) {
          setMessages((prev) => [...prev, receivedMessage]);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
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
      <Sidebar 
        streams={streams} 
        activeStream={activeStream} 
        setActiveStream={setActiveStream}
        activeTopic={activeTopic}
        setActiveTopic={setActiveTopic}
        user={user}
        logout={logout}
      />
      <div className="main-content">
        <div style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>
            {activeStream ? `# ${activeStream.name}` : 'Select a stream'} 
            {activeTopic && <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}> > {activeTopic.name}</span>}
          </h3>
        </div>
        <MessageList messages={messages} currentUser={user} />
        {activeTopic ? (
          <MessageInput onSendMessage={handleSendMessage} />
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Select a topic to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
