import React, { useRef, useEffect } from 'react';

/* Gera uma cor de avatar determinística baseada no nome */
const avatarColors = [
  'linear-gradient(135deg,#5b4ff5,#a78bfa)',
  'linear-gradient(135deg,#0ea5e9,#38bdf8)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#f59e0b,#fbbf24)',
  'linear-gradient(135deg,#ec4899,#f472b6)',
  'linear-gradient(135deg,#ef4444,#f87171)',
];
const getAvatarColor = (name = '') => avatarColors[name.charCodeAt(0) % avatarColors.length];

const MessageList = ({ messages, currentUser, activeTopic }) => {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      {/* Topic Card */}
      {activeTopic && (
        <div className="topic-card animate-fade-in">
          <div className="topic-card-icon">💬</div>
          <div className="topic-card-info">
            <div className="topic-card-name">Tópico: {activeTopic.name}</div>
            <div className="topic-card-desc">Discussão sobre {activeTopic.name.toLowerCase()}</div>
          </div>
          <button className="topic-card-menu" title="Opções">⋮</button>
        </div>
      )}

      {/* Messages */}
      <div className="message-list">
        {messages.length === 0 ? (
          <div className="message-empty">
            <div className="message-empty-icon">💬</div>
            <span>Nenhuma mensagem ainda. Inicie a conversa!</span>
          </div>
        ) : (
          messages.map((msg, index) => {
            const senderName = msg.sender?.username ?? 'Usuário';
            const initial   = senderName.charAt(0).toUpperCase();
            const timeLabel = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'agora';

            return (
              <div key={msg.id ?? index} className="message-group">
                {/* Avatar */}
                <div
                  className="msg-avatar"
                  style={{ background: getAvatarColor(senderName) }}
                >
                  {initial}
                </div>

                <div className="msg-body">
                  {/* Sender + Time */}
                  <div className="msg-meta">
                    <span className="msg-sender">{senderName}</span>
                    <span className="msg-time">{timeLabel}</span>
                  </div>

                  {/* Text */}
                  <div className="msg-text">{msg.content}</div>

                  {/* Simulated attachment for PDF messages */}
                  {msg.content?.toLowerCase().includes('.pdf') && (
                    <div className="msg-attachment">
                      <div className="msg-attachment-icon">📄</div>
                      <div>
                        <div className="msg-attachment-name">{msg.content.trim()}</div>
                        <div className="msg-attachment-size">Arquivo PDF</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </>
  );
};

export default MessageList;
