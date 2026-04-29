import React, { useState } from 'react';
import api from '../../services/api';

const CameraIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const CreateGroupModal = ({ onClose, onStreamCreated, currentUser, allUsers }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdStream, setCreatedStream] = useState(null);
  const [invitedUsers, setInvitedUsers] = useState({});   // { userId: 'pending' | 'sent' | 'error' }

  const otherUsers = allUsers.filter(u => String(u.id) !== String(currentUser?.id));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('O nome do grupo é obrigatório.'); return; }

    setLoading(true);
    setError('');
    try {
      let avatarUrl = '';
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const uploadRes = await api.post('/uploads/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        avatarUrl = uploadRes.data.url;
      }

      const streamRes = await api.post('/streams', { name, description, avatarUrl });
      setCreatedStream(streamRes.data);
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Ocorreu um erro ao criar o grupo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (userId) => {
    if (!createdStream) return;
    setInvitedUsers(prev => ({ ...prev, [userId]: 'pending' }));
    try {
      await api.post(`/invites/stream/${createdStream.id}/user/${userId}`);
      setInvitedUsers(prev => ({ ...prev, [userId]: 'sent' }));
    } catch (err) {
      console.error('Error inviting user:', err);
      setInvitedUsers(prev => ({ ...prev, [userId]: 'error' }));
    }
  };

  const handleFinish = () => {
    if (createdStream) onStreamCreated(createdStream);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 4000 }}
    >
      <div
        className="settings-drawer"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '480px', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid var(--border-card)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(91,79,245,0.12), rgba(167,139,250,0.06))'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {createdStream ? '👥 Convidar Membros' : '✨ Criar Novo Grupo'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
              {createdStream ? `Grupo "${createdStream.name}" criado! Convide os membros abaixo.` : 'Configure seu grupo e convide membros.'}
            </p>
          </div>
          <button className="settings-close-btn" onClick={onClose}>×</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, maxHeight: '70vh' }}>
          {!createdStream ? (
            /* ── Step 1: Create Group ── */
            <form onSubmit={handleCreateGroup} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {error && <div className="settings-alert error">{error}</div>}

              {/* Avatar Upload */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <label style={{ position: 'relative', width: '96px', height: '96px', cursor: 'pointer' }}>
                  <div style={{
                    width: '100%', height: '100%', borderRadius: '24px',
                    background: avatarPreview ? `url(${avatarPreview}) center/cover no-repeat` : 'var(--bg-card-hover)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    border: '2px dashed var(--border-color)', color: 'var(--text-muted)',
                    transition: 'all 0.2s', overflow: 'hidden'
                  }}>
                    {!avatarPreview && (
                      <>
                        <CameraIcon />
                        <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Foto</span>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
              </div>

              <div className="settings-field">
                <span>Nome do Grupo <span style={{ color: 'var(--danger)' }}>*</span></span>
                <input
                  type="text"
                  className="input-base"
                  placeholder="Ex: Marketing Digital"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="settings-field">
                <span>Descrição (Opcional)</span>
                <input
                  type="text"
                  className="input-base"
                  placeholder="Qual o objetivo deste grupo?"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', fontWeight: 700 }}
                disabled={loading}
              >
                {loading ? 'Criando Grupo...' : '🚀 Criar Grupo'}
              </button>
            </form>
          ) : (
            /* ── Step 2: Invite Members ── */
            <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {otherUsers.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  Nenhum outro usuário disponível para convidar.
                </div>
              ) : (
                otherUsers.map(u => {
                  const status = invitedUsers[u.id];
                  return (
                    <div key={u.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-card-hover)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      transition: 'all 0.2s'
                    }}>
                      {/* Avatar */}
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                        background: u.avatarUrl ? `url(${u.avatarUrl}) center/cover` : 'var(--accent-gradient)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: '1rem'
                      }}>
                        {!u.avatarUrl && u.username?.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.username}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                      </div>

                      {/* Invite Button */}
                      {status === 'sent' ? (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          color: 'var(--success)', fontWeight: 600, fontSize: '0.8rem',
                          padding: '0.4rem 0.75rem', borderRadius: '8px',
                          background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)'
                        }}>
                          <CheckIcon /> Convite Enviado
                        </div>
                      ) : status === 'error' ? (
                        <button
                          onClick={() => handleInviteUser(u.id)}
                          style={{
                            padding: '0.4rem 0.75rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem',
                            background: 'rgba(255,77,77,0.1)', color: 'var(--danger)', border: '1px solid rgba(255,77,77,0.2)',
                            cursor: 'pointer'
                          }}
                        >
                          Tentar novamente
                        </button>
                      ) : (
                        <button
                          onClick={() => handleInviteUser(u.id)}
                          disabled={status === 'pending'}
                          className="btn-primary"
                          style={{ padding: '0.4rem 1rem', fontSize: '0.82rem', fontWeight: 600, flexShrink: 0 }}
                        >
                          {status === 'pending' ? '...' : 'Convidar'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {createdStream && (
          <div style={{
            padding: '1rem 2rem',
            borderTop: '1px solid var(--border-card)',
            display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'
          }}>
            <button className="btn-secondary" onClick={handleFinish} style={{ padding: '0.6rem 1.5rem' }}>
              Ir para o grupo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateGroupModal;
