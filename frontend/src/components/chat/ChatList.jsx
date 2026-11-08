import React, { useState, useEffect } from 'react';
import { Search, X, MoreHorizontal, BellOff, Bell, Trash2, Info, Plus, Users as UsersIcon, MessageSquare, ChevronRight, Camera, FileText, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../context/ChatContext';
import Avatar, { presenceOf } from '../ui/Avatar';
import ReadIndicator from '../common/ReadIndicator';
import { formatListTime } from '../../utils/format';

const FILTERS = [
  { id: 'all', label: 'Todas' },
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
    <div className="w-full bg-subtle flex flex-col h-full overflow-hidden">
      <div className="h-14 md:h-12 shrink-0 px-3 flex items-center gap-2 border-b border-line md:shadow-[0_1px_0_rgb(0_0_0/0.15)]">
        <h2 className="md:hidden text-lg font-bold text-ink mr-auto">Conversas</h2>
        <div className="relative flex-1 hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Encontrar conversa"
            className="w-full h-8 rounded-md bg-app pl-8 pr-7 text-sm text-ink placeholder:text-ink-3 outline-none focus:ring-2 focus:ring-brand/50"
          />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="relative">
          <button onClick={() => setShowAddMenu(!showAddMenu)} className={`icon-btn ${showAddMenu ? 'bg-hover text-ink' : ''}`} title="Nova conversa ou grupo">
            <Plus className="w-5 h-5" />
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

      <div className="md:hidden px-3 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Pesquisar conversas" className="w-full h-10 rounded-lg bg-app pl-9 pr-3 text-[15px] text-ink placeholder:text-ink-3 outline-none" />
        </div>
      </div>

      <div className="flex gap-1 px-3 pt-3 pb-1">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`h-7 px-2.5 rounded-md text-[13px] font-medium transition-colors ${filter === f.id ? 'bg-hover text-ink' : 'text-ink-3 hover:text-ink-2 hover:bg-hover/60'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {pendingInvites > 0 && (
        <button onClick={onViewInvitations} className="mx-2 mt-1 flex items-center gap-3 px-3 py-2 rounded-md bg-brand-soft text-brand-ink hover:brightness-110 transition">
          <UsersIcon className="w-4 h-4" />
          <span className="flex-1 text-left text-sm font-medium">
            {pendingInvites} convite{pendingInvites > 1 ? 's' : ''} para grupo
          </span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-3">Mensagens diretas e grupos</p>

      <div className="flex-1 overflow-y-auto pb-24 md:pb-2 px-2 custom-scrollbar">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <MessageSquare className="w-9 h-9 text-ink-3 mb-3" strokeWidth={1.5} />
            <p className="text-sm text-ink-2">
              {searchQuery ? 'Nenhuma conversa encontrada' : filter === 'unread' ? 'Tudo lido por aqui' : filter === 'groups' ? 'Você ainda não participa de grupos' : 'Nenhuma conversa ainda'}
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
                  {mutedRooms?.includes(activeMenuData.roomId) ? 'Reativar notificações' : 'Silenciar'}
                </button>
                <button onClick={() => { setActiveRoomId(activeMenuData.roomId); setSelectedChatMobile(activeMenuData.room); setShowChatInfo(true); closeMenu(); }} className="menu-item">
                  <Info className="w-4 h-4 text-ink-2" /> {activeMenuData.room.isGroup ? 'Dados do grupo' : 'Ver perfil'}
                </button>
                <div className="border-t border-line my-1" />
                <button onClick={() => { setRoomToDelete(activeMenuData.room); closeMenu(); }} className="menu-item text-danger">
                  {activeMenuData.room.isGroup ? <LogOut className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                  {activeMenuData.room.isGroup ? 'Sair do grupo' : 'Apagar conversa'}
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
  const senderPrefix = room.isGroup && lastMsg && !mine ? `${(lastMsg.senderName || '').split(' ')[0]}: ` : mine ? 'Você: ' : '';
  const highlight = isActive || unreadCount > 0;

  return (
    <div className="relative group my-0.5">
      {/* Ações ao arrastar para o lado (celular) */}
      <div className="absolute inset-0 md:hidden flex justify-end rounded-md overflow-hidden">
        <button onClick={(e) => { e.stopPropagation(); onOpenMenu(e.currentTarget.getBoundingClientRect()); }} className="w-[70px] bg-ink-3 flex items-center justify-center text-white">
          <MoreHorizontal size={22} />
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
        className={`relative z-10 flex items-center gap-3 px-2 py-2 md:py-1.5 rounded-md cursor-pointer transition-colors ${isActive ? 'bg-hover' : 'bg-subtle hover:bg-hover/60'}`}
        style={{ touchAction: 'pan-y' }}
      >
        <Avatar src={room.avatarUrl} name={room.name} size={isMobile ? 48 : 36} status={presence} square={room.isGroup} />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className={`truncate text-[15px] md:text-sm ${highlight ? 'text-ink font-semibold' : 'text-ink-2 font-medium'}`}>{room.name}</h3>
            <span className="text-[11px] shrink-0 text-ink-3">{lastMsg ? formatListTime(lastMsg.timestamp) : ''}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <p className={`flex-1 min-w-0 flex items-center gap-1 text-[13px] md:text-xs ${unreadCount > 0 ? 'text-ink-2' : 'text-ink-3'}`}>
              {typing.length > 0 ? (
                <span className="text-brand font-medium truncate">digitando...</span>
              ) : (
                <>
                  {mine && !room.isGroup && <ReadIndicator isRead={isRead} size={14} className="shrink-0" />}
                  {p.icon && <p.icon className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{senderPrefix}{p.text}</span>
                </>
              )}
            </p>
            {isMuted && <BellOff className="w-3.5 h-3.5 text-ink-3 shrink-0" />}
            {unreadCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onOpenMenu(e.currentTarget.getBoundingClientRect()); }}
          className="hidden md:flex absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 items-center justify-center rounded-md bg-hover text-ink-3 hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity"
          title="Opções"
        >
          <MoreHorizontal size={16} />
        </button>
      </motion.div>
    </div>
  );
}
