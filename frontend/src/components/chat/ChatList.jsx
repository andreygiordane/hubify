import React, { useState, useEffect } from 'react';
import { Search, X, MoreVertical, BellOff, Bell, Trash2, Info, PenSquare, Users as UsersIcon, MessageSquare, ChevronRight, Camera, FileText, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../context/ChatContext';
import Avatar, { presenceOf } from '../ui/Avatar';
import ReadIndicator from '../common/ReadIndicator';
import { formatListTime } from '../../utils/format';

const FILTERS = [
  { id: 'all', label: 'Tudo' },
  { id: 'unread', label: 'Não lidas' },
  { id: 'groups', label: 'Grupos' },
];

export default function ChatList({
  chatRooms,
  activeRoomId,
  setActiveRoomId,
  readTimestamps,
  allMessages,
  user,
  users,
  setShowDMModal,
  setShowGroupModal,
  setSelectedChatMobile,
  groupInvites,
  onViewInvitations,
  mutedRooms,
  setShowChatInfo,
  toggleMuteRoom,
  setRoomToDelete
}) {
  const { otherUsersReadTimestamps, typingUsers } = useChat();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeMenuData, setActiveMenuData] = useState(null); // { roomId, rect, room }

  const closeMenu = () => setActiveMenuData(null);
  const unreadOf = (room) => allMessages.filter(m => m.roomId === room.id && m.senderId !== user?.id && m.timestamp > (readTimestamps[room.id] || 0)).length;

  const filteredRooms = chatRooms
    .filter(room => room.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(room => filter === 'all' || (filter === 'groups' ? room.isGroup : unreadOf(room) > 0));

  const pendingInvites = groupInvites?.filter(i => i.toId === user?.id && i.status === 'pending').length || 0;

  return (
    <div className="w-full bg-surface flex flex-col h-full overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-ink">Chat</h2>
          <div className="relative flex items-center gap-1">
            <button onClick={() => setShowDMModal(true)} className="icon-btn" title="Nova conversa">
              <PenSquare className="w-[18px] h-[18px]" />
            </button>
            <button onClick={() => setShowAddMenu(!showAddMenu)} className={`icon-btn ${showAddMenu ? 'bg-hover text-ink' : ''}`} title="Mais opções">
              <MoreVertical className="w-[18px] h-[18px]" />
            </button>
            {showAddMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
                <div className="menu absolute right-0 top-full mt-1 w-52 z-50">
                  <button onClick={() => { setShowDMModal(true); setShowAddMenu(false); }} className="menu-item">
                    <MessageSquare className="w-4 h-4 text-ink-2" /> Nova conversa
                  </button>
                  <button onClick={() => { setShowGroupModal(true); setShowAddMenu(false); }} className="menu-item">
                    <UsersIcon className="w-4 h-4 text-ink-2" /> Novo grupo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar ou começar uma nova conversa"
            className="w-full h-9 bg-subtle dark:bg-hover rounded-lg pl-9 pr-8 text-sm text-ink placeholder:text-ink-3 outline-none focus:ring-1 focus:ring-chat-accent"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`h-7 px-3 rounded-full text-[13px] transition-colors ${filter === f.id ? 'bg-chat-accent/15 text-chat-accent font-semibold' : 'bg-subtle dark:bg-hover text-ink-2 hover:bg-hover'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {pendingInvites > 0 && (
        <button onClick={onViewInvitations} className="mx-3 mb-1 flex items-center gap-3 px-3 py-2.5 rounded-lg bg-brand-soft text-brand-ink hover:brightness-95 transition">
          <UsersIcon className="w-5 h-5" />
          <span className="flex-1 text-left text-sm font-semibold">
            {pendingInvites} convite{pendingInvites > 1 ? 's' : ''} para grupo pendente{pendingInvites > 1 ? 's' : ''}
          </span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <div className="flex-1 overflow-y-auto pb-24 md:pb-2 custom-scrollbar">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
            <MessageSquare className="w-10 h-10 text-ink-3 mb-3" strokeWidth={1.5} />
            <p className="text-ink-2">
              {searchQuery ? 'Nenhuma conversa encontrada' : filter === 'unread' ? 'Nenhuma conversa não lida' : filter === 'groups' ? 'Você ainda não participa de grupos' : 'Nenhuma conversa ainda'}
            </p>
            {!searchQuery && filter === 'all' && (
              <button onClick={() => setShowDMModal(true)} className="btn-primary mt-4">Iniciar conversa</button>
            )}
          </div>
        ) : (
          filteredRooms.map((room) => {
            const lastMsg = allMessages.filter(m => m.roomId === room.id).slice(-1)[0];
            const otherId = room.id_contact;
            const isRead = otherId && lastMsg && ((otherUsersReadTimestamps?.[otherId] || {})[room.id] || 0) >= lastMsg.timestamp;
            const typing = Object.entries(typingUsers?.[room.id] || {}).filter(([id]) => id !== user?.id);
            return (
              <ChatRoomItem
                key={room.id}
                room={room}
                user={user}
                lastMsg={lastMsg}
                isRead={isRead}
                typing={typing}
                unreadCount={unreadOf(room)}
                isActive={activeRoomId === room.id}
                isMuted={mutedRooms?.includes(room.id)}
                presence={room.isGroup ? null : presenceOf(users?.find(u => u.id === otherId) || room)}
                onOpen={() => { setActiveRoomId(room.id); setSelectedChatMobile(room); }}
                onOpenMenu={(rect) => setActiveMenuData({ roomId: room.id, rect, room })}
                onDelete={() => setRoomToDelete(room)}
              />
            );
          })
        )}
      </div>

      <AnimatePresence>
        {activeMenuData && (() => {
          const menuHeight = 130;
          const openDown = activeMenuData.rect.top < window.innerHeight - menuHeight - 20;
          const top = openDown ? activeMenuData.rect.bottom + 4 : activeMenuData.rect.top - menuHeight - 4;
          const left = Math.max(8, Math.min(activeMenuData.rect.right - 220, window.innerWidth - 228));
          return (
            <>
              <div className="fixed inset-0 z-[1000]" onClick={closeMenu} />
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                style={{ position: 'fixed', top, left, width: 220, zIndex: 1001 }}
                className="menu"
              >
                <button onClick={() => { toggleMuteRoom?.(activeMenuData.roomId); closeMenu(); }} className="menu-item">
                  {mutedRooms?.includes(activeMenuData.roomId) ? <Bell className="w-4 h-4 text-ink-2" /> : <BellOff className="w-4 h-4 text-ink-2" />}
                  {mutedRooms?.includes(activeMenuData.roomId) ? 'Reativar notificações' : 'Silenciar notificações'}
                </button>
                <button onClick={() => { setActiveRoomId(activeMenuData.roomId); setSelectedChatMobile(activeMenuData.room); setShowChatInfo(true); closeMenu(); }} className="menu-item">
                  <Info className="w-4 h-4 text-ink-2" /> Dados {activeMenuData.room.isGroup ? 'do grupo' : 'do contato'}
                </button>
                <div className="border-t border-line my-1" />
                <button onClick={() => { setRoomToDelete(activeMenuData.room); closeMenu(); }} className="menu-item text-danger">
                  <Trash2 className="w-4 h-4" /> {activeMenuData.room.isGroup ? 'Sair do grupo' : 'Apagar conversa'}
                </button>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

function preview(lastMsg) {
  if (!lastMsg) return { text: 'Sem mensagens' };
  if (lastMsg.attachment && !lastMsg.text) {
    const isImage = lastMsg.attachment.type?.startsWith('image/');
    return { icon: isImage ? Camera : FileText, text: isImage ? 'Foto' : lastMsg.attachment.name };
  }
  return { text: lastMsg.text || '' };
}

function ChatRoomItem({ room, user, lastMsg, isRead, typing, unreadCount, isActive, isMuted, presence, onOpen, onOpenMenu, onDelete }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const mine = lastMsg && lastMsg.senderId === user?.id;
  const p = preview(lastMsg);
  const senderPrefix = room.isGroup && lastMsg && !mine ? `${(lastMsg.senderName || '').split(' ')[0]}: ` : '';

  return (
    <div className="relative group">
      {/* Ações ao arrastar para o lado (celular) */}
      <div className="absolute inset-0 md:hidden flex justify-end">
        <button onClick={(e) => { e.stopPropagation(); onOpenMenu(e.currentTarget.getBoundingClientRect()); }} className="w-[70px] bg-ink-3 flex items-center justify-center text-white">
          <MoreVertical size={22} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-[70px] bg-danger flex items-center justify-center text-white">
          <Trash2 size={22} />
        </button>
      </div>

      <motion.div
        drag={isMobile ? 'x' : false}
        dragConstraints={{ left: -140, right: 0 }}
        dragElastic={0.05}
        dragDirectionLock
        dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
        onClick={onOpen}
        className={`relative z-10 flex items-center gap-3 pl-3 cursor-pointer transition-colors ${isActive ? 'bg-hover' : 'bg-surface hover:bg-subtle dark:hover:bg-hover/60'}`}
        style={{ touchAction: 'pan-y' }}
      >
        <Avatar src={room.avatarUrl} name={room.name} size={48} status={presence} />

        <div className="flex-1 min-w-0 py-3 pr-3 border-b border-line/70">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-[15px] text-ink truncate">{room.name}</h3>
            <span className={`text-xs shrink-0 ${unreadCount > 0 ? 'text-chat-accent font-semibold' : 'text-ink-3'}`}>
              {lastMsg ? formatListTime(lastMsg.timestamp) : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className={`flex-1 min-w-0 flex items-center gap-1 text-[13px] ${unreadCount > 0 ? 'text-ink font-medium' : 'text-ink-2'}`}>
              {typing.length > 0 ? (
                <span className="text-chat-accent font-medium truncate">digitando...</span>
              ) : (
                <>
                  {mine && <ReadIndicator isRead={isRead} size={16} className="shrink-0" />}
                  {p.icon && <p.icon className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{senderPrefix}{p.text}</span>
                  {lastMsg?.isEdited && <Pencil className="w-3 h-3 shrink-0 opacity-60" />}
                </>
              )}
            </p>
            {isMuted && <BellOff className="w-3.5 h-3.5 text-ink-3 shrink-0" />}
            {unreadCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-chat-accent text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                {unreadCount}
              </span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onOpenMenu(e.currentTarget.getBoundingClientRect()); }}
              className="hidden md:flex w-6 h-6 -mr-1 items-center justify-center rounded text-ink-3 hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity"
              title="Opções"
            >
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
