import React from 'react';

export default function ReadIndicator({ isRead, size = 14 }) {
  const gray = '#94a3b8';
  const green = '#10b981';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={isRead ? 'Mensagem lida' : 'Enviado'}
      role="img"
    >
      {/* Single gray arrow when sent (not read) */}
      {!isRead && (
        <path d="M4 12l4 4 10-10" stroke={gray} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* Double green arrows when read (two ticks) */}
      {isRead && (
        <>
          <path d="M3.5 12.5l4 4 10-10" stroke={green} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 12.5l4 4 10-10" stroke={green} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}
