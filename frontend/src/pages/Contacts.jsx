import React, { useState } from 'react';
import { Search, MessageSquare, Phone, Video, X, Mail, Briefcase, Info } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import Avatar, { presenceOf, PRESENCE } from '../components/ui/Avatar';

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'online', label: 'Disponíveis' },
];

export default function Contacts() {
  const { users, startConversation, handleStartMeeting, handleStartAudioCall } = useChat();
  const { user } = useAuth();
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const q = searchQuery.toLowerCase();
  const filteredUsers = users
    .filter(u => u.name.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
    .filter(u => filter === 'all' || presenceOf(u) === 'online')
    .sort((a, b) => (a.id === user?.id) - (b.id === user?.id) || a.name.localeCompare(b.name));

  const handleAction = async (action, contactId) => {
    // Primeiro garante que a conversa está ativa
    await startConversation(contactId);

    // Calcula o roomId manualmente para garantir que a chamada use o canal correto
    // independente do delay de atualização do estado global
    const forcedRoomId = `dm_${[user.id, contactId].sort().join('_')}`;

    if (action === 'audio') {
      handleStartAudioCall(forcedRoomId);
    } else if (action === 'video') {
      handleStartMeeting(forcedRoomId);
    }
    setSelectedContact(null);
  };

  const onlineCount = users.filter(u => presenceOf(u) === 'online').length;

  return (
    <div className="flex-1 flex flex-col bg-app overflow-hidden">
      <header className="shrink-0 bg-surface border-b border-line px-4 md:px-6 py-3 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-lg font-bold text-ink">Pessoas</h1>
          <p className="text-xs text-ink-2">{users.length} membros · {onlineCount} disponíveis agora</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
            <input
              type="text"
              placeholder="Buscar por nome, cargo ou e-mail"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9"
            />
          </div>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`h-8 px-3 rounded-full text-[13px] whitespace-nowrap ${filter === f.id ? 'bg-brand-soft text-brand-ink font-semibold' : 'text-ink-2 hover:bg-hover'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-24 md:pb-6">
        {filteredUsers.length === 0 ? (
          <p className="text-center text-ink-2 py-16">Ninguém encontrado.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 max-w-7xl mx-auto">
            {filteredUsers.map(u => {
              const presence = presenceOf(u);
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedContact(u)}
                  className="card p-4 flex items-center gap-3 text-left hover:shadow-pop transition-shadow group"
                >
                  <Avatar src={u.avatarUrl} name={u.name} size={48} status={presence} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink truncate">
                      {u.name} {u.id === user?.id && <span className="text-ink-3 font-normal">(você)</span>}
                    </p>
                    <p className="text-xs text-ink-2 truncate">{u.role || 'Membro da equipe'}</p>
                    <p className="text-xs text-ink-3 truncate">{PRESENCE[presence].label}</p>
                  </div>
                  {u.id !== user?.id && (
                    <span className="hidden group-hover:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <span role="button" title="Mensagem" onClick={() => handleAction('chat', u.id)} className="icon-btn"><MessageSquare className="w-4 h-4" /></span>
                      <span role="button" title="Videochamada" onClick={() => handleAction('video', u.id)} className="icon-btn"><Video className="w-4 h-4" /></span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedContact && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={() => setSelectedContact(null)}>
          <div className="card w-full max-w-md overflow-hidden animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="h-24 bg-topbar relative">
              <button onClick={() => setSelectedContact(null)} className="absolute top-3 right-3 w-8 h-8 rounded-md text-white/80 hover:bg-white/10 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 pb-6 -mt-12">
              <div className="inline-block rounded-full ring-4 ring-surface">
                <Avatar src={selectedContact.avatarUrl} name={selectedContact.name} size={96} status={presenceOf(selectedContact)} />
              </div>
              <h3 className="text-xl font-semibold text-ink mt-3">{selectedContact.name}</h3>
              <p className="text-sm text-ink-2 flex items-center gap-2 mt-0.5">
                <Briefcase className="w-3.5 h-3.5" /> {selectedContact.role || 'Membro da equipe'}
                <span className="text-ink-3">·</span>
                {PRESENCE[presenceOf(selectedContact)].label}
              </p>

              <div className="mt-5 space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-ink-3 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-ink-3">E-mail</p>
                    <p className="text-sm text-ink truncate">{selectedContact.email || 'Não informado'}</p>
                  </div>
                </div>
                {selectedContact.bio && (
                  <div className="flex items-start gap-3">
                    <Info className="w-4 h-4 text-ink-3 mt-0.5" />
                    <div>
                      <p className="text-xs text-ink-3">Sobre</p>
                      <p className="text-sm text-ink">{selectedContact.bio}</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedContact.id !== user?.id && (
                <div className="grid grid-cols-3 gap-2 mt-6">
                  <button onClick={() => handleAction('chat', selectedContact.id)} className="btn-primary h-10"><MessageSquare className="w-4 h-4" /> Mensagem</button>
                  <button onClick={() => handleAction('audio', selectedContact.id)} className="btn-secondary h-10"><Phone className="w-4 h-4" /> Áudio</button>
                  <button onClick={() => handleAction('video', selectedContact.id)} className="btn-secondary h-10"><Video className="w-4 h-4" /> Vídeo</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
