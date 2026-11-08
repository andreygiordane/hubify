import React from 'react';
import { User as UserIcon, LogOut, Sun, Moon, Monitor, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../theme';
import Avatar, { PRESENCE } from '../ui/Avatar';

const STATUS_OPTIONS = ['online', 'ocupado', 'reuniao', 'ausente', 'offline'];
const THEMES = [
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Escuro', icon: Moon },
  { id: 'system', label: 'Sistema', icon: Monitor },
];

// Menu do perfil: presença, tema, configurações e sair
export default function ProfileMenu({ className = '' }) {
  const { currentUserProfile, userStatus, setUserStatus, logout } = useAuth();
  const { setView, setShowProfileMenu } = useChat();
  const [theme, setTheme] = useTheme();
  const close = () => setShowProfileMenu(false);

  return (
    <div className={`menu w-72 z-[120] ${className}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar src={currentUserProfile?.avatarUrl} name={currentUserProfile?.name} size={44} status={userStatus} />
        <div className="min-w-0">
          <p className="font-semibold text-ink truncate">{currentUserProfile?.name || 'Usuário'}</p>
          <p className="text-xs text-ink-2 truncate">{currentUserProfile?.email || currentUserProfile?.username}</p>
        </div>
      </div>

      <div className="border-t border-line my-1" />
      <p className="px-4 pt-2 pb-1 section-title">Status</p>
      {STATUS_OPTIONS.map(id => (
        <button key={id} onClick={() => { setUserStatus(id); close(); }} className="menu-item px-4">
          <span className={`w-2.5 h-2.5 rounded-full ${PRESENCE[id].color}`} />
          <span className="flex-1">{PRESENCE[id].label}</span>
          {userStatus === id && <Check className="w-4 h-4 text-brand" />}
        </button>
      ))}

      <div className="border-t border-line my-1" />
      <p className="px-4 pt-2 pb-1 section-title">Aparência</p>
      <div className="flex gap-1 px-3 pb-2">
        {THEMES.map(t => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-md text-xs border transition-colors ${theme === t.id ? 'border-brand bg-brand-soft text-brand-ink font-semibold' : 'border-line text-ink-2 hover:bg-hover'}`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="border-t border-line my-1" />
      <button onClick={() => { setView('settings'); close(); }} className="menu-item px-4">
        <UserIcon className="w-4 h-4 text-ink-2" /> Perfil e segurança
      </button>
      <button onClick={logout} className="menu-item px-4 text-danger">
        <LogOut className="w-4 h-4" /> Sair
      </button>
    </div>
  );
}
