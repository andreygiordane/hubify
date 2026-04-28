import React, { useRef, useEffect } from 'react';

const MessageList = ({ messages, currentUser }) => {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {messages.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
          No messages in this topic yet. Start the conversation!
        </div>
      ) : (
        messages.map((msg, index) => {
          const isOwn = msg.sender.id === currentUser.id;
          return (
            <div key={msg.id || index} style={{ 
              display: 'flex', 
              flexDirection: isOwn ? 'row-reverse' : 'row',
              gap: '1rem',
              alignItems: 'flex-start'
            }}>
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '8px', 
                backgroundColor: isOwn ? 'var(--accent-color)' : 'var(--bg-tertiary)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {msg.sender.username.charAt(0).toUpperCase()}
              </div>
              <div style={{ maxWidth: '70%' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'baseline', 
                  gap: '0.5rem', 
                  flexDirection: isOwn ? 'row-reverse' : 'row',
                  marginBottom: '0.25rem'
                }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{msg.sender.username}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                  </span>
                </div>
                <div style={{ 
                  padding: '0.75rem 1rem', 
                  borderRadius: '12px', 
                  backgroundColor: isOwn ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                  color: isOwn ? 'white' : 'var(--text-primary)',
                  borderTopRightRadius: isOwn ? '2px' : '12px',
                  borderTopLeftRadius: !isOwn ? '2px' : '12px',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={endRef} />
    </div>
  );
};

export default MessageList;
