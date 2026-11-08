import React, { useState } from 'react';

const PALETTE = ['#4f52b2', '#0f6cbd', '#038387', '#107c10', '#8764b8', '#c239b3', '#ca5010', '#986f0b', '#d13438', '#5c2e91'];
const PLACEHOLDERS = ['/image/sem_foto.avif'];

export const initials = (name = '') =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';

export const colorFor = (seed = '') => {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
};

// Presença no estilo corporativo: cor + legenda
export const PRESENCE = {
  online: { label: 'Disponível', color: 'bg-success' },
  ausente: { label: 'Ausente', color: 'bg-warning' },
  reuniao: { label: 'Em reunião', color: 'bg-danger' },
  ocupado: { label: 'Ocupado', color: 'bg-danger' },
  offline: { label: 'Offline', color: 'bg-ink-3' },
};

export const presenceOf = (person) => {
  if (!person) return 'offline';
  if (person.status && person.status !== 'online' && PRESENCE[person.status]) return person.status;
  return person.isOnline || person.status === 'online' ? 'online' : 'offline';
};

export function PresenceDot({ status = 'offline', size = 12, className = '' }) {
  return (
    <span
      className={`absolute bottom-0 right-0 rounded-full ring-2 ring-surface ${(PRESENCE[status] || PRESENCE.offline).color} ${className}`}
      style={{ width: size, height: size }}
      title={(PRESENCE[status] || PRESENCE.offline).label}
    />
  );
}

export default function Avatar({ src, name = '', size = 40, square = false, status, className = '' }) {
  const [failed, setFailed] = useState(false);
  const hasImage = src && !failed && !PLACEHOLDERS.includes(src);
  const radius = square ? 'rounded-md' : 'rounded-full';

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      {hasImage ? (
        <img src={src} alt={name} onError={() => setFailed(true)} className={`w-full h-full object-cover ${radius} bg-hover`} />
      ) : (
        <div
          className={`w-full h-full ${radius} flex items-center justify-center text-white font-semibold select-none`}
          style={{ backgroundColor: colorFor(name), fontSize: Math.max(10, size * 0.38) }}
        >
          {initials(name)}
        </div>
      )}
      {status && <PresenceDot status={status} size={Math.max(8, Math.round(size * 0.28))} />}
    </div>
  );
}
