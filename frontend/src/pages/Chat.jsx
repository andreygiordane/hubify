import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Send, MoreHorizontal, Trash2, Phone, Video, Info, ChevronLeft, Camera,
  Image as ImageIcon, FileText, Download, Paperclip, Clock, Calendar, X, Plus,
  FileSpreadsheet, Package, FileCode, FileArchive, Bell, BellOff, ShieldCheck,
  Edit, CornerUpLeft, Copy, Forward, CheckCircle2, Circle, Smile, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/chat/ChatList';
import HeaderNotification from '../components/common/HeaderNotification';
import EmojiPicker from 'emoji-picker-react';
import ReadIndicator from '../components/common/ReadIndicator';

export default function Chat() {
  const { 
    chatRooms, activeRoomId, setActiveRoomId, allMessages,
    handleSendMessage, handleDeleteRoom, users, statusConfig,
    handleStartMeeting, handleStartAudioCall,
    selectedChatMobile, setSelectedChatMobile,
    readTimestamps, otherUsersReadTimestamps, setShowDMModal, setShowGroupModal,
    groupInvites, setView, showChatInfo, setShowChatInfo,
    setPreviewDocument, showAddMemberModal, setShowAddMemberModal,
    setSelectedContactDetail, setShowContactDetailModal,
    startConversation, handleRemoveMember, handleUpdateProfile, handleUpdateGroup, 
    handleDeleteMessage, handleEditMessage, handleForwardMessages,
    typingUsers, setTyping, mutedRooms, toggleMuteRoom,
    setRoomToDelete, roomToDelete, handleAcceptGroup, handleDeclineGroup,
    roomWallpapers, handleUpdateRoomWallpaper
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const groupSidebarFileInputRef = useRef(null);
  
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);

  const wallpapers = [
    { id: 'none', name: 'Nenhum', color: '#FDFDFD', pattern: 'none' },
    { id: 'dots', name: 'Pontos', color: '#FDFDFD', pattern: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236366f1' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` },
    { id: 'lines', name: 'Linhas', color: '#FDFDFD', pattern: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236366f1' fill-opacity='0.04' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` },
    { id: 'circuit', name: 'Circuito', color: '#FDFDFD', pattern: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 35c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM58 5c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM46 77c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-3-61c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm33 25c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM20 70c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM.1 10l.003.003L10 20l.003.003L20 10l-.003-.003L10 0 .1 10zM88 88l.003.003L98 98l.003.003L108 88l-.003-.003L98 78 88 88z' fill='%236366f1' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")` },
    { id: 'topography', name: 'Topografia', color: '#FDFDFD', pattern: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 35c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM58 5c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM46 77c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-3-61c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm33 25c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM20 70c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM.1 10l.003.003L10 20l.003.003L20 10l-.003-.003L10 0 .1 10zM88 88l.003.003L98 98l.003.003L108 88l-.003-.003L98 78 88 88z' fill='%236366f1' fill-opacity='0.02' fill-rule='evenodd'/%3E%3C/svg%3E")` },
  ];

  const currentWallpaper = wallpapers.find(w => w.id === (roomWallpapers && roomWallpapers[activeRoomId])) || wallpapers[0];

  const handleGroupSidebarFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      handleUpdateGroup(currentRoomInfo?.id, { avatarUrl: event.target.result });
      setShowAvatarPicker(false);
    };
    reader.readAsDataURL(file);
  };
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);

  const recipient = useMemo(() => {
    if (!activeRoomId?.startsWith('dm_')) return null;
    const otherId = activeRoomId.replace('dm_', '').split('_').find(id => id !== user?.id);
    return users.find(u => u.id === otherId);
  }, [activeRoomId, users, user?.id]);

  const recipientReadTimestamps = useMemo(() => {
    // 🔥 Usar otherUsersReadTimestamps que é atualizado APENAS via Socket.IO
    // Em alguns cenários (remoção/recriação rápida), `recipient` pode ser undefined.
    // Nesses casos, extrair o otherId diretamente de `activeRoomId`.
    let otherId = recipient?.id;
    if (!otherId && activeRoomId?.startsWith('dm_')) {
      otherId = activeRoomId.replace('dm_', '').split('_').find(id => id !== (user?.id));
    }

    if (!otherId) {
      console.log(`[RECIPIENT_TS] No readTimestamps for recipient ${otherId}`);
      return {};
    }

    const ts = otherUsersReadTimestamps[otherId] || {};
    console.log(`[RECIPIENT_TS] Using readTimestamps for ${otherId}:`, ts);
    return ts;
  }, [recipient?.id, otherUsersReadTimestamps, activeRoomId, user?.id]);

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

  let currentRoomInfo = chatRooms.find(r => r.id === activeRoomId);
  if (!currentRoomInfo && activeRoomId?.startsWith('dm_')) {
    const otherId = activeRoomId.replace('dm_', '').split('_').find(id => id !== user?.id);
    const otherUser = users.find(u => u.id === otherId);
    if (otherUser) {
      currentRoomInfo = {
        id: activeRoomId,
        type: 'dm',
        name: otherUser.name,
        avatarUrl: otherUser.avatarUrl,
        otherUserId: otherUser.id,
        status: statusConfig?.[otherUser.status]?.color || 'bg-slate-300',
        members: [user?.id, otherUser.id]
      };
    }
  }
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
      handleDeleteRoom={handleDeleteRoom}
      setShowChatInfo={setShowChatInfo}
      setRoomToDelete={setRoomToDelete}
      handleAcceptGroup={handleAcceptGroup}
      handleDeclineGroup={handleDeclineGroup}
    />
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-white">
      {/* Sidebar - Always visible on desktop, conditional on mobile */}
      <div className={`w-full md:w-[380px] border-r border-slate-100 shrink-0 ${selectedChatMobile ? 'hidden md:block' : 'block'}`}>
        {renderChatList()}
      </div>

      {/* Main Panel */}
      {!currentRoomInfo ? (
        /* Welcome Screen */
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-50 text-slate-400 p-8 text-center">
          <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl shadow-slate-200/50 border border-slate-100">
             <Video className="w-10 h-10 text-indigo-200" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Bem-vindo ao Hubify Chat</h3>
          <p className="max-w-xs text-sm leading-relaxed">Selecione uma conversa ou inicie um novo grupo para começar a colaborar.</p>
        </div>
      ) : (
        /* Active Chat Room */
        <div className={`flex-1 flex flex-col bg-white h-dynamic-screen overflow-hidden ${!selectedChatMobile ? 'hidden md:flex' : 'flex'}`}>
          <div className="h-16 shrink-0 px-4 md:px-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <button className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all" onClick={() => { setSelectedChatMobile(false); setActiveRoomId(null); }}>
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="relative group cursor-pointer" onClick={() => setShowChatInfo(true)}>
                {currentRoomInfo?.isGroup ? (
                  currentRoomInfo?.avatarUrl ? (
                    <img src={currentRoomInfo?.avatarUrl} alt={currentRoomInfo?.name} className="w-10 h-10 rounded-xl bg-slate-100 object-cover shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-indigo-100 shadow-lg">{currentRoomInfo?.avatar}</div>
                  )
                ) : (
                  <img src={currentRoomInfo?.avatarUrl} alt={currentRoomInfo?.name} className="w-10 h-10 rounded-xl bg-slate-100 object-cover shadow-sm" />
                )}
              </div>
              <div className="cursor-pointer" onClick={() => setShowChatInfo(true)}>
                <h2 className="text-base font-black text-slate-800 leading-tight truncate max-w-[150px] md:max-w-[300px]">
                  {currentRoomInfo?.name}
                </h2>
                <div className="flex items-center gap-2">
                  {(() => {
                    if (!currentRoomInfo) return null;
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

                    if (currentRoomInfo?.isGroup) {
                      return (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {currentRoomInfo?.members?.length || 0} Membros
                          </span>
                        </>
                      );
                    }

                    const isOnline = currentRoomInfo?.isOnline;
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

              {(!currentRoomInfo?.isDM || currentRoomInfo?.id !== user.id) && (
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
                  <MoreHorizontal className="w-5 h-5" />
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

                    <button 
                      onClick={() => { setShowWallpaperModal(true); setShowMoreMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-indigo-600" />
                      Papel de Parede
                    </button>

                    <div className="h-[1px] bg-slate-50 my-1" />

                    <button 
                      onClick={() => { setRoomToDelete(currentRoomInfo); setShowMoreMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 font-bold transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      {currentRoomInfo?.isGroup ? 'Sair do grupo' : 'Excluir conversa'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-[#FDFDFD] relative overflow-hidden">
            {/* Papel de Parede Camada */}
            <div 
              className="absolute inset-0 z-0 pointer-events-none transition-all duration-700"
              style={{ 
                backgroundColor: currentWallpaper.color,
                backgroundImage: currentWallpaper.pattern,
                backgroundSize: '400px',
                opacity: 1
              }}
            />

            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar relative z-10"
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
                        <img src={sender?.avatarUrl || "/image/sem_foto.avif"} className="w-8 h-8 rounded-lg bg-slate-100 shrink-0 shadow-sm" alt="Avatar" />
                      )}
                      {!isMine && !showAvatar && <div className="w-8 shrink-0" />}
                      
                      <div className="flex flex-col gap-1">
                        {!isMine && showAvatar && <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase tracking-wider">{sender?.name}</span>}
                        
                        {!msg.isDeleted && (
                          <div className={`flex relative ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <button 
                              onClick={() => setActiveMessageMenuId(activeMessageMenuId === msg.id ? null : msg.id)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                              title="Opções"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            
                            {activeMessageMenuId === msg.id && (
                              <div 
                                ref={messageMenuRef}
                                className={`absolute top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-200 ${isMine ? 'right-0' : 'left-0'}`}
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

                                {isMine && (
                                  <>
                                    <div className="h-[1px] bg-slate-50 my-1" />
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
                            <p className={`text-sm leading-relaxed font-medium break-words ${msg.isDeleted ? 'italic opacity-60 text-slate-500' : ''}`}>{msg.text}</p>
                          )}
                        </div>
                        <div className={`flex items-center gap-2 relative ${isMine ? 'justify-end' : ''}`}>
                          {msg.isEdited && (
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter italic flex items-center gap-0.5">
                              <Edit size={8} /> Editada
                            </span>
                          )}
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          
                          {isMine && (
                            <div className="flex items-center ml-1">
                              {(() => {
                                const recipientTs = recipientReadTimestamps[activeRoomId];
                                const isRead = recipientTs >= msg.timestamp;
                                return <ReadIndicator isRead={!!isRead} size={14} />;
                              })()}
                            </div>
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
                
                <div className="flex-1 relative flex items-center">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!showEmojiPicker) {
                        messageInputRef.current?.blur();
                      }
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                    className={`absolute left-2 z-10 w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                      showEmojiPicker 
                        ? 'text-indigo-600' 
                        : 'text-slate-400 hover:text-indigo-600'
                    }`}
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <input 
                    ref={messageInputRef}
                    type="text" 
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      setTyping(true);
                      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                      typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);
                    }}
                    placeholder="Escreva uma mensagem..."
                    className="w-full bg-slate-50 border border-slate-100 text-slate-700 rounded-2xl pl-12 pr-5 py-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />

                  {showEmojiPicker && (
                    <div 
                      className="hidden md:block absolute bottom-full left-0 mb-2 z-[100] animate-in slide-in-from-bottom-2 duration-200 shadow-2xl rounded-2xl overflow-hidden border border-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EmojiPicker 
                        onEmojiClick={(emojiData) => {
                          setNewMessage(prev => prev + emojiData.emoji);
                          messageInputRef.current?.focus();
                        }}
                        width={320}
                        height={400}
                        searchDisabled={false}
                        skinTonesDisabled={true}
                        previewConfig={{ showPreview: false }}
                      />
                    </div>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={!newMessage.trim() && !pendingFile}
                  className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 transition-all active:scale-95 shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
            
            <div className="md:hidden">
              {showEmojiPicker && (
                <div 
                  className="w-full bg-slate-50 border-t border-slate-100 animate-in slide-in-from-bottom-2 duration-200 flex" 
                  style={{ height: '400px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <EmojiPicker 
                    onEmojiClick={(emojiData) => {
                      setNewMessage(prev => prev + emojiData.emoji);
                    }}
                    width="100%"
                    height="100%"
                    searchDisabled={false}
                    skinTonesDisabled={true}
                    previewConfig={{ showPreview: false }}
                  />
                </div>
              )}
            </div>

            </div>
          </div>


        </div>
      )}

      {/* Info Sidebar */}
      {showChatInfo && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[45] md:hidden" onClick={() => setShowChatInfo(false)} />
          <div className="absolute top-0 right-0 h-full w-[320px] bg-white border-l border-slate-100 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-800 text-lg">Informações</h3>
              <button onClick={() => setShowChatInfo(false)} className="p-2 text-slate-400 hover:bg-white rounded-xl transition-all shadow-sm">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              <div className="text-center">
                <div className="relative inline-block group mb-4">
                  {currentRoomInfo?.isGroup ? (
                    currentRoomInfo?.avatarUrl ? (
                      <img src={currentRoomInfo?.avatarUrl} className="w-24 h-24 rounded-3xl object-cover shadow-2xl shadow-indigo-100" alt="" />
                    ) : (
                      <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-indigo-100">{currentRoomInfo?.avatar}</div>
                    )
                  ) : (
                    <img src={currentRoomInfo?.avatarUrl} className="w-24 h-24 rounded-3xl object-cover shadow-2xl" alt="" />
                  )}
                  
                  {currentRoomInfo?.isGroup && currentRoomInfo?.createdBy === user?.id && (
                    <button 
                      onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                      className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 text-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white hover:bg-indigo-700 transition-all active:scale-90 z-10"
                      title="Alterar imagem do grupo"
                    >
                      <Camera size={18} />
                    </button>
                  )}

                  {!currentRoomInfo?.isGroup && (
                    <div className={`absolute -bottom-2 -right-2 w-8 h-8 border-4 border-white rounded-2xl shadow-lg ${currentRoomInfo?.isOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
                  )}

                  {showAvatarPicker && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 z-[60] animate-in slide-in-from-top-4 duration-300">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alterar Foto</span>
                        <button onClick={() => setShowAvatarPicker(false)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                      </div>
                      <div className="space-y-3">
                        <input 
                          type="file" 
                          ref={groupSidebarFileInputRef} 
                          onChange={handleGroupSidebarFileChange} 
                          className="hidden" 
                          accept="image/*" 
                        />
                        <button 
                          onClick={() => groupSidebarFileInputRef.current.click()}
                          className="w-full py-4 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-100 transition-all border-2 border-dashed border-indigo-200 flex items-center justify-center gap-2"
                        >
                          <Edit size={14} /> Editar Foto
                        </button>

                        {currentRoomInfo?.avatarUrl && (
                          <button 
                            onClick={() => {
                              handleUpdateGroup(currentRoomInfo.id, { avatarUrl: null });
                              setShowAvatarPicker(false);
                            }}
                            className="w-full py-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                          >
                            <Trash2 size={14} /> Remover Foto
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <h4 className="font-black text-xl text-slate-800">{currentRoomInfo?.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {currentRoomInfo?.isGroup ? 'Grupo de Trabalho' : (currentRoomInfo?.isOnline ? 'Online agora' : 'Offline')}
                </p>
              </div>

              {!currentRoomInfo?.isGroup && recipient && (
                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <FileText size={16} />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail Corporativo</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 ml-11">{recipient.email}</p>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <ShieldCheck size={16} />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo / Departamento</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 ml-11">{recipient.role || 'Colaborador Hubify'}</p>
                  </div>
                </div>
              )}

              {currentRoomInfo?.isGroup && (
                <div className="space-y-6 pt-4 border-t border-slate-50">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-black text-slate-800 uppercase text-[11px] tracking-widest flex items-center gap-2">
                        <Plus className="w-4 h-4 text-indigo-600" /> Membros ({currentRoomInfo?.members?.length || 0})
                      </h5>
                      <button 
                        onClick={() => setShowAddMemberModal(true)}
                        className="text-[10px] font-black text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Convidar
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(currentRoomInfo?.members || []).map(mId => {
                        const m = users.find(u => u.id === mId);
                        const isAdmin = currentRoomInfo?.createdBy === mId;
                        return (
                          <div key={mId} className="flex items-center justify-between group/member p-2 rounded-xl hover:bg-slate-50 transition-all">
                            <div className="flex items-center gap-3">
                              <img src={m?.avatarUrl || "/image/sem_foto.avif"} className="w-9 h-9 rounded-xl shadow-sm" alt="" />
                              <div>
                                <p className="text-xs font-bold text-slate-800">{m?.name || 'Usuário'}</p>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-black uppercase tracking-tighter ${isAdmin ? 'text-indigo-600' : 'text-slate-400'}`}>
                                    {isAdmin ? 'Administrador' : 'Membro'}
                                  </span>
                                  {m?.isOnline && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                                </div>
                              </div>
                            </div>
                            {currentRoomInfo?.createdBy === user?.id && mId !== user?.id && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleRemoveMember(currentRoomInfo?.id, mId); }}
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
                </div>
              )}
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
                    {room?.isGroup ? (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">{room?.avatar}</div>
                    ) : (
                      <div className="relative">
                        <img src={room?.avatarUrl} className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-110 transition-transform" alt="" />
                        {room?.isOnline && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-white rounded-full" />}
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{room?.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{room?.isGroup ? 'Grupo' : 'Contato'}</p>
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

      {/* GLOBAL DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {roomToDelete && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000]"
              onClick={() => setRoomToDelete(null)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-[2001] p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl pointer-events-auto text-center"
              >
                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-10 h-10 text-red-500" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {roomToDelete?.isGroup ? 'Sair do grupo?' : 'Excluir conversa?'}
                </h3>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                  Tem certeza que deseja {roomToDelete?.isGroup ? 'sair do grupo' : 'excluir esta conversa'}? 
                  Esta ação não poderá ser desfeita e todas as mensagens serão perdidas.
                </p>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => { handleDeleteRoom(roomToDelete.id); setRoomToDelete(null); }}
                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-200 active:scale-95"
                  >
                    Confirmar e Excluir
                  </button>
                  <button 
                    onClick={() => setRoomToDelete(null)}
                    className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold rounded-2xl transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Papel de Parede */}
      <AnimatePresence>
        {showWallpaperModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowWallpaperModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Papel de Parede</h3>
                <button onClick={() => setShowWallpaperModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {wallpapers.map((wp) => (
                  <button
                    key={wp.id}
                    onClick={() => { handleUpdateRoomWallpaper(activeRoomId, wp.id); setShowWallpaperModal(false); }}
                    className={`group relative aspect-video rounded-2xl border-2 transition-all overflow-hidden ${currentWallpaper.id === wp.id ? 'border-indigo-600 shadow-lg shadow-indigo-100' : 'border-slate-100 hover:border-indigo-200'}`}
                  >
                    <div className="absolute inset-0 z-0" style={{ backgroundColor: wp.color, backgroundImage: wp.pattern, backgroundSize: '60px' }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">{wp.name}</div>
                    {currentWallpaper.id === wp.id && (
                      <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-full shadow-lg">
                        <ShieldCheck className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
