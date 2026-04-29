import React, { useState } from 'react';

const InviteModal = ({ users, onClose, onInvite }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <div>
            <h2>Convidar Membros</h2>
            <p>Selecione quem você deseja convidar para este grupo.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <input 
            type="text" 
            className="input-base" 
            placeholder="Buscar por nome ou email..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="invite-list" style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              Nenhum usuário encontrado.
            </div>
          ) : (
            filteredUsers.map(user => (
              <div key={user.id} className="sidebar-nav-item" style={{ cursor: 'default', background: 'var(--bg-hover)' }}>
                <div className="sidebar-nav-avatar">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="sidebar-nav-info">
                  <div className="nav-item-text">{user.username}</div>
                  <div className="nav-item-subtext">{user.email}</div>
                </div>
                <button 
                  className="btn-primary" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', height: '32px' }}
                  onClick={() => onInvite(user.id)}
                >
                  Convidar
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
