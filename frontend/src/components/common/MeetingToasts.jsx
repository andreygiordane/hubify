
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
          className="w-80 bg-white border border-slate-100 rounded-[2rem] shadow-2xl p-6 pointer-events-auto animate-in slide-in-from-right-full duration-500 overflow-hidden relative group"
        >
          {/* Barra de Progresso de Expiração (Simulada) */}
          <div className="absolute bottom-0 left-0 h-1 bg-indigo-600 animate-shrink-width" style={{ animationDuration: '30s' }}></div>
          
          <button 
            onClick={() => removeNotification(notif.id)}
            className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Video size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{notif.label || 'Inicia em breve'}</p>
              <h4 className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{notif.title}</h4>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-5 text-slate-400">
            <Clock size={14} className="text-slate-300" />
            <span className="text-xs font-bold uppercase tracking-widest">
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
            className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
          >
            Entrar na Chamada <ArrowRight size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
