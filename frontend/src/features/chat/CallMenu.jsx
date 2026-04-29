import React from 'react';

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const VideoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
  </svg>
);

const CallMenu = ({ onStartCall, onClose }) => {
  return (
    <div className="sidebar-profile-menu header-dropdown" style={{ width: '240px' }}>
      <div style={{ padding: '0.25rem 0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Iniciar Chamada
      </div>
      <button
        className="sidebar-profile-menu-item"
        onClick={() => {
          onStartCall('audio');
          onClose();
        }}
        style={{ gap: '1rem' }}
      >
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--online)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PhoneIcon />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontWeight: 600 }}>Áudio</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Chamada de voz</span>
        </div>
      </button>
      
      <button
        className="sidebar-profile-menu-item"
        onClick={() => {
          onStartCall('video');
          onClose();
        }}
        style={{ gap: '1rem', marginTop: '0.25rem' }}
      >
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(91, 79, 245, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <VideoIcon />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontWeight: 600 }}>Vídeo</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Chamada com imagem</span>
        </div>
      </button>
    </div>
  );
};

export default CallMenu;
