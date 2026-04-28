import React, { useState } from 'react';

const MessageInput = ({ onSendMessage }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onSendMessage(content);
      setContent('');
    }
  };

  return (
    <div style={{ padding: '1rem 2rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem' }}>
        <input
          type="text"
          className="input-base"
          placeholder="Type a message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ padding: '1rem', borderRadius: '24px' }}
        />
        <button type="submit" className="btn-primary" style={{ borderRadius: '24px', padding: '0 1.5rem' }}>
          Send
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
