
import React, { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  UserPlus, 
  Lock, 
  Unlock, 
  X, 
  Check,
  Search,
  ArrowRight,
  Filter,
  CalendarDays,
  ShieldCheck,
  Video as VideoIcon,
  Edit2,
  Trash2,
  AlertCircle
} from "lucide-react";
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import HeaderNotification from '../components/common/HeaderNotification';

const Calendar = () => {
  const { 
    meetings, users, setView, handleCreateMeeting, 
    newMeetingTitle, setNewMeetingTitle, 
    newMeetingDate, setNewMeetingDate,
    calendarItemType, setCalendarItemType,
    selectedInvitees, setSelectedInvitees,
    handleDeleteMeeting, openEditMeeting,
    showCalendarModal, setShowCalendarModal,
    handleStartMeeting, editingMeetingId, setEditingMeetingId
  } = useChat();
  
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonthCount = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = Array.from({ length: daysInMonthCount }, (_, i) => i + 1);
  
  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });

  const eventsOfSelectedDay = meetings.filter(m => {
    const d = new Date(m.date);
    return d.getDate() === selectedDay && d.getMonth() === month && d.getFullYear() === year;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const toggleParticipant = (userId) => {
    if (selectedInvitees.includes(userId)) {
      setSelectedInvitees(selectedInvitees.filter(id => id !== userId));
    } else {
      setSelectedInvitees([...selectedInvitees, userId]);
    }
  };

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + offset)));
  };

  const handleCloseModal = () => {
    setShowCalendarModal(false);
    setEditingMeetingId(null);
    setNewMeetingTitle('');
    setNewMeetingDate('');
    setSelectedInvitees([]);
    setCalendarItemType('meeting');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 text-slate-900 font-sans w-full overflow-hidden">
      
      {/* HEADER SUPERIOR */}
      <header className="h-16 bg-white border-b border-slate-100 px-4 md:px-10 flex items-center justify-between sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <CalendarIcon size={18} />
          </div>
          <h1 className="font-bold text-base md:text-lg text-slate-800 tracking-tight">Agenda</h1>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center text-slate-400 text-[10px] md:text-sm font-semibold gap-2 bg-slate-50 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-slate-100">
              <Clock size={14} className="text-indigo-600 md:w-4 md:h-4" />
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
           </div>
           <HeaderNotification />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* CALENDÁRIO */}
          <section className="lg:col-span-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-50 relative overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-8 md:mb-12">
                <div>
                  <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter capitalize">{monthName} {year}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronização Hubify</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}T09:00`;
                      setNewMeetingDate(dateStr);
                      setShowCalendarModal(true);
                    }}
                    className="p-2 md:p-3 bg-indigo-600 text-white rounded-xl md:rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    <Plus size={20} className="md:w-6 md:h-6" strokeWidth={3} />
                  </button>
                  <button 
                    onClick={() => changeMonth(-1)}
                    className="p-2 md:p-3 bg-slate-50 text-slate-400 rounded-xl md:rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100"
                  >
                    <ChevronLeft size={20} className="md:w-6 md:h-6" />
                  </button>
                  <button 
                    onClick={() => changeMonth(1)}
                    className="p-2 md:p-3 bg-slate-50 text-slate-400 rounded-xl md:rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100"
                  >
                    <ChevronRight size={20} className="md:w-6 md:h-6" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 md:gap-4 lg:gap-6">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => (
                  <div key={`head-${i}`} className="text-center text-[9px] md:text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2 md:mb-4">
                    {d}
                  </div>
                ))}
                
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}

                {daysInMonth.map(day => {
                  const dayEvents = meetings.filter(m => {
                    const d = new Date(m.date);
                    return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
                  });
                  const isSelected = selectedDay === day;
                  const hasMeeting = dayEvents.some(e => e.type === 'meeting');
                  const hasReminder = dayEvents.some(e => e.type === 'reminder');
                  const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

                  return (
                    <button 
                      key={`day-cell-${day}`}
                      onClick={() => setSelectedDay(day)}
                      className={`group relative aspect-square flex flex-col items-center justify-center rounded-xl md:rounded-[2rem] transition-all duration-300 ${
                        isSelected 
                        ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-200 scale-105 md:scale-110 z-10" 
                        : isToday ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className={`text-xs md:text-lg font-black ${isSelected ? "text-white" : isToday ? "text-indigo-600" : "text-slate-800"}`}>
                        {day}
                      </span>
                      
                      {dayEvents.length > 0 && !isSelected && (
                        <div className="absolute bottom-1 md:bottom-4 flex gap-0.5 md:gap-1">
                          {hasMeeting && <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-indigo-500"></div>}
                          {hasReminder && <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-amber-400"></div>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-50 rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
            </div>
          </section>

          {/* TIMELINE DE COMPROMISSOS */}
          <section className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-50 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-[0.8rem]">
                    <CalendarDays size={18} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase text-[12px]">Compromissos</h3>
                </div>
              </div>

              <div className="flex-1 space-y-4 relative">
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100 rounded-full"></div>

                {eventsOfSelectedDay.length > 0 ? (
                  eventsOfSelectedDay.map(event => {
                    const isMeeting = event.type === 'meeting';
                    return (
                      <div key={event.id} className="relative pl-10 group">
                        <div className={`absolute left-[14px] top-1.5 w-3 h-3 bg-white border-[3px] rounded-full z-10 ${isMeeting ? 'border-indigo-600' : 'border-amber-500'}`}></div>
                        
                        <div className={`p-4 rounded-[1.8rem] transition-all border duration-300 ${
                          isMeeting 
                          ? "bg-indigo-50/30 border-indigo-50 hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5" 
                          : "bg-amber-50/30 border-amber-50 hover:bg-white hover:border-amber-100 hover:shadow-xl hover:shadow-amber-500/5"
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[9px] font-black uppercase tracking-widest bg-white px-2 py-1 rounded-lg shadow-sm border ${isMeeting ? 'text-indigo-600 border-indigo-50' : 'text-amber-600 border-amber-50'}`}>
                              {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="flex gap-2">
                              <button onClick={() => openEditMeeting(event)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 size={12} /></button>
                              <button onClick={() => handleDeleteMeeting(event.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={12} /></button>
                            </div>
                          </div>
                          
                          <h4 className="font-bold text-slate-800 text-base mb-2 leading-tight">{event.title}</h4>
                          
                          <div className={`flex items-center gap-1.5 text-[9px] mb-3 font-black uppercase tracking-tighter w-fit px-2 py-0.5 rounded-md ${isMeeting ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                            {isMeeting ? <><ShieldCheck size={10} /> <span>Reunião Hubify</span></> : <><AlertCircle size={10} /> <span>Lembrete Pessoal</span></>}
                          </div>
                          
                          {isMeeting && (
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100/50">
                              <div className="flex items-center gap-1.5">
                                 <div className="flex -space-x-1.5">
                                    {event.participants?.slice(0, 3).map((pId, i) => {
                                      const u = users.find(x => x.id === pId);
                                      return (
                                        <div key={i} className="w-7 h-7 rounded-full bg-white border border-slate-100 shadow-sm overflow-hidden" title={u?.name}>
                                          <img src={u?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"} alt="Avatar" />
                                        </div>
                                      );
                                    })}
                                    {event.participants?.length > 3 && (
                                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                        +{event.participants.length - 3}
                                      </div>
                                    )}
                                 </div>
                              </div>
                              <button 
                                onClick={() => handleStartMeeting(`meeting_${event.id}`)}
                                className="p-1.5 bg-indigo-600 rounded-lg shadow-sm text-white hover:bg-indigo-700 transition-all flex items-center gap-1.5 px-3"
                              >
                                <span className="text-[10px] font-black uppercase">Entrar</span>
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-30 py-16 text-center">
                    <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center mb-4 text-slate-400">
                      <Clock size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Nada planejado</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* MODAL DE AGENDAMENTO */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8 md:mb-10">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900">{editingMeetingId ? 'Editar Compromisso' : 'Agendar Reunião'}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Sincronização Hubify</p>
              </div>
              <button onClick={handleCloseModal} className="p-2 md:p-3 bg-slate-50 rounded-xl md:rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"><X size={20} className="md:w-6 md:h-6" /></button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assunto / Título</label>
                <input 
                  required 
                  autoFocus 
                  placeholder="Ex: Planejamento Mensal" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all font-bold text-slate-800" 
                  value={newMeetingTitle} 
                  onChange={e => setNewMeetingTitle(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data e Horário</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="datetime-local" 
                      className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold text-sm" 
                      value={newMeetingDate} 
                      onChange={e => setNewMeetingDate(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                  <button 
                    type="button" 
                    onClick={() => setCalendarItemType(calendarItemType === 'meeting' ? 'reminder' : 'meeting')} 
                    className={`w-full h-[58px] rounded-xl md:rounded-2xl border flex items-center justify-center gap-2 transition-all font-black text-[10px] uppercase ${calendarItemType === 'meeting' ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}
                  >
                    {calendarItemType === 'meeting' ? <><Unlock size={14} /> Reunião</> : <><Lock size={14} /> Lembrete</>}
                  </button>
                </div>
              </div>

              {calendarItemType === 'meeting' && (
                <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Convidar Pessoas</label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100">
                    {users.filter(u => u.id !== user?.id).map(u => {
                      const isSelected = selectedInvitees.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleParticipant(u.id)}
                          className={`flex items-center gap-2 p-1.5 pr-3 rounded-full border transition-all ${isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-400"}`}
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100">
                            <img src={u.avatarUrl} alt={u.name} />
                          </div>
                          <span className="text-[10px] font-bold">{u.name}</span>
                          {isSelected && <Check size={10} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button 
                type="submit"
                className={`w-full text-white py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black text-base md:text-lg shadow-2xl transition-all flex items-center justify-center gap-3 mt-4 ${
                  calendarItemType === 'meeting' ? 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700' : 'bg-amber-500 shadow-amber-200 hover:bg-amber-600'
                }`}
              >
                <ShieldCheck size={24} strokeWidth={3} /> {editingMeetingId ? 'Salvar Alterações' : 'Salvar e Notificar'}
              </button>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Calendar;
