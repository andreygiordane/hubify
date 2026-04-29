import React, { useEffect, useRef } from 'react';

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const CallNotification = ({ call, onAccept, onDecline }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    const playSound = async () => {
      try {
        if (audioRef.current) {
          audioRef.current.loop = true;
          await audioRef.current.play();
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error playing notification sound:', err);
        }
      }
    };
    playSound();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const senderName = call.displayName || call.username || 'Usuário';
  const avatarText = senderName.charAt(0).toUpperCase();

  return (
    <div className="call-notification-overlay">
      <audio ref={audioRef} src="/audio/toque.m4a" />
      <div className="call-notification">
        <div className="call-notification-avatar">
          {call.avatarUrl ? (
            <img src={call.avatarUrl} alt={senderName} />
          ) : (
            avatarText
          )}
        </div>
        <div className="call-notification-info">
          <div className="call-notification-title">{senderName}</div>
          <div className="call-notification-subtitle">
            {call.username ? `@${call.username} está chamando...` : 'Chamada recebida...'}
          </div>
          <div className="call-notification-subtitle" style={{ fontSize: '0.75rem', marginTop: '2px', opacity: 0.8 }}>
            Chamada de {call.mode === 'video' ? 'vídeo' : 'áudio'}
          </div>
        </div>
        <div className="call-notification-actions">
          <button className="call-btn-decline" onClick={onDecline} title="Recusar">
            <XIcon />
          </button>
          <button className="call-btn-accept" onClick={onAccept} title="Aceitar">
            <PhoneIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallNotification;
