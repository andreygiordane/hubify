import React, { useState } from 'react';

/* ── Icons ──────────────────────────────────────────────────────── */
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const OpenIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);
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

/* ── Helper ─────────────────────────────────────────────────────── */
const getDocInfo = (type = '', name = '') => {
  const t = type.toLowerCase(); const n = name.toLowerCase();
  if (t.includes('pdf') || n.endsWith('.pdf'))             return { icon: <PdfIcon />,  color: '#e11d48', label: 'PDF', bg: '#e11d48' };
  if (t.includes('word') || /\.(docx?|odt)$/.test(n))     return { icon: <WordIcon />, color: '#2563eb', label: 'Word', bg: '#2563eb' };
  if (t.includes('excel') || /\.(xlsx?|csv)$/.test(n))    return { icon: <ExcelIcon />,color: '#16a34a', label: 'Excel', bg: '#16a34a' };
  if (t.includes('presentation')||/\.(pptx?)$/.test(n))   return { icon: '📙', color: '#f97316', label: 'PowerPoint', bg: '#ea580c' };
  if (/\.(zip|rar|7z|tar|gz)$/.test(n))                   return { icon: '🗜️', color: '#eab308', label: 'Arquivo Comprimido', bg: '#ca8a04' };
  if (t.startsWith('audio'))                              return { icon: '🎵', color: '#a855f7', label: 'Áudio', bg: '#9333ea' };
  if (t.startsWith('video'))                              return { icon: '🎬', color: '#ec4899', label: 'Vídeo', bg: '#ec4899' };
  return { icon: '📄', color: '#94a3b8', label: 'Arquivo', bg: '#475569' };
};

/* ── Component ──────────────────────────────────────────────────── */
const FilePreviewModal = ({ file, onClose }) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  if (!file) return null;

  const isImage = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(file.url || '');
  const isPdf   = file.type === 'application/pdf' || /\.pdf$/i.test(file.url || '');
  const isAudio = file.type?.startsWith('audio/')  || /\.(mp3|wav|ogg|m4a|aac)$/i.test(file.url || '');
  const isVideo = file.type?.startsWith('video/')  || /\.(mp4|webm|mov)$/i.test(file.url || '');
  const docInfo = getDocInfo(file.type, file.name);

  // Google Docs viewer URL for embeds (only works for public URLs)
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(file.url)}&embedded=true`;
  const isLocal = file.url?.includes('localhost') || file.url?.includes('127.0.0.1');

  const handleDownload = async () => {
    try {
      const res = await fetch(file.url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl; a.download = file.name || 'download';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(blobUrl);
    } catch {
      const a = document.createElement('a');
      a.href = file.url; a.download = file.name || 'download'; a.target = '_blank';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
  };

  return (
    <div className="file-preview-overlay" onClick={onClose}>
      <div className="file-preview-container" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="file-preview-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
            {/* Type badge */}
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
              background: isImage ? 'rgba(91,79,245,0.15)' : docInfo.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
              color: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}>
              {isImage ? '🖼️' : docInfo.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="file-preview-name">{file.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {isImage ? 'Imagem' : isPdf ? 'Documento PDF' : isAudio ? 'Áudio' : isVideo ? 'Vídeo' : docInfo.label}
              </div>
            </div>
          </div>

          <div className="file-preview-actions">
            {/* Open in new tab */}
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir em nova aba"
              style={{
                width: '36px', height: '36px', borderRadius: '10px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
                background: 'var(--bg-hover)', transition: 'all 0.2s', textDecoration: 'none'
              }}
            >
              <OpenIcon />
            </a>
            <button className="preview-download-btn" onClick={handleDownload}>
              <DownloadIcon /> Baixar
            </button>
            <button className="preview-close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className={`file-preview-body ${isImage || isAudio || (!isImage && !isPdf && !isAudio && !isVideo) ? 'centered' : ''}`}>

          {/* Image */}
          {isImage && (
            <img src={file.url} alt={file.name} className="preview-image" />
          )}

          {/* PDF — try Google Docs viewer */}
          {isPdf && (
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {(!isLocal && !iframeLoaded) && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)',
                  zIndex: 1
                }}>
                  <div className="loading-spinner" style={{ fontSize: '3rem', animation: 'spin 1.5s linear infinite' }}>⏳</div>
                  <span style={{ fontSize: '0.9rem' }}>Carregando visualização…</span>
                </div>
              )}
              {isLocal ? (
                <embed
                  src={file.url}
                  type="application/pdf"
                  className="preview-pdf"
                />
              ) : (
                <iframe
                  src={googleViewerUrl}
                  title={file.name}
                  className="preview-pdf"
                  onLoad={() => setIframeLoaded(true)}
                  style={{ opacity: iframeLoaded ? 1 : 0, transition: 'opacity 0.3s', border: 'none', width: '100%', height: '76vh' }}
                />
              )}
            </div>
          )}

          {/* Audio */}
          {isAudio && (
            <div className="preview-placeholder">
              <div className="preview-placeholder-icon" style={{ fontSize: '6rem' }}>🎵</div>
              <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{file.name}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Arquivo de áudio</p>
              <audio controls src={file.url} style={{ width: '100%', maxWidth: '480px' }} />
            </div>
          )}

          {/* Video */}
          {isVideo && (
            <video
              controls
              src={file.url}
              style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px' }}
            />
          )}

          {/* Unknown / other docs */}
          {!isImage && !isPdf && !isAudio && !isVideo && (
            <div className="preview-placeholder">
              <div style={{
                width: '90px', height: '90px', borderRadius: '22px', background: docInfo.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem',
                marginBottom: '0.5rem'
              }}>
                {docInfo.icon}
              </div>
              <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', maxWidth: '400px' }}>
                {file.name}
              </p>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Visualização não disponível — baixe o arquivo para abrir no seu computador.
              </p>
              <button className="preview-download-btn" onClick={handleDownload} style={{ padding: '0.65rem 1.75rem', fontSize: '0.92rem' }}>
                <DownloadIcon /> Baixar {docInfo.label}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
