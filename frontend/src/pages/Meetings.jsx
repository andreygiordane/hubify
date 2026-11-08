import React, { useState, useEffect } from 'react';
import { Video, CalendarPlus, Calendar, Clock, Link2, Users } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';

export default function Meetings() {
  const { handleStartMeeting, setView, setShowCalendarModal, setCalendarItemType, setEditingMeetingId, setNewMeetingTitle, setNewMeetingDate } = useChat();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  const startNow = () => handleStartMeeting(`meeting_${Date.now()}`);

  const schedule = () => {
    setEditingMeetingId?.(null);
    setNewMeetingTitle?.('');
    setNewMeetingDate?.('');
    setCalendarItemType?.('meeting');
    setShowCalendarModal(true);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-app">
      <header className="h-14 shrink-0 bg-surface border-b border-line px-4 md:px-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-ink">Reuniões</h1>
        <span className="text-sm text-ink-2">
          {(d => d.charAt(0).toUpperCase() + d.slice(1))(now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }))}
        </span>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar pb-20 md:pb-6">
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={startNow} className="card p-5 text-left flex items-start gap-4 hover:shadow-pop transition-shadow group">
              <span className="w-12 h-12 rounded-lg bg-brand text-white flex items-center justify-center shrink-0 group-hover:bg-brand-hover">
                <Video className="w-6 h-6" />
              </span>
              <span>
                <span className="block text-base font-semibold text-ink">Reunir agora</span>
                <span className="block text-sm text-ink-2 mt-0.5">Abra uma sala de vídeo e convide as pessoas lá de dentro.</span>
              </span>
            </button>
            <button onClick={schedule} className="card p-5 text-left flex items-start gap-4 hover:shadow-pop transition-shadow group">
              <span className="w-12 h-12 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
                <CalendarPlus className="w-6 h-6" />
              </span>
              <span>
                <span className="block text-base font-semibold text-ink">Agendar reunião</span>
                <span className="block text-sm text-ink-2 mt-0.5">Escolha data, horário e participantes. Eles recebem um lembrete.</span>
              </span>
            </button>
          </section>

          <section className="card">
            <div className="px-5 py-4 border-b border-line flex items-center justify-between">
              <h2 className="font-semibold text-ink">Próximas reuniões</h2>
              <button onClick={() => setView('calendar')} className="btn-ghost h-8 text-brand">
                <Calendar className="w-4 h-4" /> Abrir agenda
              </button>
            </div>
            <MeetingList now={now} />
          </section>
        </div>
      </main>
    </div>
  );
}

function MeetingList({ now }) {
  const { meetings, handleStartMeeting, users } = useChat();
  const { user } = useAuth();

  const list = meetings
    .filter(m => m.type === 'meeting')
    .filter(m => m.status === 'ongoing' || new Date(m.date).getTime() > now.getTime() - 60 * 60 * 1000)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (list.length === 0) {
    return (
      <div className="py-14 flex flex-col items-center text-center px-6">
        <Clock className="w-10 h-10 text-ink-3 mb-3" strokeWidth={1.5} />
        <p className="text-ink font-semibold">Nenhuma reunião agendada</p>
        <p className="text-sm text-ink-2 mt-1">As reuniões que você criar ou para as quais for convidado aparecem aqui.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {list.map((m) => {
        const date = new Date(m.date);
        const isOngoing = m.status === 'ongoing';
        const isHost = m.creatorId === user?.id;
        const people = [m.creatorId, ...(m.participants || [])].map(id => users.find(u => u.id === id)).filter(Boolean);
        const canJoin = isOngoing || isHost;
        return (
          <li key={m.id} className="flex items-center gap-4 px-5 py-3.5">
            <div className={`w-14 shrink-0 text-center rounded-md py-1.5 ${isOngoing ? 'bg-brand text-white' : 'bg-brand-soft text-brand-ink'}`}>
              <p className="text-[11px] uppercase leading-none">{date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</p>
              <p className="text-lg font-bold leading-tight">{date.getDate()}</p>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-ink truncate">{m.title}</h4>
              <p className="text-sm text-ink-2 flex items-center gap-2 flex-wrap">
                <span>{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                {isOngoing && <span className="pill bg-success/15 text-success"><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Em andamento</span>}
                {isHost && <span className="pill bg-hover text-ink-2">Organizador</span>}
              </p>
            </div>
            <div className="hidden sm:flex -space-x-2 items-center">
              {people.slice(0, 4).map(p => <Avatar key={p.id} src={p.avatarUrl} name={p.name} size={28} className="ring-2 ring-surface rounded-full" />)}
              {people.length > 4 && <span className="w-7 h-7 rounded-full bg-hover text-ink-2 text-xs flex items-center justify-center ring-2 ring-surface">+{people.length - 4}</span>}
            </div>
            <button
              onClick={() => handleStartMeeting(`meeting_${m.id}`)}
              className={canJoin ? 'btn-primary' : 'btn-secondary'}
              title={canJoin ? 'Entrar na reunião' : 'O organizador ainda não iniciou'}
            >
              <Video className="w-4 h-4" /> {isHost && !isOngoing ? 'Iniciar' : 'Entrar'}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
