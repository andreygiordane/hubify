import React from 'react';
import { MessageSquare, Video, Calendar, Users, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Avatar from '../ui/Avatar';
import ProfileMenu from './ProfileMenu';

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

const Badge = ({ value }) => value > 0 && (
  <span className="absolute -top-1 left-1/2 ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-rail">
    {value > 99 ? '99+' : value}
  </span>
);

export default function Sidebar() {
  const { currentUserProfile, userStatus } = useAuth();
  const { view, setView, showProfileMenu, setShowProfileMenu, selectedChatMobile } = useChat();
  const items = useNavItems();

  return (
    <>
      {/* Trilho de apps (desktop) */}
      <nav className="hidden md:flex w-[68px] bg-rail flex-col items-center py-1 shrink-0 border-r border-line">
        {items.map(item => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`relative w-full h-14 flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors group ${active ? 'text-brand font-semibold' : 'text-ink-2 hover:text-brand'}`}
              title={item.label}
            >
              {active && <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r bg-brand" />}
              <span className="relative">
                <item.icon className="w-5 h-5" strokeWidth={active ? 2.25 : 1.75} />
                <Badge value={item.badge} />
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Barra inferior (celular) */}
      <div className={`md:hidden fixed bottom-0 inset-x-0 h-16 bg-surface border-t border-line flex items-stretch justify-around z-[100] transition-transform duration-200 ${
        (view === 'chat' && selectedChatMobile) ? 'translate-y-full' : 'translate-y-0'
      }`}>
        {items.map(item => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 text-[10px] ${active ? 'text-brand font-semibold' : 'text-ink-2'}`}
            >
              <span className="relative">
                <item.icon className="w-6 h-6" strokeWidth={active ? 2.25 : 1.75} />
                <Badge value={item.badge} />
              </span>
              {item.label}
            </button>
          );
        })}
        <div className="relative flex-1 flex">
          <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex-1 flex flex-col items-center justify-center gap-1 text-[10px] text-ink-2">
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
