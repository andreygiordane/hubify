import React from 'react';
import { MessageSquare, Video, Calendar, Users, UserPlus, Search, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Avatar from '../ui/Avatar';
import ProfileMenu from './ProfileMenu';
import HeaderNotification from '../common/HeaderNotification';

export const useNavItems = () => {
  const { user } = useAuth();
  const { groupInvites, chatRooms, allMessages, readTimestamps } = useChat();
  const pendingInvites = groupInvites.filter(i => i.toId === user?.id).length;
  const unread = chatRooms.filter(r =>
    (allMessages || []).some(m => m.roomId === r.id && m.senderId !== user?.id && m.timestamp > ((readTimestamps || {})[r.id] || 0))
  ).length;
  return [
    { id: 'chat', icon: MessageSquare, label: 'Chat', badge: unread },
    { id: 'meetings', icon: Video, label: 'Reuniões' },
    { id: 'calendar', icon: Calendar, label: 'Agenda' },
    { id: 'contacts', icon: Users, label: 'Pessoas' },
    { id: 'invitations', icon: UserPlus, label: 'Convites', badge: pendingInvites },
  ];
};

const Badge = ({ value, className = '' }) => value > 0 && (
  <span className={`absolute min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[11px] font-bold flex items-center justify-center ring-[3px] ring-rail ${className}`}>
    {value > 99 ? '99+' : value}
  </span>
);

// Botão "squircle" do trilho: redondo em repouso, quadrado arredondado quando ativo/hover
function RailButton({ active, label, onClick, children, badge }) {
  return (
    <div className="relative w-full flex justify-center group">
      <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-ink transition-all duration-200 ${active ? 'h-10' : 'h-0 group-hover:h-5'}`} />
      <button
        onClick={onClick}
        aria-label={label}
        className={`relative w-12 h-12 flex items-center justify-center transition-all duration-200 ${active ? 'rounded-2xl bg-brand text-white' : 'rounded-3xl bg-surface text-ink-2 hover:rounded-2xl hover:bg-brand hover:text-white'}`}
      >
        {children}
        <Badge value={badge} className="-bottom-1 -right-1" />
      </button>
      <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#111214] text-white text-sm font-semibold px-3 py-1.5 shadow-pop opacity-0 group-hover:opacity-100 transition-opacity z-[150]">
        {label}
      </span>
    </div>
  );
}

export default function Sidebar({ onOpenSearch }) {
  const { currentUserProfile, userStatus } = useAuth();
  const { view, setView, showProfileMenu, setShowProfileMenu, selectedChatMobile } = useChat();
  const items = useNavItems();

  return (
    <>
      {/* Trilho (desktop) */}
      <nav className="hidden md:flex w-[72px] bg-rail flex-col items-center gap-2 py-3 shrink-0">
        <RailButton label="Hubify" onClick={() => setView('chat')}>
          <span className="text-lg font-bold">H</span>
        </RailButton>
        <span className="w-8 h-0.5 rounded bg-line my-1" />
        {items.map(item => (
          <RailButton key={item.id} label={item.label} active={view === item.id} onClick={() => setView(item.id)} badge={item.badge}>
            <item.icon className="w-[22px] h-[22px]" />
          </RailButton>
        ))}

        <div className="flex-1" />

        <RailButton label="Pesquisar (Ctrl+K)" onClick={onOpenSearch}>
          <Search className="w-5 h-5" />
        </RailButton>
        <div className="relative w-full flex justify-center">
          <HeaderNotification variant="rail" />
        </div>
        <RailButton label="Configurações" active={view === 'settings'} onClick={() => setView('settings')}>
          <Settings className="w-5 h-5" />
        </RailButton>
        <div className="relative mt-1">
          <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="rounded-full hover:opacity-90" title="Status e perfil">
            <Avatar src={currentUserProfile?.avatarUrl} name={currentUserProfile?.name} size={40} status={userStatus} />
          </button>
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-[110]" onClick={() => setShowProfileMenu(false)} />
              <ProfileMenu className="absolute left-full bottom-0 ml-3" />
            </>
          )}
        </div>
      </nav>

      {/* Barra inferior (celular) */}
      <div className={`md:hidden fixed bottom-0 inset-x-0 h-16 bg-rail border-t border-line flex items-stretch justify-around z-[100] transition-transform duration-200 ${
        (view === 'chat' && selectedChatMobile) ? 'translate-y-full' : 'translate-y-0'
      }`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {items.map(item => {
          const active = view === item.id;
          return (
            <button key={item.id} onClick={() => setView(item.id)} className={`relative flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium ${active ? 'text-ink' : 'text-ink-3'}`}>
              <span className={`relative px-4 py-1 rounded-full transition-colors ${active ? 'bg-brand-soft text-brand-ink' : ''}`}>
                <item.icon className="w-5 h-5" strokeWidth={active ? 2.25 : 1.75} />
                <Badge value={item.badge} className="-top-1.5 right-1" />
              </span>
              {item.label}
            </button>
          );
        })}
        <div className="relative flex-1 flex">
          <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-ink-3">
            <Avatar src={currentUserProfile?.avatarUrl} name={currentUserProfile?.name} size={26} status={userStatus} />
            Você
          </button>
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-[110]" onClick={() => setShowProfileMenu(false)} />
              <ProfileMenu className="absolute bottom-full right-2 mb-2" />
            </>
          )}
        </div>
      </div>
    </>
  );
}
