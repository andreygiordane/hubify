
import React from 'react';
import { X, Video, ArrowRight, Clock } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export default function MeetingToasts() {
  const { meetingNotifications, setMeetingNotifications, handleStartMeeting } = useChat();

  const removeNotification = (id) => {
    setMeetingNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (meetingNotifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[200] flex flex-col gap-3 pointer-events-none">
      {meetingNotifications.map((notif) => (
        <div 
          key={notif.id}
          className="w-80 bg-surface border border-line rounded-lg shadow-pop p-6 pointer-events-auto animate-fade-in slide-in-from-right-full duration-500 overflow-hidden relative group"
        >
          {/* Barra de Progresso de Expiração (Simulada) */}
          <div className="absolute bottom-0 left-0 h-1 bg-brand animate-shrink-width" style={{ animationDuration: '30s' }}></div>
          
          <button 
            onClick={() => removeNotification(notif.id)}
            className="absolute top-4 right-4 p-1.5 text-ink-3 hover:text-ink-2 hover:bg-subtle rounded-full transition-all"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-brand-soft text-brand rounded-lg">
              <Video size={20} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-brand uppercase">{notif.label || 'Inicia em breve'}</p>
              <h4 className="text-sm font-bold text-ink truncate max-w-[180px]">{notif.title}</h4>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-5 text-ink-3">
            <Clock size={14} className="text-ink-3" />
            <span className="text-xs font-bold uppercase">
              {notif.type === 'host_joined' ? 'Já começou' : 
               notif.type === '0m' ? 'Agora' : 
               notif.type === '5m' ? 'Em 5 minutos' : 'Em 10 minutos'}
            </span>
          </div>

          <button 
            onClick={() => {
              handleStartMeeting(`meeting_${notif.id}`);
              removeNotification(notif.id);
            }}
            className="w-full bg-brand text-white py-3.5 rounded-lg font-semibold text-xs uppercase hover:bg-brand-hover transition-all shadow-card flex items-center justify-center gap-2"
          >
            Entrar na Chamada <ArrowRight size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
