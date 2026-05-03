
import React, { useState, useEffect } from 'react';
import { UserPlus, Clock } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import HeaderNotification from '../components/common/HeaderNotification';

export default function Invitations() {
  const { user } = useAuth();
  const { groupInvites, handleAcceptGroupInvite, handleDeclineGroupInvite } = useChat();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const myInvites = groupInvites.filter(i => i.toId === user?.id);

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden animate-in fade-in duration-300">
      <div className="h-16 px-4 md:px-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
             <UserPlus className="w-5 h-5" />
           </div>
           <h2 className="text-xl font-bold text-slate-900">Convites</h2>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center text-slate-400 text-[10px] md:text-sm font-semibold gap-2 bg-slate-50 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-slate-100">
              <Clock size={14} className="text-indigo-600 md:w-4 md:h-4" />
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
           </div>
           <HeaderNotification />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="mb-6">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Convites Pendentes</h3>
            <p className="text-sm text-slate-500 font-medium">Você tem {myInvites.length} novos convites de grupos.</p>
          </div>

          {myInvites.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <UserPlus className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Nenhum convite novo</h3>
              <p className="text-sm text-slate-500">Você será avisado quando alguém te convidar para um grupo.</p>
            </div>
          ) : (
            myInvites.map(invite => (
              <div key={invite.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">
                    {invite.groupName.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{invite.groupName}</h3>
                    <p className="text-sm text-slate-500">Convidado por <span className="font-semibold text-indigo-600">{invite.fromName}</span></p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 font-bold">
                      <Clock className="w-3 h-3" />
                      Recebido em {new Date(invite.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => handleDeclineGroupInvite(invite.id)}
                    className="flex-1 md:flex-none px-6 py-2.5 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                  >
                    Recusar
                  </button>
                  <button 
                    onClick={() => handleAcceptGroupInvite(invite.id)}
                    className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Aceitar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
