
import React from 'react';
import { 
  MessageSquare, Video, Calendar, Users, Settings, LogOut, 
  User as UserIcon, ChevronDown, UserPlus 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

export default function Sidebar() {
  const { user, currentUserProfile, userStatus, setUserStatus, logout } = useAuth();
  const { view, setView, activeRoomId, groups, showProfileMenu, setShowProfileMenu, setShowEditProfileModal, setShowSecurityModal, statusConfig, groupInvites, selectedChatMobile } = useChat();

  const pendingInvitesCount = groupInvites.filter(i => i.toId === user?.id).length;


  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-slate-900 flex-col h-full shrink-0 transition-all duration-300">
        <div className="p-6 flex items-center">
          <img src="/image/logo.png" alt="Hubify" className="h-10 w-auto object-contain" />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { id: 'chat', icon: MessageSquare, label: 'Mensagens' },
            { id: 'meetings', icon: Video, label: 'Reuniões' },
            { id: 'calendar', icon: Calendar, label: 'Agenda' },
            { id: 'contacts', icon: Users, label: 'Contatos' },
            { id: 'invitations', icon: UserPlus, label: 'Convites', badge: pendingInvitesCount },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 group relative ${
                view === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${view === item.id ? 'scale-110' : 'group-hover:scale-110 transition-transform'}`} />
              <span className="font-semibold text-sm">{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-800 transition-all group"
            >
              <div className="relative shrink-0">
                <img 
                  src={currentUserProfile?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-xl bg-slate-700 object-cover" 
                />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-slate-900 rounded-full ${statusConfig[userStatus]?.color || 'bg-gray-500'}`}></div>
              </div>
              <div className="text-left flex-1 overflow-hidden">
                <p className="text-sm font-bold text-slate-100 truncate">{currentUserProfile?.name || 'Usuário'}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{statusConfig[userStatus]?.label || 'Offline'}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {showProfileMenu && (
              <ProfileDropdown 
                userStatus={userStatus} 
                setUserStatus={setUserStatus} 
                setShowProfileMenu={setShowProfileMenu} 
                setShowEditProfileModal={setShowEditProfileModal}
                setShowSecurityModal={setShowSecurityModal}
                logout={logout}
                statusConfig={statusConfig}
                isMobile={false}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-4 z-[100] pb-safe transition-all duration-300 ${
        (view === 'chat' && selectedChatMobile) ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}>
        {[
          { id: 'chat', icon: MessageSquare, label: 'Chat' },
          { id: 'meetings', icon: Video, label: 'Calls' },
          { id: 'calendar', icon: Calendar, label: 'Agenda' },
          { id: 'contacts', icon: Users, label: 'Membros' },
          { id: 'invitations', icon: UserPlus, label: 'Convites', badge: pendingInvitesCount },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center gap-1 transition-all relative ${
              view === item.id ? 'text-indigo-400' : 'text-slate-500'
            }`}
          >
            <item.icon className={`w-6 h-6 ${view === item.id ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-medium">{item.label}</span>
            {item.badge > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-bold text-white">
                {item.badge}
              </span>
            )}
          </button>
        ))}

        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex flex-col items-center gap-1"
          >
            <div className="relative">
              <img 
                src={currentUserProfile?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"} 
                alt="Avatar" 
                className="w-7 h-7 rounded-lg bg-slate-700 object-cover" 
              />
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-slate-900 rounded-full ${statusConfig[userStatus]?.color || 'bg-gray-500'}`}></div>
            </div>
            <span className="text-[10px] font-medium text-slate-500">Perfil</span>
          </button>

          {showProfileMenu && (
            <ProfileDropdown 
              userStatus={userStatus} 
              setUserStatus={setUserStatus} 
              setShowProfileMenu={setShowProfileMenu} 
              setShowEditProfileModal={setShowEditProfileModal}
              setShowSecurityModal={setShowSecurityModal}
              logout={logout}
              statusConfig={statusConfig}
              isMobile={true}
            />
          )}
        </div>
      </div>
    </>
  );
}

function ProfileDropdown({ userStatus, setUserStatus, setShowProfileMenu, setShowEditProfileModal, setShowSecurityModal, logout, statusConfig, isMobile }) {
  return (
    <div className={`absolute ${isMobile ? 'bottom-full right-0 mb-4 w-56' : 'bottom-full left-0 w-full mb-4'} bg-[#1e293b] border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden z-[110] animate-in fade-in slide-in-from-bottom-2 duration-200 backdrop-blur-xl`}>
       <div className="p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 mt-1">Alterar Status</p>
          
          <div className="space-y-1 mb-3">
            {[
              { id: 'online', label: 'Online', color: 'bg-green-500' },
              { id: 'offline', label: 'Offline', color: 'bg-gray-500' },
              { id: 'ausente', label: 'Ausente', color: 'bg-yellow-500' },
              { id: 'reuniao', label: 'Em Reunião', color: 'bg-blue-500' },
              { id: 'ocupado', label: 'Ocupado', color: 'bg-red-500' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setUserStatus(s.id);
                  setShowProfileMenu(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                  userStatus === s.id ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${s.color}`}></div>
                <span className="font-medium">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="h-px bg-slate-700/50 mx-2 mb-2"></div>

          <button 
            onClick={() => {
              setShowEditProfileModal(true);
              setShowProfileMenu(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-slate-700/50 transition-all mb-1"
          >
            <UserIcon className="w-4 h-4 text-slate-400" /> Editar Perfil
          </button>

          <button 
            onClick={() => {
              setShowSecurityModal(true);
              setShowProfileMenu(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-slate-700/50 transition-all mb-1"
          >
            <Settings className="w-4 h-4 text-slate-400" /> Segurança
          </button>
          
          <div className="h-px bg-slate-700/50 mx-2 my-2"></div>

          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" /> Sair da conta
          </button>
       </div>
    </div>
  );
}
