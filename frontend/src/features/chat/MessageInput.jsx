import React, { useState } from 'react';

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const MessageInput = ({ onSendMessage }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onSendMessage(content.trim());
      setContent('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input-bar">
      <form onSubmit={handleSubmit} style={{ margin: 0 }}>
        <div className="message-input-inner">
          <input
            className="message-input-field"
            type="text"
            placeholder="Enviar mensagem..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />

          {/* Emoji button */}
          <button
            type="button"
            className="message-input-icon-btn"
            title="Emoji"
            onClick={() => {}}
          >
            😊
          </button>

          {/* Attachment button */}
          <button
            type="button"
            className="message-input-icon-btn"
            title="Anexar arquivo"
            onClick={() => {}}
          >
            📎
          </button>

          {/* Send button */}
          <button
            type="submit"
            className="message-send-btn"
            title="Enviar"
            disabled={!content.trim()}
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
