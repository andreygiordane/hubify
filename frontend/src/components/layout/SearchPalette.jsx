import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, Hash, CornerDownLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Avatar, { presenceOf, PRESENCE } from '../ui/Avatar';

// Busca rápida (Ctrl+K): pessoas, grupos e conversas
export default function SearchPalette({ onClose }) {
  const { user } = useAuth();
  const { users, chatRooms, setActiveRoomId, setSelectedChatMobile, setView, startConversation } = useChat();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const people = users
      .filter(u => u.id !== user?.id && (!q || `${u.name} ${u.email || ''} ${u.role || ''}`.toLowerCase().includes(q)))
      .slice(0, q ? 8 : 5)
      .map(u => ({ key: u.id, kind: 'person', title: u.name, subtitle: u.role || PRESENCE[presenceOf(u)].label, avatar: u, run: () => startConversation(u.id) }));
    const groups = chatRooms
      .filter(r => r.isGroup && (!q || r.name.toLowerCase().includes(q)))
      .slice(0, 5)
      .map(g => ({ key: g.id, kind: 'group', title: g.name, subtitle: `${g.members?.length || 0} membros`, avatar: g, run: () => { setView('chat'); setActiveRoomId(g.id); setSelectedChatMobile(true); } }));
    return [...people, ...groups];
  }, [query, users, chatRooms, user?.id]);

  useEffect(() => setIndex(0), [query]);

  const choose = (r) => { r.run(); onClose(); };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[index]) choose(results[index]);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 flex items-start justify-center pt-[12vh] px-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-xl bg-subtle rounded-xl shadow-pop overflow-hidden animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 pb-2">
          <p className="text-xs text-ink-2 mb-2 font-medium">Encontre ou comece uma conversa</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-3" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Pessoas, grupos..."
              className="w-full h-12 pl-11 pr-4 rounded-lg bg-app text-ink text-lg placeholder:text-ink-3 outline-none"
            />
          </div>
        </div>
        <div className="max-h-[50vh] overflow-y-auto custom-scrollbar px-2 pb-2">
          {results.length === 0 && <p className="px-4 py-8 text-center text-ink-2">Nada encontrado para "{query}".</p>}
          {results.map((r, i) => (
            <button
              key={r.key}
              onMouseEnter={() => setIndex(i)}
              onClick={() => choose(r)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left ${i === index ? 'bg-hover' : ''}`}
            >
              <Avatar src={r.avatar.avatarUrl} name={r.title} size={32} status={r.kind === 'person' ? presenceOf(r.avatar) : undefined} />
              <span className="flex-1 min-w-0">
                <span className="block text-ink font-medium truncate">{r.title}</span>
                <span className="block text-xs text-ink-3 truncate">{r.subtitle}</span>
              </span>
              <span className="text-ink-3">{r.kind === 'group' ? <Hash className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}</span>
              {i === index && <CornerDownLeft className="w-4 h-4 text-ink-3" />}
            </button>
          ))}
        </div>
        <div className="px-4 py-2.5 bg-app text-[11px] text-ink-3 flex gap-4">
          <span><b className="text-ink-2">↑↓</b> navegar</span>
          <span><b className="text-ink-2">Enter</b> abrir</span>
          <span><b className="text-ink-2">Esc</b> fechar</span>
        </div>
      </div>
    </div>
  );
}
