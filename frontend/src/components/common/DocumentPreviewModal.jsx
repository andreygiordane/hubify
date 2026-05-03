
import React from 'react';
import { X, Download, FileText, Image as ImageIcon, FileCode, FileArchive, FileSpreadsheet, Package } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export default function DocumentPreviewModal() {
  const { previewDocument, setPreviewDocument } = useChat();

  if (!previewDocument) return null;

  const { name, type, data, size } = previewDocument;
  const isImage = type.startsWith('image/');
  const isPDF = type === 'application/pdf';

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300"
      onClick={() => setPreviewDocument(null)}
    >
      <div 
        className="bg-white w-full max-w-5xl h-[90vh] md:h-[85vh] rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
              {isImage ? <ImageIcon size={20} /> : <FileText size={20} />}
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-slate-800 truncate text-sm md:text-base">{name}</h3>
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{(size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <a 
              href={data} 
              download={name}
              className="flex items-center justify-center w-10 h-10 md:w-auto md:px-6 md:py-3 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
              title="Download"
            >
              <Download size={18} />
              <span className="hidden md:inline ml-2">Download</span>
            </a>
            <button 
              onClick={() => setPreviewDocument(null)}
              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-xl md:rounded-2xl transition-all bg-slate-50 border border-slate-100"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center p-4 md:p-8">
          {isImage ? (
            <img src={data} alt={name} className="max-w-full max-h-full object-contain rounded-xl shadow-lg" />
          ) : isPDF ? (
            <iframe src={data} title={name} className="w-full h-full rounded-xl border-none shadow-lg" />
          ) : (
            <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center text-center max-w-md">
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 mb-6">
                <FileText size={48} />
              </div>
              <h4 className="text-xl font-black text-slate-800 mb-2">Visualização indisponível</h4>
              <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                No momento, o Hubify suporta visualização direta apenas para Imagens e PDFs. Para outros arquivos, faça o download para abrir em seu dispositivo.
              </p>
              <a 
                href={data} 
                download={name}
                className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all"
              >
                Baixar agora
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
