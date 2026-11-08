import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Avatar, { presenceOf } from '../ui/Avatar';
import ProfileMenu from './ProfileMenu';
import HeaderNotification from '../common/HeaderNotification';

// Barra superior (desktop): logo, busca de pessoas e conversas, notificações e perfil
export default function TopBar() {
  const { user, currentUserProfile, userStatus } = useAuth();
  const { users, chatRooms, setActiveRoomId, setSelectedChatMobile, setView, startConversation, showProfileMenu, setShowProfileMenu } = useChat();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') { e.preventDefault(); boxRef.current?.querySelector('input')?.focus(); }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { people: [], groups: [] };
    return {
      people: users.filter(u => u.id !== user?.id && `${u.name} ${u.email || ''}`.toLowerCase().includes(q)).slice(0, 6),
      groups: chatRooms.filter(r => r.isGroup && r.name.toLowerCase().includes(q)).slice(0, 4),
    };
  }, [query, users, chatRooms, user?.id]);

  const pick = (fn) => { fn(); setQuery(''); setOpen(false); };
  const hasResults = results.people.length + results.groups.length > 0;

  return (
    <header className="hidden md:flex h-12 shrink-0 bg-topbar items-center gap-4 pl-3 pr-3 text-white">
      <div className="w-[52px] flex items-center justify-center">
        <img src="/image/logo.png" alt="Hubify" className="h-7 w-auto object-contain" />
      </div>

      <div className="flex-1 flex justify-center">
        <div ref={boxRef} className="relative w-full max-w-[560px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Pesquisar pessoas e grupos (Ctrl+E)"
            className="w-full h-8 pl-9 pr-8 rounded-md bg-surface text-ink text-sm placeholder:text-ink-3 outline-none ring-0 focus:ring-2 focus:ring-brand/60"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"><X className="w-4 h-4" /></button>
          )}
          {open && query.trim() && (
            <div className="menu absolute top-full mt-1 w-full z-[130] max-h-[60vh] overflow-y-auto custom-scrollbar">
              {!hasResults && <p className="px-4 py-6 text-center text-ink-2">Nenhum resultado para "{query}"</p>}
              {results.people.length > 0 && <p className="px-4 pt-2 pb-1 section-title">Pessoas</p>}
              {results.people.map(p => (
                <button key={p.id} onClick={() => pick(() => startConversation(p.id))} className="menu-item px-4">
                  <Avatar src={p.avatarUrl} name={p.name} size={32} status={presenceOf(p)} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="block truncate text-xs text-ink-2">{p.role || p.email}</span>
                  </span>
                </button>
              ))}
              {results.groups.length > 0 && <p className="px-4 pt-2 pb-1 section-title">Grupos</p>}
              {results.groups.map(g => (
                <button key={g.id} onClick={() => pick(() => { setView('chat'); setActiveRoomId(g.id); setSelectedChatMobile(true); })} className="menu-item px-4">
                  <Avatar src={g.avatarUrl} name={g.name} size={32} square />
                  <span className="truncate font-semibold">{g.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <HeaderNotification variant="topbar" />
        <div className="relative">
          <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="rounded-full p-0.5 hover:bg-white/10" title="Perfil e status">
            <Avatar src={currentUserProfile?.avatarUrl} name={currentUserProfile?.name} size={32} status={userStatus} />
          </button>
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-[110]" onClick={() => setShowProfileMenu(false)} />
              <ProfileMenu className="absolute right-0 top-full mt-2" />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
