
import React from 'react';
import { CheckCircle2, X, Info } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export default function SuccessModal() {
  const { showSuccessModal, setShowSuccessModal, successMessage } = useChat();

  if (!showSuccessModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm">
            <Info className="w-10 h-10 text-indigo-600" />
          </div>
          
          <h3 className="text-2xl font-black text-slate-900 mb-2">Aviso Importante</h3>
          <p className="text-slate-500 font-medium leading-relaxed mb-8 px-4">
            {successMessage || "Operação realizada com sucesso!"}
          </p>

          <button 
            onClick={() => setShowSuccessModal(false)}
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg transition-all hover:bg-indigo-700 active:scale-95 shadow-xl shadow-indigo-100"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
