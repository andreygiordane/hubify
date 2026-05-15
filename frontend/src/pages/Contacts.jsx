import React, { useState, useEffect } from 'react';
import { Search, Users, MessageSquare, Phone, Video, X, Mail, Briefcase, Info, Clock } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import HeaderNotification from '../components/common/HeaderNotification';

export default function Contacts() {
  const { 
    users, startConversation, handleStartMeeting, handleStartAudioCall,
    statusConfig 
  } = useChat();
  const { user } = useAuth();
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="flex-1 flex flex-col bg-[#FDFDFD] overflow-hidden animate-in fade-in duration-300">
      {/* Header */}
      <div className="h-16 px-4 md:px-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
             <Users className="w-5 h-5" />
           </div>
           <h2 className="text-lg font-bold text-slate-900">Equipe</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative max-w-xs w-full hidden lg:block mr-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-slate-100 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
            />
          </div>

           <div className="flex items-center text-slate-400 text-[10px] md:text-sm font-semibold gap-2 bg-slate-50 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-slate-100">
              <Clock size={14} className="text-indigo-600 md:w-4 md:h-4" />
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
           </div>
           <HeaderNotification />
        </div>
      </div>

      {/* Grid de Contatos */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F8FAFC] pb-24 md:pb-8">
         <div className="max-w-7xl mx-auto">
            <div className="mb-8">
               <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Membros da Equipe</h3>
               <p className="text-sm text-slate-500 font-medium">Hubify • {users.length} membros cadastrados</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredUsers.map(u => (
                <div 
                  key={u.id}
                  onClick={() => setSelectedContact(u)}
                  className="bg-white p-4 rounded-2xl border border-slate-100 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex items-center gap-4 shadow-sm"
                >
                  <div className="relative shrink-0">
                    <img 
                      src={u.avatarUrl || "/image/sem_foto.avif"} 
                      alt={u.name} 
                      className="w-12 h-12 rounded-xl bg-slate-100 object-cover border-2 border-white shadow-sm" 
                    />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${statusConfig[u.status || (u.isOnline ? 'online' : 'offline')]?.color || 'bg-gray-400'}`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors text-sm">
                      {u.name} {u.id === user?.id && <span className="text-indigo-400 font-medium">(Você)</span>}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider truncate">{u.role || 'Membro'}</p>
                  </div>
                </div>
              ))}
            </div>
         </div>
      </div>

      {/* Modal de Detalhes do Contato */}
      {selectedContact && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedContact(null)} />
          
          <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 border border-slate-100">
            {/* Cover Color */}
            <div className="h-32 bg-gradient-to-tr from-indigo-600 to-violet-500 w-full relative">
              <button 
                onClick={() => setSelectedContact(null)}
                className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="px-8 pb-8 -mt-16">
              <div className="relative inline-block mb-6">
                <img 
                  src={selectedContact.avatarUrl || "/image/sem_foto.avif"} 
                  className="w-32 h-32 rounded-[2.5rem] border-8 border-white shadow-xl bg-white object-cover" 
                />
                <div className={`absolute bottom-2 right-2 w-7 h-7 border-4 border-white rounded-full ${statusConfig[selectedContact.status || (selectedContact.isOnline ? 'online' : 'offline')]?.color || 'bg-gray-400'}`}></div>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{selectedContact.name}</h3>
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
                  <Briefcase className="w-3 h-3" />
                  {selectedContact.role || 'Membro da Equipe'}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Corporativo</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{selectedContact.email || 'Não informado'}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <Info className="w-4 h-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Sobre</p>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {selectedContact.bio || 'Este usuário faz parte da equipe Hubify e está disponível para colaboração.'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => handleAction('chat', selectedContact.id)}
                  className="flex flex-col items-center justify-center p-4 bg-indigo-50 text-indigo-600 rounded-3xl hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-200 transition-all group"
                >
                  <MessageSquare className="w-6 h-6 mb-1 transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-bold uppercase">Mensagem</span>
                </button>
                
                <button 
                  onClick={() => handleAction('audio', selectedContact.id)}
                  className="flex flex-col items-center justify-center p-4 bg-emerald-50 text-emerald-600 rounded-3xl hover:bg-emerald-600 hover:text-white hover:shadow-lg hover:shadow-emerald-200 transition-all group"
                >
                  <Phone className="w-6 h-6 mb-1 transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-bold uppercase">Ligar</span>
                </button>
                
                <button 
                  onClick={() => handleAction('video', selectedContact.id)}
                  className="flex flex-col items-center justify-center p-4 bg-blue-50 text-blue-600 rounded-3xl hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-200 transition-all group"
                >
                  <Video className="w-6 h-6 mb-1 transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-bold uppercase">Vídeo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
