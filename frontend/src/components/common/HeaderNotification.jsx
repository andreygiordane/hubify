
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Clock, Calendar, ArrowRight, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export default function HeaderNotification() {
  const { meetings, setView, handleStartMeeting } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const today = new Date();
  const upcomingMeetings = meetings.filter(m => {
    if (m.type !== 'meeting') return false;
    const d = new Date(m.date);
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear() &&
           d.getTime() > today.getTime();
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full transition-all relative ${isOpen ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
      >
        <Bell size={20} className={upcomingMeetings.length > 0 ? 'animate-swing' : ''} />
        {upcomingMeetings.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
            {upcomingMeetings.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-5 border-b border-slate-50 bg-slate-50/50">
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
              <Calendar size={16} className="text-indigo-600" /> Próximas Reuniões
            </h3>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            {upcomingMeetings.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tudo limpo por hoje!</p>
              </div>
            ) : (
              upcomingMeetings.map(m => (
                <div key={m.id} className="p-4 border-b border-slate-50 hover:bg-indigo-50/30 transition-all group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2 truncate">{m.title}</h4>
                  <button 
                    onClick={() => {
                      handleStartMeeting(`meeting_${m.id}`);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-1 text-[10px] font-black text-indigo-600 uppercase tracking-tighter group-hover:gap-2 transition-all"
                  >
                    Entrar agora <ArrowRight size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
          
          <button 
            onClick={() => { setView('calendar'); setIsOpen(false); }}
            className="w-full p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-all"
          >
            Ver agenda completa
          </button>
        </div>
      )}
    </div>
  );
}
