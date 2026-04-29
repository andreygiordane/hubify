import React, { useRef, useEffect, useState, useCallback } from 'react';
import FilePreviewModal from './FilePreviewModal';
import api from '../../services/api';

/* ── Color helpers ──────────────────────────────────────────────────── */
const avatarColors = [
  'linear-gradient(135deg,#5b4ff5,#a78bfa)',
  'linear-gradient(135deg,#0ea5e9,#38bdf8)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#f59e0b,#fbbf24)',
  'linear-gradient(135deg,#ec4899,#f472b6)',
  'linear-gradient(135deg,#ef4444,#f87171)',
];
const getAvatarColor = (name = '') => avatarColors[name.charCodeAt(0) % avatarColors.length];
const getAvatarStyle = (user = {}) => {
  if (user.avatarUrl) return { backgroundImage: `url(${user.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  return { background: getAvatarColor(user.username || '') };
};

/* ── Doc type helper ────────────────────────────────────────────────── */
const getDocInfo = (type = '', name = '') => {
  const t = type.toLowerCase(); const n = name.toLowerCase();
  if (t.includes('pdf') || n.endsWith('.pdf'))              return { cls: 'pdf',   icon: <PdfIcon />,   label: 'PDF' };
  if (t.includes('word') || /\.(docx?|odt)$/.test(n))      return { cls: 'word',  icon: <WordIcon />,  label: 'Word' };
  if (t.includes('excel') || /\.(xlsx?|csv|ods)$/.test(n)) return { cls: 'excel', icon: <ExcelIcon />, label: 'Planilha' };
  if (t.includes('presentation') || /\.(pptx?)$/.test(n))  return { cls: 'ppt',   icon: '📙', label: 'Apresentação' };
  if (/\.(zip|rar|7z|tar|gz)$/.test(n))                    return { cls: 'zip',   icon: '🗜️', label: 'Comprimido' };
  if (t.startsWith('audio') || /\.(mp3|wav|ogg|m4a)$/.test(n)) return { cls: 'audio', icon: '🎵', label: 'Áudio' };
  if (t.startsWith('video') || /\.(mp4|mov|mkv)$/.test(n)) return { cls: 'zip',   icon: '🎬', label: 'Vídeo' };
  return { cls: 'generic', icon: '📄', label: 'Arquivo' };
};

/* ── Context menu icons ─────────────────────────────────────────────── */
const WordIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#2563EB"/>
    <path d="M14 2V8H20" fill="#60A5FA"/>
    <path d="M8 12L9.5 17L11 12L12.5 17L14 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const PdfIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#E11D48"/>
    <path d="M14 2V8H20" fill="#FB7185"/>
    <text x="7" y="17" fill="white" fontSize="6" fontWeight="bold" fontFamily="Arial">PDF</text>
  </svg>
);
const ExcelIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#16A34A"/>
    <path d="M14 2V8H20" fill="#4ADE80"/>
    <path d="M8 13H11V16H8V13ZM12 13H15V16H12V13Z" stroke="white" strokeWidth="1.5"/>
  </svg>
);
const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

/* ── MessageList ─────────────────────────────────────────────────────── */
const MessageList = ({ messages: initialMessages, currentUser, previewFile, setPreviewFile, onMessagesUpdate }) => {
  const endRef = useRef(null);
  const [messages, setMessages] = useState(initialMessages || []);
  const [hoveredId, setHoveredId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Keep messages in sync with parent prop
  useEffect(() => { setMessages(initialMessages || []); }, [initialMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openPreview = (msg) =>
    setPreviewFile({ url: msg.attachmentUrl, name: msg.attachmentName || 'Anexo', type: msg.attachmentType || '' });

  /* Handle real-time updates from parent WebSocket events */
  const applyEvent = useCallback((data) => {
    if (data.type === 'MESSAGE_EDITED') {
      setMessages(prev => prev.map(m =>
        String(m.id) === String(data.id) ? { ...m, content: data.content, edited: true } : m
      ));
    } else if (data.type === 'MESSAGE_DELETED') {
      setMessages(prev => prev.filter(m => String(m.id) !== String(data.id)));
    }
  }, []);

  // Expose applyEvent so ChatInterface can forward WS events down
  useEffect(() => {
    if (onMessagesUpdate) onMessagesUpdate(applyEvent);
  }, [applyEvent, onMessagesUpdate]);

  /* Edit handlers */
  const startEdit = (msg) => {
    setEditingId(msg.id);
    setEditContent(msg.content);
    setHoveredId(null);
  };

  const cancelEdit = () => { setEditingId(null); setEditContent(''); };

  const submitEdit = async (msgId) => {
    if (!editContent.trim()) return;
    try {
      await api.put(`/messages/${msgId}`, { content: editContent.trim() });
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, content: editContent.trim(), edited: true } : m
      ));
      cancelEdit();
    } catch (err) {
      console.error('Error editing message:', err);
    }
  };

  /* Delete handler */
  const confirmDelete = async (msgId) => {
    try {
      await api.delete(`/messages/${msgId}`);
      setMessages(prev => prev.filter(m => m.id !== msgId));
      setDeletingId(null);
    } catch (err) {
      console.error('Error deleting message:', err);
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="message-list">
        {messages.length === 0 ? (
          <div className="message-empty">
            <div className="message-empty-icon">💬</div>
            <span>Nenhuma mensagem ainda. Inicie a conversa!</span>
          </div>
        ) : (
          messages.map((msg, index) => {
            const sender   = msg.sender || {};
            const senderName = sender.username ?? 'Usuário';
            const timeLabel  = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'agora';
            const isOwn = sender.id === currentUser?.id || sender.username === currentUser?.username;

            const attType = msg.attachmentType || '';
            const attName = msg.attachmentName || 'Anexo';
            const attUrl  = msg.attachmentUrl;
            const isImage = attType.startsWith('image/') || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(attName);
            const isAudio = attType.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(attName);
            const isDoc   = Boolean(attUrl) && !isImage && !isAudio;
            const docInfo = isDoc ? getDocInfo(attType, attName) : null;
            const isEditing = editingId === msg.id;
            const isDeleting = deletingId === msg.id;
            const showMenu = hoveredId === msg.id && isOwn && !isEditing;

            return (
              <div
                key={msg.id ?? index}
                className={`message-group${isOwn ? ' own' : ''}`}
                style={{ position: 'relative' }}
                onMouseEnter={() => setHoveredId(msg.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="msg-avatar" style={getAvatarStyle(sender)}>
                  {!sender.avatarUrl && senderName.charAt(0).toUpperCase()}
                </div>

                <div className="msg-body">
                  <div className="msg-meta">
                    <span className="msg-sender">{senderName}</span>
                    <span className="msg-time">{timeLabel}</span>
                    {msg.edited && <span className="msg-edited-badge">editado</span>}
                  </div>

                  {/* Edit mode */}
                  {isEditing ? (
                    <div className="msg-edit-box">
                      <textarea
                        className="msg-edit-input"
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit(msg.id); }
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        autoFocus
                        rows={2}
                      />
                      <div className="msg-edit-actions">
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enter para salvar · Esc para cancelar</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={cancelEdit}>Cancelar</button>
                          <button className="btn-primary"   style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => submitEdit(msg.id)}>Salvar</button>
                        </div>
                      </div>
                    </div>
                  ) : isDeleting ? (
                    /* Delete confirmation */
                    <div className="msg-delete-confirm">
                      <span>Apagar esta mensagem para todos?</span>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button className="btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setDeletingId(null)}>Cancelar</button>
                        <button style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', borderRadius: '8px', background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }} onClick={() => confirmDelete(msg.id)}>Apagar</button>
                      </div>
                    </div>
                  ) : (
                    msg.content && <div className="msg-text">{msg.content}</div>
                  )}

                  {/* Image thumbnail */}
                  {!isEditing && attUrl && isImage && (
                    <div className="msg-image-thumb" onClick={() => openPreview(msg)}>
                      <img src={attUrl} alt={attName} />
                      <div className="msg-image-overlay">🔍</div>
                    </div>
                  )}

                  {/* Audio */}
                  {!isEditing && attUrl && isAudio && (
                    <div className="msg-attachment" style={{ maxWidth: '320px' }}>
                      <div className="msg-attachment-icon-box audio">🎵</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="msg-attachment-name">{attName}</div>
                        <audio controls src={attUrl} className="msg-audio-player" />
                      </div>
                    </div>
                  )}

                  {/* Document */}
                  {!isEditing && attUrl && isDoc && docInfo && (
                    <div className="msg-attachment clickable" onClick={() => openPreview(msg)}>
                      <div className={`msg-attachment-icon-box ${docInfo.cls}`}>{docInfo.icon}</div>
                      <div style={{ minWidth: 0 }}>
                        <div className="msg-attachment-name">{attName}</div>
                        <div className="msg-attachment-meta">{docInfo.label} · Clique para abrir</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Context menu — shown on hover, only for own messages */}
                {showMenu && (
                  <div className={`msg-context-menu${isOwn ? ' own' : ''}`}>
                    <button className="msg-ctx-btn" title="Editar" onClick={() => startEdit(msg)}>
                      <PencilIcon />
                    </button>
                    <button className="msg-ctx-btn danger" title="Apagar" onClick={() => setDeletingId(msg.id)}>
                      <TrashIcon />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </>
  );
};

export default MessageList;
