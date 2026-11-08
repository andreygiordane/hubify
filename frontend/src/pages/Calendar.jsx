
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
import Avatar from '../components/ui/Avatar';
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
    <div className="flex-1 flex flex-col h-full bg-subtle text-ink font-sans w-full overflow-hidden">
      
      {/* HEADER SUPERIOR */}
      <header className="h-16 bg-surface border-b border-line px-4 md:px-10 flex items-center justify-between sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-soft text-brand rounded-lg">
            <CalendarIcon size={18} />
          </div>
          <h1 className="font-bold text-base md:text-lg text-ink tracking-tight">Agenda</h1>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center text-ink-3 text-[10px] md:text-sm font-semibold gap-2 bg-subtle px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-line">
              <Clock size={14} className="text-brand md:w-4 md:h-4" />
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
           </div>
           <HeaderNotification />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* CALENDÁRIO */}
          <section className="lg:col-span-8 animate-fade-in duration-700">
            <div className="bg-surface rounded-lg md:rounded-lg p-6 md:p-8 shadow-card border border-line relative overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-8 md:mb-12">
                <div>
                  <h2 className="text-2xl md:text-4xl font-semibold text-ink capitalize">{monthName} {year}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 bg-brand rounded-full"></span>
                    <p className="text-[10px] font-bold text-ink-3 uppercase">Sincronização Hubify</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}T09:00`;
                      setNewMeetingDate(dateStr);
                      setShowCalendarModal(true);
                    }}
                    className="p-2 md:p-3 bg-brand text-white rounded-md md:rounded-lg hover:bg-brand-hover transition-all shadow-card"
                  >
                    <Plus size={20} className="md:w-6 md:h-6" strokeWidth={3} />
                  </button>
                  <button 
                    onClick={() => changeMonth(-1)}
                    className="p-2 md:p-3 bg-subtle text-ink-3 rounded-md md:rounded-lg hover:bg-brand-soft hover:text-brand transition-all border border-line"
                  >
                    <ChevronLeft size={20} className="md:w-6 md:h-6" />
                  </button>
                  <button 
                    onClick={() => changeMonth(1)}
                    className="p-2 md:p-3 bg-subtle text-ink-3 rounded-md md:rounded-lg hover:bg-brand-soft hover:text-brand transition-all border border-line"
                  >
                    <ChevronRight size={20} className="md:w-6 md:h-6" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 md:gap-4 lg:gap-6">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => (
                  <div key={`head-${i}`} className="text-center text-[9px] md:text-[11px] font-semibold text-ink-3 uppercase mb-2 md:mb-4">
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
                      className={`group relative aspect-square flex flex-col items-center justify-center rounded-md md:rounded-lg transition-all duration-300 ${
                        isSelected 
                        ? "bg-brand text-white shadow-pop  scale-105 md:scale-110 z-10" 
                        : isToday ? "bg-brand-soft text-brand border border-brand/40" : "bg-surface hover:bg-subtle text-ink-2"
                      }`}
                    >
                      <span className={`text-xs md:text-lg font-semibold ${isSelected ? "text-white" : isToday ? "text-brand" : "text-ink"}`}>
                        {day}
                      </span>
                      
                      {dayEvents.length > 0 && !isSelected && (
                        <div className="absolute bottom-1 md:bottom-4 flex gap-0.5 md:gap-1">
                          {hasMeeting && <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-brand"></div>}
                          {hasReminder && <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-amber-400"></div>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-brand-soft rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
            </div>
          </section>

          {/* TIMELINE DE COMPROMISSOS */}
          <section className="lg:col-span-4 space-y-8 animate-fade-in duration-700">
            <div className="bg-surface rounded-lg md:rounded-lg p-6 shadow-card border border-line flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-brand-soft text-brand rounded-[0.8rem]">
                    <CalendarDays size={18} />
                  </div>
                  <h3 className="text-sm font-semibold text-ink uppercase text-[12px]">Compromissos</h3>
                </div>
              </div>

              <div className="flex-1 space-y-4 relative">
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-hover rounded-full"></div>

                {eventsOfSelectedDay.length > 0 ? (
                  eventsOfSelectedDay.map(event => {
                    const isMeeting = event.type === 'meeting';
                    return (
                      <div key={event.id} className="relative pl-10 group">
                        <div className={`absolute left-[14px] top-1.5 w-3 h-3 bg-surface border-[3px] rounded-full z-10 ${isMeeting ? 'border-brand' : 'border-amber-500'}`}></div>
                        
                        <div className={`p-4 rounded-[1.8rem] transition-all border duration-300 ${
                          isMeeting 
                          ? "bg-brand-soft border-brand/40 hover:bg-surface hover:border-brand/40 hover:shadow-card " 
                          : "bg-amber-50/30 border-amber-50 hover:bg-surface hover:border-amber-100 hover:shadow-card hover:shadow-amber-500/5"
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[9px] font-semibold uppercase  bg-surface px-2 py-1 rounded-lg shadow-sm border ${isMeeting ? 'text-brand border-brand/40' : 'text-amber-600 border-amber-50'}`}>
                              {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="flex gap-2">
                              <button onClick={() => openEditMeeting(event)} className="p-1.5 text-ink-3 hover:text-brand hover:bg-brand-soft rounded-lg transition-all"><Edit2 size={12} /></button>
                              <button onClick={() => handleDeleteMeeting(event.id)} className="p-1.5 text-ink-3 hover:text-danger hover:bg-danger-soft rounded-lg transition-all"><Trash2 size={12} /></button>
                            </div>
                          </div>
                          
                          <h4 className="font-bold text-ink text-base mb-2 leading-tight">{event.title}</h4>
                          
                          <div className={`flex items-center gap-1.5 text-[9px] mb-3 font-semibold uppercase  w-fit px-2 py-0.5 rounded-md ${isMeeting ? 'bg-brand-soft text-brand' : 'bg-amber-50 text-amber-600'}`}>
                            {isMeeting ? <><ShieldCheck size={10} /> <span>Reunião Hubify</span></> : <><AlertCircle size={10} /> <span>Lembrete Pessoal</span></>}
                          </div>
                          
                          {isMeeting && (
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
                              <div className="flex items-center gap-1.5">
                                 <div className="flex -space-x-1.5">
                                    {event.participants?.slice(0, 3).map((pId, i) => {
                                      const u = users.find(x => x.id === pId);
                                      return (
                                        <div key={i} className="w-7 h-7 rounded-full bg-surface border border-line shadow-sm overflow-hidden" title={u?.name}>
                                          <Avatar src={u?.avatarUrl} name={u?.name} size={28} />
                                        </div>
                                      );
                                    })}
                                    {event.participants?.length > 3 && (
                                      <div className="w-7 h-7 rounded-full bg-hover border border-line flex items-center justify-center text-[8px] font-bold text-ink-2">
                                        +{event.participants.length - 3}
                                      </div>
                                    )}
                                 </div>
                              </div>
                              <button 
                                onClick={() => handleStartMeeting(`meeting_${event.id}`)}
                                className="p-1.5 bg-brand rounded-lg shadow-sm text-white hover:bg-brand-hover transition-all flex items-center gap-1.5 px-3"
                              >
                                <span className="text-[10px] font-semibold uppercase">Entrar</span>
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
                    <div className="w-16 h-16 border-2 border-dashed border-line rounded-full flex items-center justify-center mb-4 text-ink-3">
                      <Clock size={24} />
                    </div>
                    <p className="text-[10px] font-semibold uppercase">Nada planejado</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* MODAL DE AGENDAMENTO */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 animate-fade-in duration-300">
          <div className="bg-surface w-full max-w-md rounded-lg md:rounded-lg p-6 md:p-10 shadow-pop animate-fade-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8 md:mb-10">
              <div>
                <h3 className="text-xl md:text-2xl font-semibold text-ink">{editingMeetingId ? 'Editar Compromisso' : 'Agendar Reunião'}</h3>
                <p className="text-[10px] text-ink-3 font-bold uppercase mt-1">Sincronização Hubify</p>
              </div>
              <button onClick={handleCloseModal} className="p-2 md:p-3 bg-subtle rounded-md md:rounded-lg hover:bg-danger-soft hover:text-danger transition-all"><X size={20} className="md:w-6 md:h-6" /></button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-ink-3 uppercase ml-1">Assunto / Título</label>
                <input 
                  required 
                  autoFocus 
                  placeholder="Ex: Planejamento Mensal" 
                  className="w-full p-4 bg-subtle border border-line rounded-md md:rounded-lg focus:ring-4 focus:ring-brand/30 focus:border-brand outline-none transition-all font-bold text-ink" 
                  value={newMeetingTitle} 
                  onChange={e => setNewMeetingTitle(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-ink-3 uppercase ml-1">Data e Horário</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" size={16} />
                    <input 
                      type="datetime-local" 
                      className="w-full p-4 pl-12 bg-subtle border border-line rounded-md md:rounded-lg focus:border-brand outline-none transition-all font-bold text-sm" 
                      value={newMeetingDate} 
                      onChange={e => setNewMeetingDate(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-ink-3 uppercase ml-1">Tipo</label>
                  <button 
                    type="button" 
                    onClick={() => setCalendarItemType(calendarItemType === 'meeting' ? 'reminder' : 'meeting')} 
                    className={`w-full h-[58px] rounded-md md:rounded-lg border flex items-center justify-center gap-2 transition-all font-semibold text-[10px] uppercase ${calendarItemType === 'meeting' ? "bg-brand-soft border-brand/40 text-brand" : "bg-amber-50 border-amber-200 text-amber-700"}`}
                  >
                    {calendarItemType === 'meeting' ? <><Unlock size={14} /> Reunião</> : <><Lock size={14} /> Lembrete</>}
                  </button>
                </div>
              </div>

              {calendarItemType === 'meeting' && (
                <div className="space-y-2 animate-fade-in duration-300">
                  <label className="text-[10px] font-semibold text-ink-3 uppercase ml-1 mb-2 block">Convidar Pessoas</label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 bg-subtle rounded-md md:rounded-lg border border-line">
                    {users.filter(u => u.id !== user?.id).map(u => {
                      const isSelected = selectedInvitees.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleParticipant(u.id)}
                          className={`flex items-center gap-2 p-1.5 pr-3 rounded-full border transition-all ${isSelected ? "bg-brand border-brand text-white" : "bg-surface border-line text-ink-2 hover:border-brand/40"}`}
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-hover">
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
                className={`w-full text-white py-4 md:py-5 rounded-lg md:rounded-lg font-semibold text-base md:text-lg shadow-pop transition-all flex items-center justify-center gap-3 mt-4 ${
                  calendarItemType === 'meeting' ? 'bg-brand  hover:bg-brand-hover' : 'bg-amber-500 shadow-amber-200 hover:bg-amber-600'
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
