
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Send, MoreVertical, Trash2, Phone, Video, Info, ChevronLeft, 
  Image as ImageIcon, FileText, Download, Paperclip, Clock, Calendar, X, Plus,
  FileSpreadsheet, Package, FileCode, FileArchive, Bell, BellOff, ShieldCheck,
  Edit, CornerUpLeft, Copy, Forward, CheckCircle2, Circle, Smile, Check
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/chat/ChatList';
import HeaderNotification from '../components/common/HeaderNotification';
import EmojiPicker from 'emoji-picker-react';

export default function Chat() {
  const { 
    chatRooms, activeRoomId, setActiveRoomId, allMessages,
    handleSendMessage, handleDeleteRoom, users, statusConfig,
    handleStartMeeting, handleStartAudioCall,
    selectedChatMobile, setSelectedChatMobile,
    readTimestamps, setShowDMModal, setShowGroupModal,
    groupInvites, setView, showChatInfo, setShowChatInfo,
    setPreviewDocument, showAddMemberModal, setShowAddMemberModal,
    setSelectedContactDetail, setShowContactDetailModal,
    startConversation, handleRemoveMember, handleUpdateProfile, 
    handleDeleteMessage, handleEditMessage, handleForwardMessages,
    typingUsers, setTyping, mutedRooms, toggleMuteRoom
  } = useChat();
  const { user } = useAuth();
  
  const [newMessage, setNewMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCallMenu, setShowCallMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputBarRef = useRef(null);
  const attachmentMenuRef = useRef(null);
  const [activeMessageMenuId, setActiveMessageMenuId] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [isForwardMode, setIsForwardMode] = useState(false);
  const [selectedForwardMessages, setSelectedForwardMessages] = useState([]);
  const [showForwardTargetModal, setShowForwardTargetModal] = useState(false);
  const messageMenuRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);

  const recipient = useMemo(() => {
    if (!activeRoomId?.startsWith('dm_')) return null;
    const otherId = activeRoomId.replace('dm_', '').split('_').find(id => id !== user?.id);
    return users.find(u => u.id === otherId);
  }, [activeRoomId, users, user?.id]);

  const recipientReadTimestamps = useMemo(() => {
    if (!recipient?.readTimestamps) return {};
    try {
      return JSON.parse(recipient.readTimestamps);
    } catch (e) {
      return {};
    }
  }, [recipient]);

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return { icon: <FileText size={20} />, color: 'text-red-500', bg: 'bg-red-50' };
      case 'doc':
      case 'docx': return { icon: <FileText size={20} />, color: 'text-blue-500', bg: 'bg-blue-50' };
      case 'xls':
      case 'xlsx': return { icon: <FileSpreadsheet size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-50' };
      case 'ppt':
      case 'pptx': return { icon: <FileText size={20} />, color: 'text-orange-500', bg: 'bg-orange-50' };
      case 'zip':
      case 'rar': return { icon: <FileArchive size={20} />, color: 'text-purple-500', bg: 'bg-purple-50' };
      default: return { icon: <FileCode size={20} />, color: 'text-slate-500', bg: 'bg-slate-50' };
    }
  };

  const currentRoomInfo = chatRooms.find(r => r.id === activeRoomId);
  const currentMessages = (allMessages || [])
    .filter(m => m.roomId === activeRoomId)
    .filter(m => !msgSearchQuery || m.text.toLowerCase().includes(msgSearchQuery.toLowerCase()));

  const formatDateSeparator = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  const shouldShowDateSeparator = (index) => {
    if (index === 0) return true;
    const prevDate = new Date(currentMessages[index - 1].timestamp).toDateString();
    const currDate = new Date(currentMessages[index].timestamp).toDateString();
    return prevDate !== currDate;
  };

  // Keyboard management is now handled by flexbox and h-dynamic-screen
  useEffect(() => {
    const el = inputBarRef.current;
    if (!el) return;
    el.style.bottom = '0';
  }, [inputBarRef]);

  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setShowScrollButton(true);
    }
  }, [currentMessages, isAtBottom]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(atBottom);
    if (atBottom) setShowScrollButton(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) setShowAttachmentMenu(false);
      if (messageMenuRef.current && !messageMenuRef.current.contains(event.target)) setActiveMessageMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("O arquivo excede o limite de 25MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPendingFile({
        name: file.name,
        type: file.type,
        size: file.size,
        data: event.target.result
      });
      setShowAttachmentMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = null; 
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !pendingFile) return;
    
    if (editingMessage) {
      handleEditMessage(editingMessage.id, newMessage);
      setEditingMessage(null);
      setIsEditing(false);
      setNewMessage('');
    } else {
      handleSendMessage(newMessage, pendingFile, replyingToMessage?.id);
      setNewMessage('');
      setPendingFile(null);
      setReplyingToMessage(null);
    }
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
  };

  const toggleForwardSelection = (msgId) => {
    setSelectedForwardMessages(prev => 
      prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
    );
  };

  const onForwardMessages = (targetRoomIds) => {
    handleForwardMessages(selectedForwardMessages, targetRoomIds);
    setIsForwardMode(false);
    setSelectedForwardMessages([]);
    setShowForwardTargetModal(false);
  };

  const renderChatList = () => (
    <ChatList 
      chatRooms={chatRooms} 
      activeRoomId={activeRoomId} 
      setActiveRoomId={(id) => { setActiveRoomId(id); setSelectedChatMobile(true); }}
      allMessages={allMessages}
      user={user}
      users={users}
      readTimestamps={readTimestamps || {}}
      statusConfig={statusConfig}
      setShowDMModal={setShowDMModal}
      setShowGroupModal={setShowGroupModal}
      selectedChatMobile={selectedChatMobile}
      setSelectedChatMobile={setSelectedChatMobile}
      groupInvites={groupInvites}
      onViewInvitations={() => setView('invitations')}
      mutedRooms={mutedRooms}
    />
  );

  if (!currentRoomInfo) {
    return (
      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        <div className={`w-full md:w-[380px] shrink-0 border-r border-slate-100 ${selectedChatMobile ? 'hidden md:block' : 'block'}`}>
          {renderChatList()}
        </div>
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-50 text-slate-400 p-8 text-center">
          <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl shadow-slate-200/50 border border-slate-100">
             <Video className="w-10 h-10 text-indigo-200" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Bem-vindo ao Hubify Chat</h3>
          <p className="max-w-xs text-sm leading-relaxed">Selecione uma conversa ou inicie um novo grupo para começar a colaborar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-white">
      <div className={`w-full md:w-[380px] border-r border-slate-100 shrink-0 ${selectedChatMobile ? 'hidden md:block' : 'block'}`}>
        {renderChatList()}
      </div>

      <div className={`flex-1 flex flex-col bg-white h-dynamic-screen overflow-hidden ${!selectedChatMobile ? 'hidden md:flex' : 'flex'}`}>
        <div className="h-16 shrink-0 px-4 md:px-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all" onClick={() => { setSelectedChatMobile(false); setActiveRoomId(null); }}>
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="relative group cursor-pointer" onClick={() => setShowChatInfo(true)}>
              {currentRoomInfo.isGroup ? (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-indigo-100 shadow-lg">{currentRoomInfo.avatar}</div>
              ) : (
                <img src={currentRoomInfo.avatarUrl} alt={currentRoomInfo.name} className="w-10 h-10 rounded-xl bg-slate-100 object-cover shadow-sm" />
              )}
            </div>
            <div className="cursor-pointer" onClick={() => setShowChatInfo(true)}>
              <h2 className="text-base font-black text-slate-800 leading-tight truncate max-w-[150px] md:max-w-[300px]">
                {currentRoomInfo.name}
              </h2>
              <div className="flex items-center gap-2">
                {(() => {
                  const typingInRoom = typingUsers[activeRoomId] || {};
                  const typingOthers = Object.entries(typingInRoom).filter(([id]) => id !== user?.id);
                  
                  if (typingOthers.length > 0) {
                    return (
                      <span className="text-[10px] font-black text-indigo-600 animate-pulse flex items-center gap-1">
                        <div className="w-1 h-1 bg-indigo-600 rounded-full" />
                        {typingOthers.length === 1 
                          ? `${typingOthers[0][1]} está digitando...` 
                          : `${typingOthers.length} pessoas estão digitando...`}
                      </span>
                    );
                  }

                  if (currentRoomInfo.isGroup) {
                    return (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {currentRoomInfo.members?.length || 0} Membros
                        </span>
                      </>
                    );
                  }

                  const isOnline = currentRoomInfo.isOnline;
                  return (
                    <>
                      <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {isOnline ? 'Online agora' : 'Offline'}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {showSearch ? (
              <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 animate-in slide-in-from-right-4 duration-300">
                <Search className="w-4 h-4 text-slate-400 mr-2" />
                <input 
                  autoFocus
                  type="text"
                  value={msgSearchQuery}
                  onChange={(e) => setMsgSearchQuery(e.target.value)}
                  placeholder="Pesquisar mensagens..."
                  className="bg-transparent border-none outline-none text-sm w-32 md:w-48 text-slate-700"
                />
                <button onClick={() => { setShowSearch(false); setMsgSearchQuery(''); }}>
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowSearch(true)}
                className="p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
                title="Pesquisar"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Chamada - Bloqueado se for chat consigo mesmo */}
            {(!currentRoomInfo.isDM || currentRoomInfo.id !== user.id) && (
              <div className="relative">
                <button 
                  onClick={() => setShowCallMenu(!showCallMenu)}
                  className={`p-2 rounded-xl transition-all ${showCallMenu ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
                  title="Chamada"
                >
                  <Video className="w-5 h-5" />
                </button>

                {showCallMenu && (
                  <div className="absolute right-0 top-12 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <button 
                      onClick={() => { handleStartMeeting(); setShowCallMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-4 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Video className="w-4 h-4 text-indigo-600" /> Chamada de Vídeo
                    </button>
                    <button 
                      onClick={() => { handleStartAudioCall(); setShowCallMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-4 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-50"
                    >
                      <Phone className="w-4 h-4 text-green-600" /> Chamada de Áudio
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={`p-2 rounded-xl transition-all ${showMoreMenu ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                  <button 
                    onClick={() => { setShowChatInfo(true); setShowMoreMenu(false); }}
                    className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <Info className="w-4 h-4 text-indigo-600" />
                    Informações
                  </button>
                  
                  <button 
                    onClick={() => { toggleMuteRoom(activeRoomId); setShowMoreMenu(false); }}
                    className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    {mutedRooms?.includes(activeRoomId) ? (
                      <>
                        <Bell className="w-4 h-4 text-green-600" /> Ativar notificações
                      </>
                    ) : (
                      <>
                        <BellOff className="w-4 h-4 text-slate-400" /> Silenciar notificações
                      </>
                    )}
                  </button>

                  <div className="h-[1px] bg-slate-50 my-1" />

                  <button 
                    onClick={() => { handleDeleteRoom(activeRoomId); setShowMoreMenu(false); }}
                    className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 font-bold transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    {currentRoomInfo.isGroup ? 'Sair do grupo' : 'Excluir conversa'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#FDFDFD] relative">
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar relative"
          >
            {currentMessages.map((msg, index) => {
              const isMine = msg.senderId === user.id;
              const sender = users.find(u => u.id === msg.senderId);
              const showAvatar = index === 0 || currentMessages[index-1].senderId !== msg.senderId;
              const showDateSeparator = shouldShowDateSeparator(index);

              return (
                <React.Fragment key={msg.id}>
                  {showDateSeparator && (
                    <div className="flex justify-center my-6 relative z-0">
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm border border-white">
                        {formatDateSeparator(msg.timestamp)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`flex items-end gap-3 max-w-[85%] md:max-w-[70%] group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    {isForwardMode && (
                      <button 
                        onClick={() => toggleForwardSelection(msg.id)}
                        className={`p-2 rounded-full transition-all shrink-0 ${selectedForwardMessages.includes(msg.id) ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300 hover:bg-slate-100'}`}
                      >
                        {selectedForwardMessages.includes(msg.id) ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>
                    )}
                    {!isMine && showAvatar && (
                      <img src={sender?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"} className="w-8 h-8 rounded-lg bg-slate-100 shrink-0 shadow-sm" alt="Avatar" />
                    )}
                    {!isMine && !showAvatar && <div className="w-8 shrink-0" />}
                    
                    <div className="flex flex-col gap-1">
                      {!isMine && showAvatar && <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase tracking-wider">{sender?.name}</span>}
                      
                      {isMine && (
                        <div className="flex justify-end relative">
                          <button 
                            onClick={() => setActiveMessageMenuId(activeMessageMenuId === msg.id ? null : msg.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                            title="Opções"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {activeMessageMenuId === msg.id && (
                            <div 
                              ref={messageMenuRef}
                              className="absolute top-full right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-200"
                            >
                              <button 
                                onClick={() => {
                                  setReplyingToMessage(msg);
                                  setActiveMessageMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                              >
                                <CornerUpLeft size={12} className="text-blue-500" /> Responder
                              </button>
                              
                              <button 
                                onClick={() => {
                                  handleCopyMessage(msg.text);
                                  setActiveMessageMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                              >
                                <Copy size={12} className="text-emerald-500" /> Copiar texto
                              </button>

                              <button 
                                onClick={() => {
                                  setIsForwardMode(true);
                                  setSelectedForwardMessages([msg.id]);
                                  setActiveMessageMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                              >
                                <Forward size={12} className="text-indigo-500" /> Encaminhar
                              </button>

                              <div className="h-[1px] bg-slate-50 my-1" />

                              {isMine && (
                                <>
                                  {Date.now() - msg.timestamp < 5 * 60 * 1000 ? (
                                    <button 
                                      onClick={() => {
                                        setEditingMessage(msg);
                                        setIsEditing(true);
                                        setNewMessage(msg.text);
                                        setActiveMessageMenuId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                      <Edit size={12} className="text-indigo-500" /> Editar
                                    </button>
                                  ) : (
                                    <div className="w-full px-3 py-2 text-[10px] font-bold text-slate-300 italic">
                                      Edição indisponível
                                    </div>
                                  )}
                                  <button 
                                    onClick={() => {
                                      handleDeleteMessage(msg.id);
                                      setActiveMessageMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-red-500 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 size={12} /> Excluir
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                        isMine 
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-100' 
                        : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none shadow-slate-100'
                      }`}>
                        {msg.replyToId && (
                          <div 
                            className={`mb-2 p-2 rounded-xl border-l-4 text-xs overflow-hidden cursor-pointer ${
                              isMine 
                              ? 'bg-white/10 border-white/40 text-indigo-50' 
                              : 'bg-slate-50 border-indigo-500 text-slate-500'
                            }`}
                            onClick={() => {
                              const el = document.getElementById(`msg-${msg.replyToId}`);
                              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              el?.classList.add('ring-4', 'ring-indigo-400', 'ring-opacity-50');
                              setTimeout(() => el?.classList.remove('ring-4', 'ring-indigo-400', 'ring-opacity-50'), 2000);
                            }}
                          >
                            <p className="font-bold truncate">
                              {allMessages.find(m => m.id === msg.replyToId)?.senderName || 'Mensagem'}
                            </p>
                            <p className="truncate opacity-80">
                              {allMessages.find(m => m.id === msg.replyToId)?.text || (allMessages.find(m => m.id === msg.replyToId)?.attachment ? '📎 Arquivo' : 'Mensagem não encontrada')}
                            </p>
                          </div>
                        )}
                        {msg.isForwarded && (
                          <div className={`flex items-center gap-1 mb-1 text-[10px] font-bold uppercase tracking-wider opacity-60`}>
                            <Forward size={10} /> Encaminhada
                          </div>
                        )}
                        {msg.attachment && (
                          <div className="mb-2 max-w-full overflow-hidden rounded-xl">
                            {msg.attachment.type.startsWith('image/') ? (
                              <div className="relative group/img">
                                <img 
                                  src={msg.attachment.data} 
                                  alt={msg.attachment.name} 
                                  className="max-h-[300px] w-full object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity" 
                                  onClick={() => setPreviewDocument(msg.attachment)}
                                />
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                  <a 
                                    href={msg.attachment.data} 
                                    download={msg.attachment.name}
                                    className="p-2 bg-black/40 hover:bg-black/60 text-white rounded-full"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div 
                                onClick={() => setPreviewDocument(msg.attachment)}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${isMine ? 'bg-indigo-500/30 border-white/20' : 'bg-slate-50 border-slate-100'}`}
                              >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isMine ? 'bg-white/20' : getFileIcon(msg.attachment.name).bg + ' ' + getFileIcon(msg.attachment.name).color}`}>
                                  {isMine ? <FileText size={20} className="text-white" /> : getFileIcon(msg.attachment.name).icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-bold truncate ${isMine ? 'text-white' : 'text-slate-800'}`}>{msg.attachment.name}</p>
                                  <p className={`text-[10px] ${isMine ? 'text-indigo-100' : 'text-slate-400'}`}>{(msg.attachment.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <a 
                                  href={msg.attachment.data} 
                                  download={msg.attachment.name}
                                  className={`p-2 rounded-lg transition-all ${isMine ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                        {msg.text && (
                          <p className="text-sm leading-relaxed font-medium break-words">{msg.text}</p>
                        )}
                      </div>
                      <div className={`flex items-center gap-2 relative ${isMine ? 'justify-end' : ''}`}>
                        {msg.isEdited && (
                          <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter italic flex items-center gap-0.5">
                            <Edit size={8} /> Editada
                          </span>
                        )}
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        
                        {isMine && !msg.isOptimistic && (
                          <div className="flex items-center ml-1">
                            {(() => {
                              const isRead = recipientReadTimestamps[activeRoomId] >= msg.timestamp;
                              if (isRead) {
                                return (
                                  <div className="flex">
                                    <Check size={12} className="text-blue-500" />
                                    <Check size={12} className="text-blue-500 -ml-2" />
                                  </div>
                                );
                              }
                              return (
                                <div className="flex">
                                  <Check size={12} className="text-slate-300" />
                                  <Check size={12} className="text-slate-300 -ml-2" />
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        {isMine && msg.isOptimistic && (
                          <Check size={12} className="text-slate-300 ml-1" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area Container */}
          <div className="shrink-0 flex flex-col bg-white border-t border-slate-100 z-40">
            <div 
              ref={inputBarRef} 
              className="p-4 md:p-6"
            >
            {isForwardMode && (
              <div className="absolute inset-x-0 bottom-full bg-indigo-600 text-white px-6 py-4 flex items-center justify-between animate-in slide-in-from-bottom-4 duration-300 z-[80]">
                <div className="flex items-center gap-4">
                  <button onClick={() => { setIsForwardMode(false); setSelectedForwardMessages([]); }} className="p-2 hover:bg-white/10 rounded-full transition-all">
                    <X size={20} />
                  </button>
                  <span className="font-bold">{selectedForwardMessages.length} selecionadas</span>
                </div>
                <button 
                  disabled={selectedForwardMessages.length === 0}
                  onClick={() => setShowForwardTargetModal(true)}
                  className="px-6 py-2 bg-white text-indigo-600 rounded-xl font-black text-sm hover:bg-indigo-50 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  Encaminhar
                </button>
              </div>
            )}

            {replyingToMessage && (
              <div className="mb-4 p-3 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-300">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <CornerUpLeft className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-0.5">Respondendo a {replyingToMessage.senderName}</p>
                  <p className="text-xs text-slate-600 truncate italic">"{replyingToMessage.text || '📎 Arquivo'}"</p>
                </div>
                <button 
                  onClick={() => setReplyingToMessage(null)} 
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {editingMessage && (
              <div className="mb-4 p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-300">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                  <Edit className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-0.5">Editando Mensagem</p>
                  <p className="text-xs text-slate-600 truncate italic">"{editingMessage.text}"</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingMessage(null);
                    setNewMessage('');
                  }} 
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {pendingFile && (
              <div className="mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-300">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600">
                  {pendingFile.type.startsWith('image/') ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{pendingFile.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{(pendingFile.size / 1024 / 1024).toFixed(2)} MB • Pronto para enviar</p>
                </div>
                <button onClick={() => setPendingFile(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={onSubmit} className="flex items-center gap-3 max-w-6xl mx-auto relative">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileSelect}
              />
              
              <div className="relative" ref={attachmentMenuRef}>
                <button 
                  type="button"
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all active:scale-95 shrink-0 border ${
                    showAttachmentMenu 
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'text-slate-400 bg-slate-50 border-slate-100 hover:bg-slate-100 hover:text-indigo-600'
                  }`}
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                {showAttachmentMenu && (
                  <div className="absolute bottom-full left-0 mb-4 w-48 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 animate-in slide-in-from-bottom-4 duration-300 z-[70]">
                    <button 
                      type="button"
                      onClick={() => {
                        fileInputRef.current.accept = "image/*";
                        fileInputRef.current.click();
                      }}
                      className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-black text-slate-700">Imagem</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar";
                        fileInputRef.current.click();
                      }}
                      className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-black text-slate-700">Documento</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    if (!showEmojiPicker) {
                      messageInputRef.current?.blur();
                    }
                    setShowEmojiPicker(!showEmojiPicker);
                  }}
                  className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all active:scale-95 shrink-0 border ${
                    showEmojiPicker 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' 
                      : 'text-slate-400 bg-slate-50 border-slate-100 hover:bg-slate-100 hover:text-indigo-600'
                  }`}
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>
              
              <input 
                ref={messageInputRef}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  
                  // Typing Indicator Logic
                  setTyping(true);
                  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = setTimeout(() => {
                    setTyping(false);
                  }, 2000);
                }}
                onFocus={() => { 
                  if (showEmojiPicker) setShowEmojiPicker(false); 
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    onSubmit(e);
                  }
                }}
                placeholder={editingMessage ? "Alterar mensagem..." : "Digite algo interessante..."}
                className="flex-1 bg-slate-50/50 border border-slate-200/60 rounded-2xl px-6 py-4 text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400 font-medium"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim() && !pendingFile}
                className="w-12 h-12 flex items-center justify-center text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 shadow-lg shadow-indigo-100 transition-all active:scale-95 shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>

            {/* Emoji Picker Area (Keyboard Style) */}
            {showEmojiPicker && (
              <div className="h-[40vh] md:h-[350px] mt-4 border-t border-slate-50 animate-in slide-in-from-bottom duration-500 ease-out overflow-hidden">
                <div className="w-full h-full custom-emoji-picker">
                  <EmojiPicker 
                    onEmojiClick={(emojiData) => {
                      setNewMessage(prev => prev + emojiData.emoji);
                    }}
                    theme="light"
                    width="100%"
                    height="100%"
                    skinTonesDisabled
                    searchPlaceholder="Buscar emojis..."
                    previewConfig={{ showPreview: false }}
                    lazyLoadEmojis={true}
                  />
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Info Side Panel - Now a sibling of the chat body div */}
        {showChatInfo && (
          <>
            {/* Overlay for mobile */}
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] lg:hidden animate-in fade-in duration-300"
              onClick={() => setShowChatInfo(false)}
            />
            <div className="fixed inset-y-0 right-0 z-[60] w-full max-w-[350px] lg:static lg:w-[350px] border-l border-slate-100 bg-white animate-in slide-in-from-right duration-500 ease-out flex flex-col shadow-2xl lg:shadow-none shrink-0 h-full">
              <div className="p-6 h-16 shrink-0 flex items-center justify-between border-b border-slate-50">
                <h3 className="font-bold text-slate-800">
                  {currentRoomInfo.isGroup ? 'Detalhes do grupo' : 'Detalhes da conversa'}
                </h3>
                <button onClick={() => setShowChatInfo(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center custom-scrollbar">
                <div className="mb-6 relative">
                  {currentRoomInfo.isGroup ? (
                    <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-indigo-500 to-purple-400 flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-white">{currentRoomInfo.avatar}</div>
                  ) : (
                    <img src={currentRoomInfo.avatarUrl} alt={currentRoomInfo.name} className="w-32 h-32 rounded-[2.5rem] shadow-xl object-cover border-4 border-white" />
                  )}
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-1">{currentRoomInfo.name}</h4>
                <p className="text-sm text-slate-500 mb-8">{currentRoomInfo.isGroup ? `${currentRoomInfo.members?.length || 0} membros` : 'Online'}</p>
                
                <div className="w-full space-y-8">
                  {/* Botão de Adicionar Membro (Apenas para Admin do Grupo) */}
                  {currentRoomInfo.isGroup && currentRoomInfo.createdBy === user.id && (
                    <button 
                      onClick={() => setShowAddMemberModal(true)}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Convidar Membros
                    </button>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Sobre</label>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {currentRoomInfo.isGroup 
                        ? (currentRoomInfo.description || 'Este é um grupo de colaboração do Hubify para discussões em tempo real.')
                        : (() => {
                            const otherId = currentRoomInfo.id.replace('dm_', '').split('_').find(id => id !== user.id);
                            const contact = users.find(u => u.id === otherId);
                            return contact?.bio || 'Este usuário ainda não adicionou uma descrição ao perfil.';
                          })()
                      }
                    </p>
                  </div>

                  {currentRoomInfo.isGroup && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Membros do Grupo</label>
                      <div className="space-y-3">
                        {currentRoomInfo.members?.map(mId => {
                          const m = users.find(u => u.id === mId);
                          const isAdmin = mId === currentRoomInfo.createdBy;
                          return (
                            <div 
                              key={mId} 
                              onClick={() => {
                                if (mId !== user.id) {
                                  setSelectedContactDetail(m);
                                  setShowContactDetailModal(true);
                                }
                              }}
                              className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-indigo-100 cursor-pointer transition-all group/member"
                            >
                              <img src={m?.avatarUrl} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt={m?.name} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{m?.name} {mId === user.id && '(Você)'}</p>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-black uppercase tracking-wider ${isAdmin ? 'text-indigo-600' : 'text-slate-400'}`}>
                                    {isAdmin ? 'Administrador' : 'Membro'}
                                  </span>
                                  {m?.isOnline && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                                </div>
                              </div>
                              {currentRoomInfo.createdBy === user.id && mId !== user.id && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleRemoveMember(currentRoomInfo.id, mId); }}
                                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover/member:opacity-100 transition-all"
                                  title="Remover do grupo"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      {/* Modal de Encaminhamento */}
      {showForwardTargetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-800">Encaminhar Mensagem</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Selecione para quem enviar</p>
              </div>
              <button onClick={() => setShowForwardTargetModal(false)} className="p-3 text-slate-400 hover:bg-white rounded-2xl transition-all shadow-sm">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-2">
                {chatRooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => {
                      onForwardMessages([room.id]);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                  >
                    {room.isGroup ? (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">{room.avatar}</div>
                    ) : (
                      <div className="relative">
                        <img src={room.avatarUrl} className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-110 transition-transform" alt="" />
                        {room.isOnline && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-white rounded-full" />}
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{room.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{room.isGroup ? 'Grupo' : 'Contato'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Forward size={18} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
