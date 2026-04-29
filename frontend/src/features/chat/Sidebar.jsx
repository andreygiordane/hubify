import React, { useState } from 'react';
import api from '../../services/api';

const STATUS_META = {
  ONLINE: { label: 'online', className: 'online' },
  OFFLINE: { label: 'offline', className: 'offline' },
  AWAY: { label: 'ausente', className: 'away' },
  BUSY: { label: 'ocupado', className: 'busy' },
};

const normalizeStatus = (status = 'OFFLINE') => status.toString().toUpperCase();
const statusOptions = ['ONLINE', 'OFFLINE', 'AWAY', 'BUSY'];

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const UserPlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="17" y1="11" x2="23" y2="11"></line>
  </svg>
);

const MessageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const Sidebar = ({ 
  streams, 
  activeStream, 
  setActiveStream, 
  privateConversations = [], 
  activePrivateChat,
  setActivePrivateChat,
  user, 
  onOpenSettings, 
  onLogout, 
  onStatusChange,
  onDeleteStream,
  onDeleteConversation,
  onInviteMember,
  pendingInvites = [],
  onAcceptInvite,
  onDeclineInvite,
  onStreamCreated,
  onNewChat,
  onOpenCreateGroupModal,
  unreadCounts = {}
}) => {
  const [activeMenu, setActiveMenu] = useState('chats');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);


  return (
    <div className="sidebar glass-card">
      {/* Logo */}
      <div className="sidebar-logo">
        <img src="/image/logo.png" alt="Hubify" className="sidebar-logo-img" />
      </div>

      {/* New Conversation Button */}
      <div className="sidebar-action-container" style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn-new-chat" onClick={onNewChat} style={{ flex: 1 }}>
          <span>Nova conversa</span>
          <PlusIcon />
        </button>
        <button 
          className="chat-header-icon-btn" 
          onClick={onOpenCreateGroupModal} 
          title="Novo grupo"
          style={{ width: '46px', height: '46px', background: 'var(--bg-card-elev)', borderRadius: '12px' }}
        >
          <span>#</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="sidebar-tabs">
        <button 
          className={`sidebar-tab ${activeMenu === 'chats' ? 'active' : ''}`}
          onClick={() => setActiveMenu('chats')}
        >
          <MessageIcon />
          <span>Conversas</span>
        </button>
        <button 
          className={`sidebar-tab ${activeMenu === 'invites' ? 'active' : ''}`}
          onClick={() => setActiveMenu('invites')}
        >
          <MailIcon />
          <span>Convites</span>
          {pendingInvites.length > 0 && <span className="sidebar-badge unread">{pendingInvites.length}</span>}
        </button>
      </div>

      <div className="sidebar-scroll">
        {activeMenu === 'invites' && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">Convites</div>
            {pendingInvites.length === 0 ? (
              <div className="sidebar-empty-state" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum convite pendente</div>
            ) : (
              pendingInvites.map((invite) => (
                <div key={invite.id} className="sidebar-invite-item" style={{ background: 'var(--bg-card-elev)', padding: '1rem', borderRadius: '12px', marginBottom: '0.5rem' }}>
                  <div className="sidebar-invite-info">
                    <div className="invite-stream-name" style={{ fontWeight: 700, color: 'var(--accent)' }}>#{invite.stream.name}</div>
                    <div className="invite-sender" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>De: {invite.inviter.username}</div>
                  </div>
                  <div className="sidebar-invite-actions" style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', flex: 1 }} onClick={() => onAcceptInvite(invite.id)}>Aceitar</button>
                    <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', flex: 1 }} onClick={() => onDeclineInvite(invite.id)}>Recusar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeMenu === 'chats' && (
          <>
            <div className="sidebar-section">
              <div className="sidebar-section-title">Grupos</div>
              {streams.map((stream) => (
                <div key={stream.id} style={{ position: 'relative', marginBottom: '4px' }}>
                  <button
                    className={`sidebar-nav-item${activeStream?.id === stream.id ? ' active' : ''}`}
                    onClick={() => { setActiveStream(stream); setActivePrivateChat(null); }}
                  >
                    <div className="sidebar-nav-avatar">#</div>
                    <div className="sidebar-nav-info">
                      <span className="nav-item-text">{stream.name}</span>
                      <span className="nav-item-subtext">Grupo Público</span>
                    </div>
                    {unreadCounts[`stream_${stream.id}`] > 0 && (
                      <span className="sidebar-badge unread">{unreadCounts[`stream_${stream.id}`]}</span>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="sidebar-section">
              <div className="sidebar-section-title">Mensagens Privadas</div>
              {privateConversations.map((chat) => {
                const otherUser = chat.participants?.find(p => p.id !== user?.id) || {};
                const count = unreadCounts[`conv_${chat.id}`];
                return (
                  <div key={chat.id} style={{ position: 'relative', marginBottom: '4px' }}>
                    <button
                      className={`sidebar-nav-item${activePrivateChat?.id === chat.id ? ' active' : ''}`}
                      onClick={() => { setActivePrivateChat(chat); setActiveStream(null); }}
                    >
                      <div className="sidebar-nav-avatar">
                        {otherUser.avatarUrl ? (
                          <img src={otherUser.avatarUrl} alt={otherUser.username} style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
                        ) : (
                          (otherUser.username || 'U').charAt(0).toUpperCase()
                        )}
                        <div className={`status-dot ${otherUser.status?.toLowerCase() || 'offline'}`} />
                      </div>
                      <div className="sidebar-nav-info">
                        <span className="nav-item-text">{otherUser.displayName || otherUser.username}</span>
                        <span className="nav-item-subtext">@{otherUser.username}</span>
                      </div>
                      {count > 0 && <span className="sidebar-badge unread">{count}</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer Profile */}
      <div className="sidebar-profile">
        <div className="sidebar-nav-avatar" style={{ cursor: 'pointer' }} onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
          ) : (
            (user?.username || 'U').charAt(0).toUpperCase()
          )}
          <div className={`status-dot ${(user?.status || 'OFFLINE').toLowerCase()}`} />
        </div>
        <div className="sidebar-nav-info" style={{ cursor: 'pointer', flex: 1 }} onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
          <span className="nav-item-text">{user?.username || 'Usuário'}</span>
          <span className={`status-label ${(user?.status || 'OFFLINE').toLowerCase()}`} style={{ fontSize: '0.75rem', fontWeight: 600 }}>
            {(STATUS_META[user?.status || 'OFFLINE'] || STATUS_META.OFFLINE).label}
          </span>
        </div>

        {profileMenuOpen && (
          <div className="sidebar-profile-menu">
            <div className="sidebar-profile-menu-title" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Configurações</div>
            <button className="sidebar-profile-menu-item" onClick={() => { onOpenSettings(); setProfileMenuOpen(false); }}>
              <span style={{ fontSize: '1rem' }}>⚙️</span> Perfil e Conta
            </button>
            <div className="sidebar-profile-menu-title" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.5rem', borderTop: '1px solid var(--border-card)', paddingTop: '0.75rem' }}>Status</div>
            {statusOptions.map((status) => (
              <button
                key={status}
                className={`sidebar-profile-menu-item ${normalizeStatus(user?.status || 'OFFLINE') === status ? 'active' : ''}`}
                onClick={() => { onStatusChange?.(status); setProfileMenuOpen(false); }}
              >
                <div className={`status-dot ${STATUS_META[status].className}`} style={{ position: 'static', border: 'none', width: '8px', height: '8px' }} />
                {STATUS_META[status].label}
              </button>
            ))}
            <button className="sidebar-profile-menu-item logout" onClick={onLogout} style={{ color: 'var(--danger)', marginTop: '0.5rem', borderTop: '1px solid var(--border-card)', paddingTop: '0.75rem' }}>
              Sair
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
