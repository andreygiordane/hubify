
import React, { useState, useEffect } from 'react';
import { Video, Plus, Calendar, Clock, ArrowRight } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import HeaderNotification from '../components/common/HeaderNotification';

export default function Meetings() {
  const { handleStartMeeting, setView } = useChat();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const handleStartCall = async () => {
    // Gerar um ID de sala aleatório ou usar o padrão
    const roomId = `meeting_${Date.now()}`;
    await handleStartMeeting(roomId);
  };

  // --- TELA INICIAL (DASHBOARD RESPONSIVO) ---
  return (
    <div className="flex flex-col min-h-screen bg-white text-[#1a1c21] font-sans w-full overflow-hidden">
      
      {/* HEADER SUPERIOR */}
      <header className="h-16 bg-white border-b border-slate-100 px-4 md:px-10 flex items-center justify-between sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Video size={18} />
          </div>
          <h1 className="font-bold text-base md:text-lg text-slate-800 tracking-tight">Reuniões</h1>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center text-slate-400 text-[10px] md:text-sm font-semibold gap-2 bg-slate-50 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-slate-100">
              <Clock size={14} className="text-indigo-600 md:w-4 md:h-4" />
              <span>{formatTime(currentTime)}</span>
              <span className="hidden sm:inline opacity-20">•</span>
              <span className="hidden sm:inline">{formatDate(currentTime)}</span>
           </div>
           <HeaderNotification />
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-white">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-12 md:py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          {/* LADO ESQUERDO: AÇÃO PRINCIPAL */}
          <section className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-left-8 duration-700 text-center lg:text-left">
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-[42px] sm:text-[64px] md:text-[88px] leading-[0.95] text-slate-900 font-black tracking-tighter">
                Reunião
              </h2>
              <p className="text-base md:text-xl text-slate-500 max-w-md mx-auto lg:mx-0 leading-relaxed font-medium px-4 md:px-0">
                Conecte-se instantaneamente com seu time através de chamadas de vídeo em alta definição.
              </p>
            </div>

            {/* Botão de Criação Premium */}
            <div className="pt-2">
              <button 
                onClick={handleStartCall}
                className="group relative w-full sm:w-auto overflow-hidden bg-indigo-600 text-white px-8 md:px-12 py-5 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-lg md:text-xl transition-all hover:scale-[1.03] active:scale-95 shadow-2xl shadow-indigo-200"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center justify-center gap-3 md:gap-4">
                  <Plus size={24} className="md:w-7 md:h-7" strokeWidth={3} />
                  Criar reunião
                </span>
              </button>
            </div>
          </section>

          {/* LADO DIREITO: CARD DE AGENDA REFINADO */}
          <section className="flex flex-col items-center justify-center animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="w-full max-w-[480px] bg-white rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-[0_20px_40px_-10px_rgba(79,70,229,0.08)] md:shadow-[0_40px_80px_-20px_rgba(79,70,229,0.12)] overflow-hidden flex flex-col">
               <div className="p-8 md:p-10 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-slate-900">Agenda</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Próximos compromissos</p>
                  </div>
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <Calendar className="text-indigo-600" size={24} />
                  </div>
               </div>

               <div className="p-6 md:p-8 space-y-4 max-h-[400px] overflow-y-auto">
                  <MeetingList />
               </div>

               <div className="p-6 bg-slate-50/50 border-t border-slate-50">
                  <button 
                    onClick={() => setView('calendar')}
                    className="w-full py-4 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                  >
                    Ver calendário completo <ArrowRight size={14} />
                  </button>
               </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function MeetingList() {
  const { meetings, handleStartMeeting } = useChat();
  
  // Filtrar apenas reuniões (ignorar lembretes)
  const todayMeetings = meetings.filter(m => m.type === 'meeting').sort((a, b) => new Date(a.date) - new Date(b.date));

  if (todayMeetings.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
           <Clock className="text-slate-200" size={24} />
        </div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhuma reunião agendada</p>
      </div>
    );
  }

  return todayMeetings.map((m) => {
    const isOngoing = m.status === 'ongoing';
    return (
      <div key={m.id} className={`group flex items-center gap-4 p-4 rounded-3xl transition-all border ${isOngoing ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' : 'hover:bg-slate-50 border-transparent hover:border-slate-100'}`}>
        <div className={`flex flex-col items-center justify-center min-w-[60px] h-[60px] rounded-2xl font-black ${isOngoing ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-indigo-50 text-indigo-600'}`}>
          <span className={`text-[10px] uppercase tracking-tighter ${isOngoing ? 'text-indigo-100' : 'opacity-60'}`}>Horário</span>
          <span className="text-sm">{new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-800 text-sm truncate mb-1">{m.title}</h4>
          <div className="flex items-center gap-1.5">
             <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOngoing ? 'bg-green-500' : 'bg-slate-300'}`}></div>
             <span className={`text-[10px] font-black uppercase tracking-widest ${isOngoing ? 'text-indigo-600' : 'text-slate-400'}`}>
               {isOngoing ? 'Reunião em andamento' : 'Pronto para iniciar'}
             </span>
          </div>
          {isOngoing && <p className="text-[9px] font-bold text-slate-400 mt-0.5">Você já pode entrar!</p>}
        </div>
        <button 
          onClick={() => handleStartMeeting(`meeting_${m.id}`)}
          className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-sm transition-all ${
            isOngoing 
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' 
              : 'bg-white text-indigo-600 border border-slate-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
          }`}
        >
          <ArrowRight size={18} />
        </button>
      </div>
    );
  });
}
