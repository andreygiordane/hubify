import React, { useMemo, useRef, useState } from 'react';
import api from '../../services/api';
import AttachmentMenu from './AttachmentMenu';

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const PaperclipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const MessageInput = ({ onSendMessage }) => {
  const [content, setContent] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [fileAccept, setFileAccept] = useState('image/*');
  const fileInputRef = useRef(null);

  const attachmentLabel = useMemo(() => {
    if (!attachmentFile) return '';
    return attachmentFile.name;
  }, [attachmentFile]);

  const handleOpenAttachmentMenu = () => {
    setShowAttachmentMenu(!showAttachmentMenu);
  };

  const handleSelectFileType = (accept) => {
    setFileAccept(accept);
    setShowAttachmentMenu(false);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) setAttachmentFile(file);
    event.target.value = '';
  };

  const uploadAttachment = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/uploads/attachment', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent && !attachmentFile) return;

    let attachment = null;
    if (attachmentFile) {
      setUploadingAttachment(true);
      try {
        attachment = await uploadAttachment(attachmentFile);
      } catch (err) {
        console.error('Upload error:', err);
      } finally {
        setUploadingAttachment(false);
      }
    }

    await onSendMessage({
      content: trimmedContent,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.fileName || attachmentFile?.name,
      attachmentType: attachment?.contentType || attachmentFile?.type,
    });

    setContent('');
    setAttachmentFile(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input-bar">
      <form onSubmit={handleSubmit} style={{ margin: 0, position: 'relative' }}>
        <div className="message-input-inner">
          <button
            type="button"
            className="message-input-icon-btn"
            title="Anexar arquivo"
            onClick={handleOpenAttachmentMenu}
          >
            <PaperclipIcon />
          </button>

          <input
            className="message-input-field"
            type="text"
            placeholder="Enviar mensagem..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept={fileAccept}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <button
            type="submit"
            className="message-send-btn"
            title={uploadingAttachment ? 'Enviando anexo...' : 'Enviar'}
            disabled={uploadingAttachment || (!content.trim() && !attachmentFile)}
          >
            <SendIcon />
          </button>
        </div>

        {attachmentLabel && (
          <div className="message-input-attachment-tag">
            <span>{attachmentLabel}</span>
            <button type="button" onClick={() => setAttachmentFile(null)}>×</button>
          </div>
        )}

        {showAttachmentMenu && (
          <div className="attachment-menu-container">
            <AttachmentMenu
              onSelectType={handleSelectFileType}
              onClose={() => setShowAttachmentMenu(false)}
            />
          </div>
        )}
      </form>
    </div>
  );
};

export default MessageInput;
