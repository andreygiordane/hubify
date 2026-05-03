import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MessageCircle, 
  Hash,
  ShieldCheck,
  MoreVertical,
  MessageSquare,
  Users as UsersIcon,
  X,
  ChevronLeft,
  BellOff
} from 'lucide-react';

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
  mutedRooms
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredRooms = chatRooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnreadCount = chatRooms.reduce((acc, room) => {
    return acc + allMessages.filter(m => m.roomId === room.id && m.senderId !== user.id && m.timestamp > (readTimestamps[room.id] || 0)).length;
  }, 0);

  return (
    <div className={`w-full md:w-[380px] md:max-w-[380px] bg-white border-r border-gray-100 flex flex-col h-full shrink-0 transition-all overflow-hidden ${selectedChatMobile ? 'hidden md:flex' : 'flex'}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Conversas</h2>
            {totalUnreadCount > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                {totalUnreadCount}
              </span>
            )}
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

        {groupInvites?.filter(i => i.toId === user?.id).length > 0 && (
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
                <p className="text-sm text-indigo-100">Você tem {groupInvites.filter(i => i.toId === user?.id).length} convite(s) pendente(s)</p>
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
          filteredRooms.map((room) => {
            const lastMsg = allMessages.filter(m => m.roomId === room.id).slice(-1)[0];
            const unreadCount = allMessages.filter(m => m.roomId === room.id && m.senderId !== user.id && m.timestamp > (readTimestamps[room.id] || 0)).length;
            const isActive = activeRoomId === room.id;

            return (
              <div
                key={room.id}
                onClick={() => { setActiveRoomId(room.id); setSelectedChatMobile(room); }}
                className={`group flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-300 relative ${
                  isActive 
                    ? 'bg-indigo-50/80 shadow-sm ring-1 ring-indigo-100' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-14 h-14 rounded-2xl overflow-hidden shadow-sm transition-transform duration-500 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}>
                    {room.isGroup ? (
                      <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-400 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                        {getInitials(room.name)}
                      </div>
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
                  {room.isGroup && (
                    <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-lg shadow-sm">
                      <Hash className="w-2.5 h-2.5 text-indigo-500 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`text-sm font-bold truncate flex items-center gap-1.5 ${isActive ? 'text-indigo-900' : 'text-gray-900'}`}>
                      {room.name}
                      {mutedRooms?.includes(room.id) && <BellOff className="w-3 h-3 text-gray-400" />}
                    </h3>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-xs truncate ${isActive ? 'text-indigo-600 font-medium' : unreadCount > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                      {lastMsg ? (lastMsg.senderId === user.id ? 'Você: ' : '') + lastMsg.text : 'Sem mensagens'}
                    </p>
                    {unreadCount > 0 && (
                      <span className="bg-indigo-600 text-white text-[10px] font-black min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 shadow-lg shadow-indigo-100 animate-in zoom-in duration-300">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full shadow-[2px_0_10px_rgba(79,70,229,0.4)]"></div>}
              </div>
            );
          })
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
    </div>
  );
}

