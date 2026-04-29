import React from 'react';

const ImageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
  </svg>
);

const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
  </svg>
);

const AttachmentMenu = ({ onSelectType, onClose }) => {
  return (
    <div className="sidebar-profile-menu" style={{ bottom: '100%', left: '0', marginBottom: '12px', width: '220px', padding: '0.75rem', zIndex: 100 }}>
      <div style={{ padding: '0.25rem 0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Anexar arquivo
      </div>
      
      <button
        className="sidebar-profile-menu-item"
        onClick={() => {
          onSelectType('image/*');
          onClose();
        }}
        style={{ gap: '1rem' }}
      >
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ImageIcon />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontWeight: 600 }}>Imagem</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fotos e ilustrações</span>
        </div>
      </button>

      <button
        className="sidebar-profile-menu-item"
        onClick={() => {
          onSelectType('.pdf,.doc,.docx,.txt,.xlsx,.ppt,.pptx');
          onClose();
        }}
        style={{ gap: '1rem', marginTop: '0.25rem' }}
      >
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileIcon />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontWeight: 600 }}>Documento</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Arquivos e PDFs</span>
        </div>
      </button>
    </div>
  );
};

export default AttachmentMenu;
