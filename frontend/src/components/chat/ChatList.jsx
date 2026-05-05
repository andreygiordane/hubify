import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MessageCircle, 
  Hash,
  ShieldCheck,
  MoreHorizontal,
  MessageSquare,
  Users as UsersIcon,
  X,
  ChevronLeft,
  BellOff,
  Edit,
  Trash2,
  Info,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatList({ 
  chatRooms, 
  activeRoomId, 
  setActiveRoomId, 
  selectedChatMobile,
  readTimestamps, 
  allMessages, 
  user, 
  statusConfig,
  users,
  setShowDMModal,
  setShowGroupModal,
  setSelectedChatMobile,
  groupInvites,
  onViewInvitations,
  mutedRooms,
  handleDeleteRoom,
  setShowChatInfo,
  toggleMuteRoom,
  setRoomToDelete
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuData, setActiveMenuData] = useState(null); // { roomId, rect, room }

  const handleOpenMenu = (roomId, rect, room) => {
    setActiveMenuData({ roomId, rect, room });
  };

  const closeMenu = () => setActiveMenuData(null);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredRooms = chatRooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnreadCount = chatRooms.reduce((acc, room) => {
    return acc + allMessages.filter(m => m.roomId === room.id && m.senderId !== user?.id && m.timestamp > (readTimestamps[room.id] || 0)).length;
  }, 0);

  return (
    <div className={`w-full md:w-[380px] md:max-w-[380px] bg-white border-r border-gray-100 flex flex-col h-full shrink-0 transition-all overflow-hidden ${selectedChatMobile ? 'hidden md:flex' : 'flex'}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Conversas</h2>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowAddMenu(!showAddMenu)}
              className={`p-2 rounded-xl transition-all ${showAddMenu ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}
              title="Novo"
            >
              {showAddMenu ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>

            {showAddMenu && (
              <div className="absolute right-0 top-12 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <button 
                  onClick={() => { setShowDMModal(true); setShowAddMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-600" /> Nova Conversa
                </button>
                <button 
                  onClick={() => { setShowGroupModal(true); setShowAddMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50"
                >
                  <UsersIcon className="w-4 h-4 text-indigo-600" /> Criar Grupo
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conversas..." 
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-11 pr-10 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white outline-none transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Banner de convites restaurado conforme solicitado */}
        {groupInvites?.filter(i => i.toId === user?.id && i.status === 'pending').length > 0 && (
          <div 
            onClick={onViewInvitations}
            className="mt-6 p-4 bg-indigo-600 rounded-2xl cursor-pointer hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 animate-in slide-in-from-top-2 duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                <UsersIcon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white uppercase tracking-wider">Novos Convites</p>
                <p className="text-sm text-indigo-100">Você tem {groupInvites.filter(i => i.toId === user?.id && i.status === 'pending').length} convite(s) pendente(s)</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-white rotate-180" />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 md:pb-6 space-y-2 custom-scrollbar">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center mt-10">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-gray-200" />
             </div>
             <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
               {searchQuery ? 'Nenhum resultado' : 'Nenhuma conversa'}
             </p>
             {!searchQuery && (
               <button onClick={() => setShowDMModal(true)} className="mt-4 text-xs font-bold text-indigo-600 hover:underline">Iniciar novo chat</button>
             )}
          </div>
        ) : (
          filteredRooms.map((room) => (
              <ChatRoomItem 
                key={room.id}
                room={room}
                user={user}
                allMessages={allMessages}
                readTimestamps={readTimestamps}
                activeRoomId={activeRoomId}
                setActiveRoomId={setActiveRoomId}
                setSelectedChatMobile={setSelectedChatMobile}
                statusConfig={statusConfig}
                mutedRooms={mutedRooms}
                handleDeleteRoom={handleDeleteRoom}
                setShowChatInfo={setShowChatInfo}
                toggleMuteRoom={toggleMuteRoom}
                getInitials={getInitials}
                onOpenMenu={handleOpenMenu}
                setRoomToDelete={setRoomToDelete}
              />
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
         <button 
           onClick={() => setShowDMModal(true)}
           className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-600 hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all active:scale-95"
         >
            <Plus className="w-4 h-4 text-indigo-600" /> Nova Conversa Direta
         </button>
      </div>

      {/* GLOBAL POPOVER MENU (THOUGHT CLOUD) */}
      <AnimatePresence>
        {activeMenuData && (() => {
          const menuHeight = 180;
          const isAtTop = activeMenuData.rect.top < 200;
          const topPos = isAtTop ? activeMenuData.rect.bottom + 10 : activeMenuData.rect.top - menuHeight - 10;
          
          return (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-[1000] bg-black/5" 
                onClick={closeMenu}
              />
              
              {/* Menu Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: isAtTop ? -10 : 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: isAtTop ? -10 : 10 }}
                style={{
                  position: 'fixed',
                  top: topPos,
                  left: activeMenuData.rect.left - 180,
                  width: '220px',
                  zIndex: 1001,
                }}
                className="bg-white border border-gray-100 rounded-[2rem] py-2 shadow-2xl"
              >
                <div className="flex flex-col">
                  <button 
                    onClick={() => { toggleMuteRoom(activeMenuData.roomId); closeMenu(); }}
                    className="w-full px-5 py-4 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors rounded-t-[2rem]"
                  >
                    {mutedRooms?.includes(activeMenuData.roomId) ? <Bell size={16} className="text-green-600" /> : <BellOff size={16} className="text-gray-400" />}
                    {mutedRooms?.includes(activeMenuData.roomId) ? 'Ativar notificações' : 'Silenciar notificações'}
                  </button>
                  <button 
                    onClick={() => { setActiveRoomId(activeMenuData.roomId); setSelectedChatMobile(activeMenuData.room); setShowChatInfo(true); closeMenu(); }}
                    className="w-full px-5 py-4 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors border-t border-gray-50"
                  >
                    <Info size={16} className="text-indigo-600" /> Informações
                  </button>
                  <button 
                    onClick={() => { setRoomToDelete(activeMenuData.room); closeMenu(); }}
                    className="w-full px-5 py-4 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors border-t border-gray-50 rounded-b-[2rem]"
                  >
                    <Trash2 size={16} /> {activeMenuData.room.isGroup ? 'Sair do grupo' : 'Excluir conversa'}
                  </button>
                </div>

                {/* Thought Cloud Arrow */}
                <div 
                  className={`absolute ${isAtTop ? '-top-2 border-l border-t' : '-bottom-2 border-r border-b'} right-8 w-4 h-4 bg-white border-gray-100 rotate-45`}
                  style={{ zIndex: -1 }}
                />
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

function ChatRoomItem({ 
  room, user, allMessages, readTimestamps, activeRoomId, setActiveRoomId, 
  setSelectedChatMobile, statusConfig, mutedRooms, handleDeleteRoom, setShowChatInfo, toggleMuteRoom, getInitials,
  onOpenMenu, setRoomToDelete 
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const lastMsg = room ? allMessages.filter(m => m.roomId === room.id).slice(-1)[0] : null;
  const unreadCount = room ? allMessages.filter(m => m.roomId === room.id && m.senderId !== user?.id && m.timestamp > (readTimestamps[room.id] || 0)).length : 0;
  const isActive = room && activeRoomId === room.id;

  if (!room) return null;

  return (
    <div className="relative group">
      {/* Mobile Swipe Actions (Behind the card) */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl md:hidden pointer-events-none">
         <div className="flex w-[140px] h-full ml-auto pointer-events-auto">
             <div className="relative flex-1 flex items-stretch">
               <button 
                 onClick={(e) => { 
                    e.stopPropagation(); 
                    const rect = e.currentTarget.getBoundingClientRect();
                    onOpenMenu(room.id, rect, room);
                 }}
                 className="flex-1 bg-[#007AFF] flex items-center justify-center text-white"
               >
                 <MoreHorizontal size={24} />
               </button>
             </div>
           <button 
             onClick={(e) => { e.stopPropagation(); setRoomToDelete(room); }}
             className="flex-1 bg-[#FF3B30] flex items-center justify-center text-white"
           >
             <Trash2 size={24} />
           </button>
         </div>
      </div>

      <motion.div
        drag={isMobile ? "x" : false}
        dragConstraints={{ left: -140, right: 0 }}
        dragElastic={0.05}
        dragDirectionLock
        dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
        whileTap={isMobile ? { cursor: "grabbing" } : {}}
        onClick={(e) => { 
          setActiveRoomId(room.id); 
          setSelectedChatMobile(room); 
        }}
        className={`relative z-10 flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-colors duration-200 will-change-transform ${
          isActive 
            ? 'bg-indigo-50/90 shadow-sm ring-1 ring-indigo-100' 
            : 'bg-white hover:bg-gray-50'
        }`}
        style={{ touchAction: 'pan-y' }}
      >
        <div className="relative shrink-0">
          <div className={`w-12 h-12 rounded-2xl overflow-hidden shadow-sm transition-transform duration-500 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}>
            {room.isGroup ? (
              room.avatarUrl ? (
                <img src={room.avatarUrl} alt={room.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-400 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                  {getInitials(room.name)}
                </div>
              )
            ) : (
              <img 
                src={room.avatarUrl} 
                alt={room.name} 
                className="w-full h-full object-cover" 
              />
            )}
          </div>

          {!room.isGroup && (
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${(statusConfig || {})[room.status || (room.isOnline ? 'online' : 'offline')]?.color || 'bg-gray-500'}`}></div>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between items-baseline mb-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className={`text-sm font-bold truncate ${isActive ? 'text-indigo-900' : 'text-gray-900'}`}>
                {room.name}
              </h3>
              {room.isGroup && (
                <span className="shrink-0 px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-[8px] font-black rounded-md uppercase tracking-wider">
                  Grupo
                </span>
              )}
              {mutedRooms?.includes(room.id) && <BellOff className="w-3 h-3 text-gray-400 shrink-0" />}
            </div>
            <span className="text-[10px] text-gray-400 font-medium shrink-0">
              {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <p className={`text-[11px] truncate flex-1 flex items-center gap-1 ${isActive ? 'text-indigo-600 font-medium' : unreadCount > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
              {lastMsg ? (lastMsg.senderId === user?.id ? 'Você: ' : '') + lastMsg.text : 'Sem mensagens'}
              {lastMsg?.isEdited && <Edit size={10} className="shrink-0 opacity-60" />}
            </p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="bg-indigo-600 text-white text-[9px] font-black min-w-[18px] h-4.5 rounded-full flex items-center justify-center px-1.5 shadow-lg shadow-indigo-100">
                  {unreadCount}
                </span>
              )}
              
              {/* Desktop More Menu (hidden on mobile swipe) */}
              <div className="relative hidden md:block">
                 <button 
                   onClick={(e) => { 
                      e.stopPropagation(); 
                      const rect = e.currentTarget.getBoundingClientRect();
                      onOpenMenu(room.id, rect, room);
                   }}
                   className="p-1.5 text-gray-300 hover:text-indigo-600 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                 >
                  <MoreHorizontal size={16} />
                 </button>
              </div>
            </div>
          </div>
        </div>
        
        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full shadow-[2px_0_10px_rgba(79,70,229,0.4)]"></div>}
      </motion.div>
    </div>
  );
}

