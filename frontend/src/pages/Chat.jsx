import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, SendHorizontal, Trash2, Phone, Video, ChevronLeft, ChevronDown, Camera,
  Image as ImageIcon, FileText, Download, X, Plus, FileSpreadsheet, FileCode, FileArchive,
  Bell, BellOff, Pencil, CornerUpLeft, Copy, Forward, CheckCircle2, Circle, Smile, Check,
  Info, MoreVertical, Mail, Briefcase, UserPlus, Ban, Lock, Palette, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/chat/ChatList';
import EmojiPicker from 'emoji-picker-react';
import ReadIndicator from '../components/common/ReadIndicator';
import Avatar, { colorFor, presenceOf, PRESENCE } from '../components/ui/Avatar';
import { formatTime, formatDaySeparator } from '../utils/format';

const WALLPAPERS = [
  { id: 'padrao', name: 'Padrão' },
  { id: 'pontos', name: 'Pontos' },
  { id: 'linhas', name: 'Linhas' },
  { id: 'nenhum', name: 'Liso' },
];
// Ids antigos salvos antes do redesign
const LEGACY_WALLPAPER = { none: 'padrao', dots: 'pontos', lines: 'linhas', circuit: 'padrao', topography: 'padrao' };

const isDarkTheme = () => document.documentElement.classList.contains('dark');
const isTouch = () => window.matchMedia('(hover: none)').matches;

export default function Chat() {
  const {
    chatRooms, activeRoomId, setActiveRoomId, allMessages,
    handleSendMessage, users,
    handleStartMeeting, handleStartAudioCall,
    selectedChatMobile, setSelectedChatMobile,
    readTimestamps, otherUsersReadTimestamps, setShowDMModal, setShowGroupModal,
    groupInvites, setView, showChatInfo, setShowChatInfo,
    setPreviewDocument, setShowAddMemberModal,
    handleRemoveMember, handleUpdateGroup,
    handleDeleteMessage, handleEditMessage, handleForwardMessages,
    typingUsers, setTyping, mutedRooms, toggleMuteRoom,
    setRoomToDelete, roomToDelete, handleDeleteRoom, handleAcceptGroup, handleDeclineGroup,
    roomWallpapers, handleUpdateRoomWallpaper
  } = useChat();
  const { user } = useAuth();

  const [newMessage, setNewMessage] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const attachmentMenuRef = useRef(null);
  const [activeMessageMenuId, setActiveMessageMenuId] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [isForwardMode, setIsForwardMode] = useState(false);
  const [selectedForwardMessages, setSelectedForwardMessages] = useState([]);
  const [showForwardTargetModal, setShowForwardTargetModal] = useState(false);
  const messageMenuRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const groupSidebarFileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);

  const savedWallpaper = roomWallpapers && roomWallpapers[activeRoomId];
  const wallpaperId = LEGACY_WALLPAPER[savedWallpaper] || savedWallpaper || 'padrao';

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

  const recipient = useMemo(() => {
    if (!activeRoomId?.startsWith('dm_')) return null;
    const otherId = activeRoomId.replace('dm_', '').split('_').find(id => id !== user?.id);
    return users.find(u => u.id === otherId);
  }, [activeRoomId, users, user?.id]);

  // Lido/não lido vem só do Socket.IO (otherUsersReadTimestamps)
  const recipientReadTimestamps = useMemo(() => {
    let otherId = recipient?.id;
    if (!otherId && activeRoomId?.startsWith('dm_')) {
      otherId = activeRoomId.replace('dm_', '').split('_').find(id => id !== user?.id);
    }
    return otherId ? (otherUsersReadTimestamps[otherId] || {}) : {};
  }, [recipient?.id, otherUsersReadTimestamps, activeRoomId, user?.id]);

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return { Icon: FileText, color: 'text-white bg-[#e2574c]' };
      case 'doc':
      case 'docx': return { Icon: FileText, color: 'text-white bg-[#2b579a]' };
      case 'xls':
      case 'xlsx': return { Icon: FileSpreadsheet, color: 'text-white bg-[#217346]' };
      case 'ppt':
      case 'pptx': return { Icon: FileText, color: 'text-white bg-[#d24726]' };
      case 'zip':
      case 'rar': return { Icon: FileArchive, color: 'text-white bg-[#8764b8]' };
      default: return { Icon: FileCode, color: 'text-white bg-ink-3' };
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
        id_contact: otherUser.id,
        isOnline: otherUser.isOnline,
        status: otherUser.status,
        members: [user?.id, otherUser.id]
      };
    }
  }
  const isGroup = !!currentRoomInfo?.isGroup;
  const currentMessages = (allMessages || [])
    .filter(m => m.roomId === activeRoomId)
    .filter(m => !msgSearchQuery || (m.text || '').toLowerCase().includes(msgSearchQuery.toLowerCase()));

  const shouldShowDateSeparator = (index) => {
    if (index === 0) return true;
    return new Date(currentMessages[index - 1].timestamp).toDateString() !== new Date(currentMessages[index].timestamp).toDateString();
  };

  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setShowScrollButton(true);
    }
  }, [currentMessages.length, isAtBottom]);

  // Ao trocar de conversa, limpa estados da conversa anterior
  useEffect(() => {
    setShowSearch(false);
    setMsgSearchQuery('');
    setReplyingToMessage(null);
    setEditingMessage(null);
    setIsForwardMode(false);
    setSelectedForwardMessages([]);
    setIsAtBottom(true);
    setTimeout(() => messagesEndRef.current?.scrollIntoView(), 0);
  }, [activeRoomId]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(atBottom);
    if (atBottom) setShowScrollButton(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMoreMenu(false);
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) setShowAttachmentMenu(false);
      if (messageMenuRef.current && !messageMenuRef.current.contains(event.target)) setActiveMessageMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Campo de texto cresce com o conteúdo (até ~5 linhas)
  useEffect(() => {
    const el = messageInputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [newMessage]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("O arquivo excede o limite de 25MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPendingFile({ name: file.name, type: file.type, size: file.size, data: event.target.result });
      setShowAttachmentMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const onSubmit = (e) => {
    e?.preventDefault();
    if (!newMessage.trim() && !pendingFile) return;

    if (editingMessage) {
      handleEditMessage(editingMessage.id, newMessage);
      setEditingMessage(null);
      setNewMessage('');
    } else {
      handleSendMessage(newMessage, pendingFile, replyingToMessage?.id);
      setNewMessage('');
      setPendingFile(null);
      setReplyingToMessage(null);
    }
    setShowEmojiPicker(false);
    setIsAtBottom(true);
  };

  const toggleForwardSelection = (msgId) => {
    setSelectedForwardMessages(prev => prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]);
  };

  const onForwardMessages = (targetRoomIds) => {
    handleForwardMessages(selectedForwardMessages, targetRoomIds);
    setIsForwardMode(false);
    setSelectedForwardMessages([]);
    setShowForwardTargetModal(false);
  };

  const jumpToMessage = (id) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('msg-highlight');
    void el.offsetWidth;
    el.classList.add('msg-highlight');
  };

  const typingOthers = Object.entries(typingUsers[activeRoomId] || {}).filter(([id]) => id !== user?.id);
  const roomPresence = !isGroup && currentRoomInfo ? presenceOf(recipient || currentRoomInfo) : null;
  const headerSubtitle = (() => {
    if (!currentRoomInfo) return '';
    if (typingOthers.length > 0) {
      return typingOthers.length === 1 && !isGroup ? 'digitando...' : `${typingOthers.map(([, n]) => n.split(' ')[0]).join(', ')} digitando...`;
    }
    if (isGroup) {
      const names = (currentRoomInfo.members || []).map(id => id === user?.id ? 'Você' : users.find(u => u.id === id)?.name?.split(' ')[0]).filter(Boolean);
      return names.join(', ');
    }
    return roomPresence === 'online' ? 'online' : PRESENCE[roomPresence]?.label;
  })();

  const memberName = (msg) => users.find(u => u.id === msg.senderId)?.name || msg.senderName || 'Usuário';

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-surface">
      <aside className={`w-full md:w-[340px] lg:w-[400px] md:border-r border-line shrink-0 h-full ${selectedChatMobile ? 'hidden md:flex' : 'flex'}`}>
        <ChatList
          chatRooms={chatRooms}
          activeRoomId={activeRoomId}
          setActiveRoomId={(id) => { setActiveRoomId(id); setSelectedChatMobile(true); }}
          allMessages={allMessages}
          user={user}
          users={users}
          readTimestamps={readTimestamps || {}}
          setShowDMModal={setShowDMModal}
          setShowGroupModal={setShowGroupModal}
          setSelectedChatMobile={setSelectedChatMobile}
          groupInvites={groupInvites}
          onViewInvitations={() => setView('invitations')}
          mutedRooms={mutedRooms}
          setShowChatInfo={setShowChatInfo}
          toggleMuteRoom={toggleMuteRoom}
          setRoomToDelete={setRoomToDelete}
          handleAcceptGroup={handleAcceptGroup}
          handleDeclineGroup={handleDeclineGroup}
        />
      </aside>

      {!currentRoomInfo ? (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-chat-header text-center px-8 border-b-[6px] border-chat-accent">
          <div className="w-20 h-20 rounded-full bg-chat-accent/15 flex items-center justify-center mb-6">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-chat-accent" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20.5l1.5-4.6A8.4 8.4 0 1 1 21 11.5z" />
              <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
            </svg>
          </div>
          <h3 className="text-3xl font-light text-ink mb-3">Hubify Chat</h3>
          <p className="max-w-md text-ink-2 leading-relaxed">
            Converse com sua equipe em tempo real, compartilhe arquivos e inicie chamadas de vídeo direto da conversa.
          </p>
          <div className="flex gap-2 mt-6">
            <button onClick={() => setShowDMModal(true)} className="btn-primary">Nova conversa</button>
            <button onClick={() => setShowGroupModal(true)} className="btn-secondary">Novo grupo</button>
          </div>
          <p className="mt-10 text-xs text-ink-3 flex items-center gap-1.5"><Lock className="w-3 h-3" /> Conversas privadas da sua equipe</p>
        </div>
      ) : (
        <section className={`flex-1 flex flex-col min-w-0 h-full ${!selectedChatMobile ? 'hidden md:flex' : 'flex'}`}>
          {/* Cabeçalho da conversa */}
          <header className="h-[60px] shrink-0 bg-chat-header px-2 md:px-4 flex items-center gap-2 md:gap-3 border-b border-line/60 z-30">
            <button className="md:hidden icon-btn w-9 h-9" onClick={() => { setSelectedChatMobile(false); setActiveRoomId(null); }}>
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button className="flex items-center gap-3 min-w-0 flex-1 text-left" onClick={() => setShowChatInfo(true)}>
              <Avatar src={currentRoomInfo.avatarUrl} name={currentRoomInfo.name} size={40} status={roomPresence} />
              <div className="min-w-0">
                <h2 className="text-[16px] text-ink truncate leading-tight">{currentRoomInfo.name}</h2>
                <p className={`text-[13px] truncate leading-tight mt-0.5 ${typingOthers.length ? 'text-chat-accent' : 'text-ink-2'}`}>{headerSubtitle}</p>
              </div>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              {showSearch ? (
                <div className="flex items-center h-9 bg-surface rounded-lg px-2 border border-line">
                  <Search className="w-4 h-4 text-ink-3 mr-2" />
                  <input
                    autoFocus
                    value={msgSearchQuery}
                    onChange={(e) => setMsgSearchQuery(e.target.value)}
                    placeholder="Pesquisar mensagens"
                    className="bg-transparent outline-none text-sm w-28 md:w-52 text-ink placeholder:text-ink-3"
                  />
                  <button onClick={() => { setShowSearch(false); setMsgSearchQuery(''); }} className="text-ink-3 hover:text-ink"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <>
                  {currentRoomInfo.id !== user.id && (
                    <div className="flex items-center rounded-md border border-line bg-surface overflow-hidden mr-1">
                      <button onClick={() => handleStartMeeting()} className="h-8 px-2.5 flex items-center gap-1.5 text-ink-2 hover:bg-hover hover:text-ink" title="Chamada de vídeo">
                        <Video className="w-[18px] h-[18px]" />
                      </button>
                      <span className="w-px h-5 bg-line" />
                      <button onClick={() => handleStartAudioCall()} className="h-8 px-2.5 flex items-center text-ink-2 hover:bg-hover hover:text-ink" title="Chamada de áudio">
                        <Phone className="w-[17px] h-[17px]" />
                      </button>
                    </div>
                  )}
                  <button onClick={() => setShowSearch(true)} className="icon-btn w-9 h-9" title="Pesquisar mensagens">
                    <Search className="w-[18px] h-[18px]" />
                  </button>
                </>
              )}

              <div className="relative" ref={menuRef}>
                <button onClick={() => setShowMoreMenu(!showMoreMenu)} className={`icon-btn w-9 h-9 ${showMoreMenu ? 'bg-hover text-ink' : ''}`} title="Mais opções">
                  <MoreVertical className="w-[18px] h-[18px]" />
                </button>
                {showMoreMenu && (
                  <div className="menu absolute right-0 top-full mt-1 w-60 z-50">
                    <button onClick={() => { setShowChatInfo(true); setShowMoreMenu(false); }} className="menu-item">
                      <Info className="w-4 h-4 text-ink-2" /> Dados {isGroup ? 'do grupo' : 'do contato'}
                    </button>
                    <button onClick={() => { setIsForwardMode(true); setShowMoreMenu(false); }} className="menu-item">
                      <CheckCircle2 className="w-4 h-4 text-ink-2" /> Selecionar mensagens
                    </button>
                    <button onClick={() => { toggleMuteRoom(activeRoomId); setShowMoreMenu(false); }} className="menu-item">
                      {mutedRooms?.includes(activeRoomId)
                        ? <><Bell className="w-4 h-4 text-ink-2" /> Reativar notificações</>
                        : <><BellOff className="w-4 h-4 text-ink-2" /> Silenciar notificações</>}
                    </button>
                    <button onClick={() => { setShowWallpaperModal(true); setShowMoreMenu(false); }} className="menu-item">
                      <Palette className="w-4 h-4 text-ink-2" /> Papel de parede
                    </button>
                    <div className="border-t border-line my-1" />
                    <button onClick={() => { setRoomToDelete(currentRoomInfo); setShowMoreMenu(false); }} className="menu-item text-danger">
                      {isGroup ? <LogOut className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                      {isGroup ? 'Sair do grupo' : 'Apagar conversa'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Mensagens */}
          <div className={`flex-1 min-h-0 relative chat-wallpaper wp-${wallpaperId}`}>
            <div ref={scrollContainerRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto custom-scrollbar px-3 md:px-[6%] py-3">
              {currentMessages.length === 0 && (
                <div className="flex justify-center mt-6">
                  <span className="bg-[#ffeecd] dark:bg-[#1d2a30] text-[#54656f] dark:text-[#ffd279] text-xs rounded-lg px-3 py-2 shadow-bubble max-w-sm text-center flex items-center gap-1.5">
                    <Lock className="w-3 h-3 shrink-0" />
                    {msgSearchQuery ? 'Nenhuma mensagem encontrada.' : 'Envie a primeira mensagem para começar a conversa.'}
                  </span>
                </div>
              )}

              {currentMessages.map((msg, index) => {
                const isMine = msg.senderId === user.id;
                const showDateSeparator = shouldShowDateSeparator(index);
                const firstOfGroup = showDateSeparator || index === 0 || currentMessages[index - 1].senderId !== msg.senderId;
                const selected = selectedForwardMessages.includes(msg.id);
                const repliedTo = msg.replyToId ? allMessages.find(m => m.id === msg.replyToId) : null;
                const isRead = (recipientReadTimestamps[activeRoomId] || 0) >= msg.timestamp;
                const onlyImage = msg.attachment?.type?.startsWith('image/') && !msg.text;
                const name = memberName(msg);

                return (
                  <React.Fragment key={msg.id}>
                    {showDateSeparator && (
                      <div className="flex justify-center my-3 sticky top-1 z-10">
                        <span className="bg-surface text-ink-2 text-[12.5px] px-3 py-1.5 rounded-lg shadow-bubble">
                          {formatDaySeparator(msg.timestamp)}
                        </span>
                      </div>
                    )}
                    <div
                      id={`msg-${msg.id}`}
                      onClick={isForwardMode ? () => toggleForwardSelection(msg.id) : undefined}
                      className={`flex items-center gap-2 rounded-md transition-colors ${firstOfGroup ? 'mt-3' : 'mt-0.5'} ${isForwardMode ? 'cursor-pointer -mx-2 px-2 py-0.5' : ''} ${selected ? 'bg-chat-accent/10' : ''}`}
                    >
                      {isForwardMode && (
                        <span className={`shrink-0 ${selected ? 'text-chat-accent' : 'text-ink-3'}`}>
                          {selected ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </span>
                      )}
                      <div className={`flex-1 flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          onContextMenu={(e) => { if (!msg.isDeleted && !isForwardMode) { e.preventDefault(); setActiveMessageMenuId(msg.id); } }}
                          onClick={() => { if (isTouch() && !msg.isDeleted && !isForwardMode) setActiveMessageMenuId(activeMessageMenuId === msg.id ? null : msg.id); }}
                          className={`group relative max-w-[88%] md:max-w-[65%] rounded-lg shadow-bubble text-chat-ink text-[14.2px] leading-[19px] ${isMine ? 'bg-chat-out' : 'bg-chat-in'} ${firstOfGroup ? (isMine ? 'bubble-tail-out rounded-tr-none' : 'bubble-tail-in rounded-tl-none') : ''} ${onlyImage ? 'p-1' : 'px-2 pt-1.5 pb-2'}`}
                        >
                          {/* Menu da mensagem */}
                          {!msg.isDeleted && !isForwardMode && (
                            <div className="absolute top-0.5 right-0.5 z-10" ref={activeMessageMenuId === msg.id ? messageMenuRef : null}>
                              <button
                                onClick={(e) => { e.stopPropagation(); setActiveMessageMenuId(activeMessageMenuId === msg.id ? null : msg.id); }}
                                className={`w-6 h-6 flex items-center justify-center rounded-full text-chat-meta transition-opacity ${isMine ? 'bg-chat-out' : 'bg-chat-in'} ${activeMessageMenuId === msg.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 [@media(hover:none)]:hidden'}`}
                                title="Opções"
                              >
                                <ChevronDown size={18} />
                              </button>
                              {activeMessageMenuId === msg.id && (
                                <div className={`menu absolute top-full mt-1 w-48 z-20 ${isMine ? 'right-0' : 'left-0'}`}>
                                  <button onClick={() => { setReplyingToMessage(msg); setActiveMessageMenuId(null); messageInputRef.current?.focus(); }} className="menu-item">
                                    <CornerUpLeft className="w-4 h-4 text-ink-2" /> Responder
                                  </button>
                                  {msg.text && (
                                    <button onClick={() => { navigator.clipboard.writeText(msg.text); setActiveMessageMenuId(null); }} className="menu-item">
                                      <Copy className="w-4 h-4 text-ink-2" /> Copiar
                                    </button>
                                  )}
                                  <button onClick={() => { setIsForwardMode(true); setSelectedForwardMessages([msg.id]); setActiveMessageMenuId(null); }} className="menu-item">
                                    <Forward className="w-4 h-4 text-ink-2" /> Encaminhar
                                  </button>
                                  {isMine && (
                                    <>
                                      {msg.text && Date.now() - msg.timestamp < 5 * 60 * 1000 && (
                                        <button onClick={() => { setEditingMessage(msg); setNewMessage(msg.text); setActiveMessageMenuId(null); messageInputRef.current?.focus(); }} className="menu-item">
                                          <Pencil className="w-4 h-4 text-ink-2" /> Editar
                                        </button>
                                      )}
                                      <div className="border-t border-line my-1" />
                                      <button onClick={() => { handleDeleteMessage(msg.id); setActiveMessageMenuId(null); }} className="menu-item text-danger">
                                        <Trash2 className="w-4 h-4" /> Apagar
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {isGroup && !isMine && firstOfGroup && !onlyImage && (
                            <p className="text-[12.8px] font-semibold mb-0.5 pr-5" style={{ color: colorFor(name) }}>{name}</p>
                          )}

                          {msg.isForwarded && (
                            <p className="flex items-center gap-1 text-[12px] italic text-chat-meta mb-0.5"><Forward size={12} /> Encaminhada</p>
                          )}

                          {msg.replyToId && (
                            <button
                              onClick={(e) => { e.stopPropagation(); jumpToMessage(msg.replyToId); }}
                              className="block w-full text-left mb-1 rounded-md bg-black/5 dark:bg-black/25 border-l-4 overflow-hidden px-2 py-1"
                              style={{ borderColor: repliedTo ? colorFor(repliedTo.senderName || '') : undefined }}
                            >
                              <span className="block text-[12.8px] font-semibold truncate" style={{ color: repliedTo ? colorFor(repliedTo.senderName || '') : undefined }}>
                                {repliedTo ? (repliedTo.senderId === user.id ? 'Você' : repliedTo.senderName) : 'Mensagem'}
                              </span>
                              <span className="block text-[13px] text-chat-meta truncate">
                                {repliedTo?.text || (repliedTo?.attachment ? '📎 Arquivo' : 'Mensagem não encontrada')}
                              </span>
                            </button>
                          )}

                          {msg.attachment && (
                            msg.attachment.type?.startsWith('image/') ? (
                              <div className={`relative ${msg.text ? 'mb-1 -mx-1 -mt-0.5' : ''}`}>
                                <img
                                  src={msg.attachment.data}
                                  alt={msg.attachment.name}
                                  className="max-h-[330px] w-full min-w-[200px] object-cover rounded-md cursor-pointer"
                                  onClick={(e) => { e.stopPropagation(); setPreviewDocument(msg.attachment); }}
                                />
                                {onlyImage && (
                                  <span className="absolute bottom-1.5 right-2 flex items-center gap-1 text-[11px] text-white drop-shadow">
                                    {formatTime(msg.timestamp)}
                                    {isMine && !isGroup && <ReadIndicator isRead={isRead} className={isRead ? '' : '!text-white'} />}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div onClick={(e) => { e.stopPropagation(); setPreviewDocument(msg.attachment); }} className="flex items-center gap-3 p-2 mb-1 rounded-md bg-black/5 dark:bg-black/20 cursor-pointer min-w-[240px]">
                                {(() => { const { Icon, color } = getFileIcon(msg.attachment.name); return <span className={`w-9 h-11 rounded flex items-center justify-center shrink-0 ${color}`}><Icon size={18} /></span>; })()}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13.5px] truncate">{msg.attachment.name}</p>
                                  <p className="text-[11.5px] text-chat-meta">{msg.attachment.name.split('.').pop().toUpperCase()} · {(msg.attachment.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <a href={msg.attachment.data} download={msg.attachment.name} onClick={(e) => e.stopPropagation()} className="w-8 h-8 rounded-full border border-chat-meta/40 flex items-center justify-center text-chat-meta hover:text-chat-ink" title="Baixar">
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            )
                          )}

                          {msg.text && (
                            <p className={`whitespace-pre-wrap break-words ${msg.isDeleted ? 'italic text-chat-meta flex items-center gap-1.5' : ''}`}>
                              {msg.isDeleted && <Ban className="w-3.5 h-3.5" />}
                              {msg.isDeleted ? 'Mensagem apagada' : msg.text}
                              {/* Espaço reservado para a hora não sobrepor o texto */}
                              <span className="inline-block align-bottom" style={{ width: (isMine && !isGroup ? 58 : 40) + (msg.isEdited ? 42 : 0) }} />
                            </p>
                          )}

                          {!onlyImage && (
                            <span className="absolute bottom-1 right-2 flex items-center gap-1 text-[11px] text-chat-meta leading-none">
                              {msg.isEdited && <span>editada</span>}
                              {formatTime(msg.timestamp)}
                              {isMine && !isGroup && !msg.isDeleted && <ReadIndicator isRead={isRead} />}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {showScrollButton && !isAtBottom && (
              <button
                onClick={() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowScrollButton(false); }}
                className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-surface text-ink-2 shadow-pop flex items-center justify-center hover:text-ink z-20"
                title="Ir para o fim"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Rodapé: seleção para encaminhar OU campo de mensagem */}
          {isForwardMode ? (
            <div className="shrink-0 bg-chat-header px-4 h-[62px] flex items-center gap-4 border-t border-line/60">
              <button onClick={() => { setIsForwardMode(false); setSelectedForwardMessages([]); }} className="icon-btn"><X className="w-5 h-5" /></button>
              <span className="flex-1 text-ink">{selectedForwardMessages.length} selecionada{selectedForwardMessages.length === 1 ? '' : 's'}</span>
              <button disabled={selectedForwardMessages.length === 0} onClick={() => setShowForwardTargetModal(true)} className="w-11 h-11 rounded-full bg-chat-accent text-white flex items-center justify-center disabled:opacity-40" title="Encaminhar">
                <Forward className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="shrink-0 bg-chat-header border-t border-line/60 z-30">
              {(replyingToMessage || editingMessage || pendingFile) && (
                <div className="px-3 md:px-4 pt-2">
                  <div className="flex items-center gap-3 rounded-lg bg-black/5 dark:bg-black/25 border-l-4 border-chat-accent px-3 py-2">
                    {pendingFile ? (
                      pendingFile.type.startsWith('image/')
                        ? <img src={pendingFile.data} alt="" className="w-11 h-11 rounded object-cover" />
                        : <span className="w-11 h-11 rounded bg-surface flex items-center justify-center text-ink-2"><FileText className="w-5 h-5" /></span>
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-chat-accent">
                        {editingMessage ? 'Editando mensagem' : replyingToMessage ? `Respondendo a ${replyingToMessage.senderId === user.id ? 'você' : replyingToMessage.senderName}` : pendingFile.name}
                      </p>
                      <p className="text-[13px] text-ink-2 truncate">
                        {editingMessage ? editingMessage.text : replyingToMessage ? (replyingToMessage.text || '📎 Arquivo') : `${(pendingFile.size / 1024 / 1024).toFixed(2)} MB · pronto para enviar`}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (editingMessage) { setEditingMessage(null); setNewMessage(''); }
                        else if (replyingToMessage) setReplyingToMessage(null);
                        else setPendingFile(null);
                      }}
                      className="icon-btn"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={onSubmit} className="flex items-end gap-1 md:gap-2 px-2 md:px-4 py-2.5">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

                <button
                  type="button"
                  onClick={() => { if (!showEmojiPicker) messageInputRef.current?.blur(); setShowEmojiPicker(!showEmojiPicker); }}
                  className={`icon-btn w-10 h-10 rounded-full shrink-0 ${showEmojiPicker ? 'text-chat-accent' : ''}`}
                  title="Emojis"
                >
                  <Smile className="w-6 h-6" />
                </button>

                <div className="relative shrink-0" ref={attachmentMenuRef}>
                  <button type="button" onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} className={`icon-btn w-10 h-10 rounded-full transition-transform ${showAttachmentMenu ? 'rotate-45 bg-hover' : ''}`} title="Anexar">
                    <Plus className="w-6 h-6" />
                  </button>
                  {showAttachmentMenu && (
                    <div className="menu absolute bottom-full left-0 mb-2 w-52 z-[70]">
                      <button type="button" onClick={() => { fileInputRef.current.accept = "image/*"; fileInputRef.current.click(); }} className="menu-item">
                        <span className="w-8 h-8 rounded-full bg-[#bf59cf] text-white flex items-center justify-center"><ImageIcon className="w-4 h-4" /></span> Fotos
                      </button>
                      <button type="button" onClick={() => { fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"; fileInputRef.current.click(); }} className="menu-item">
                        <span className="w-8 h-8 rounded-full bg-[#7f66ff] text-white flex items-center justify-center"><FileText className="w-4 h-4" /></span> Documento
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 relative">
                  <textarea
                    ref={messageInputRef}
                    rows={1}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      setTyping(true);
                      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                      typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !isTouch()) { e.preventDefault(); onSubmit(); }
                      if (e.key === 'Escape') { setReplyingToMessage(null); if (editingMessage) { setEditingMessage(null); setNewMessage(''); } }
                    }}
                    placeholder="Digite uma mensagem"
                    className="block w-full resize-none bg-surface text-ink rounded-lg px-3 py-[9px] text-[15px] leading-[22px] outline-none placeholder:text-ink-3 custom-scrollbar max-h-[120px]"
                  />

                  {showEmojiPicker && (
                    <div className="hidden md:block absolute bottom-full left-0 mb-3 z-[100] shadow-pop rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                      <EmojiPicker
                        onEmojiClick={(emojiData) => { setNewMessage(prev => prev + emojiData.emoji); messageInputRef.current?.focus(); }}
                        width={340}
                        height={400}
                        theme={isDarkTheme() ? 'dark' : 'light'}
                        skinTonesDisabled
                        previewConfig={{ showPreview: false }}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!newMessage.trim() && !pendingFile}
                  className="w-10 h-10 shrink-0 rounded-full bg-chat-accent text-white flex items-center justify-center transition-opacity disabled:opacity-40"
                  title={editingMessage ? 'Salvar' : 'Enviar'}
                >
                  {editingMessage ? <Check className="w-5 h-5" /> : <SendHorizontal className="w-5 h-5" />}
                </button>
              </form>

              {showEmojiPicker && (
                <div className="md:hidden w-full border-t border-line" style={{ height: 320 }} onClick={(e) => e.stopPropagation()}>
                  <EmojiPicker
                    onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)}
                    width="100%"
                    height="100%"
                    theme={isDarkTheme() ? 'dark' : 'light'}
                    skinTonesDisabled
                    previewConfig={{ showPreview: false }}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Painel de dados do contato / grupo */}
      {showChatInfo && currentRoomInfo && (
        <aside className="fixed inset-0 z-[60] md:static md:z-auto md:w-[360px] shrink-0 bg-app md:border-l border-line flex flex-col animate-slide-left md:animate-fade-in">
          <div className="h-[60px] shrink-0 bg-chat-header px-4 flex items-center gap-4 border-b border-line/60">
            <button onClick={() => setShowChatInfo(false)} className="icon-btn"><X className="w-5 h-5" /></button>
            <h3 className="text-[16px] text-ink">Dados {isGroup ? 'do grupo' : 'do contato'}</h3>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pb-6">
            <div className="bg-surface px-6 py-7 text-center">
              <div className="relative inline-block">
                <Avatar src={currentRoomInfo.avatarUrl} name={currentRoomInfo.name} size={120} />
                {isGroup && currentRoomInfo.createdBy === user?.id && (
                  <button onClick={() => setShowAvatarPicker(!showAvatarPicker)} className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-chat-accent text-white flex items-center justify-center shadow-pop" title="Alterar imagem do grupo">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
                {showAvatarPicker && (
                  <div className="menu absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 z-[70] text-left">
                    <input type="file" ref={groupSidebarFileInputRef} onChange={handleGroupSidebarFileChange} className="hidden" accept="image/*" />
                    <button onClick={() => groupSidebarFileInputRef.current.click()} className="menu-item"><ImageIcon className="w-4 h-4 text-ink-2" /> Carregar foto</button>
                    {currentRoomInfo.avatarUrl && (
                      <button onClick={() => { handleUpdateGroup(currentRoomInfo.id, { avatarUrl: null }); setShowAvatarPicker(false); }} className="menu-item text-danger">
                        <Trash2 className="w-4 h-4" /> Remover foto
                      </button>
                    )}
                  </div>
                )}
              </div>
              <h4 className="text-2xl text-ink mt-4">{currentRoomInfo.name}</h4>
              <p className="text-ink-2 mt-1">
                {isGroup ? `Grupo · ${currentRoomInfo.members?.length || 0} membros` : (recipient?.email || PRESENCE[roomPresence]?.label)}
              </p>
              {currentRoomInfo.id !== user.id && (
                <div className="flex justify-center gap-3 mt-5">
                  <button onClick={() => handleStartAudioCall()} className="w-24 py-3 rounded-lg border border-line flex flex-col items-center gap-1.5 text-chat-accent hover:bg-hover">
                    <Phone className="w-5 h-5" /><span className="text-xs text-ink">Áudio</span>
                  </button>
                  <button onClick={() => handleStartMeeting()} className="w-24 py-3 rounded-lg border border-line flex flex-col items-center gap-1.5 text-chat-accent hover:bg-hover">
                    <Video className="w-5 h-5" /><span className="text-xs text-ink">Vídeo</span>
                  </button>
                  <button onClick={() => { setShowChatInfo(false); setShowSearch(true); }} className="w-24 py-3 rounded-lg border border-line flex flex-col items-center gap-1.5 text-chat-accent hover:bg-hover">
                    <Search className="w-5 h-5" /><span className="text-xs text-ink">Pesquisar</span>
                  </button>
                </div>
              )}
            </div>

            {!isGroup && recipient && (
              <div className="bg-surface px-6 py-4 space-y-4">
                {recipient.bio && (
                  <div>
                    <p className="text-xs text-ink-3 mb-0.5">Recado</p>
                    <p className="text-ink">{recipient.bio}</p>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <Mail className="w-5 h-5 text-ink-3 mt-0.5" />
                  <div><p className="text-ink">{recipient.email || '—'}</p><p className="text-xs text-ink-3">E-mail</p></div>
                </div>
                <div className="flex items-start gap-4">
                  <Briefcase className="w-5 h-5 text-ink-3 mt-0.5" />
                  <div><p className="text-ink">{recipient.role || 'Colaborador'}</p><p className="text-xs text-ink-3">Cargo</p></div>
                </div>
              </div>
            )}

            {isGroup && currentRoomInfo.description && (
              <div className="bg-surface px-6 py-4">
                <p className="text-xs text-ink-3 mb-0.5">Descrição</p>
                <p className="text-ink">{currentRoomInfo.description}</p>
              </div>
            )}

            {isGroup && (
              <div className="bg-surface py-3">
                <p className="px-6 pb-2 text-ink-2 text-sm">{currentRoomInfo.members?.length || 0} membros</p>
                <button onClick={() => setShowAddMemberModal(true)} className="w-full flex items-center gap-4 px-6 py-2.5 hover:bg-hover">
                  <span className="w-10 h-10 rounded-full bg-chat-accent text-white flex items-center justify-center"><UserPlus className="w-5 h-5" /></span>
                  <span className="text-ink">Adicionar membro</span>
                </button>
                {(currentRoomInfo.members || []).map(mId => {
                  const m = users.find(u => u.id === mId);
                  const isAdmin = currentRoomInfo.createdBy === mId;
                  return (
                    <div key={mId} className="group/member flex items-center gap-4 px-6 py-2.5 hover:bg-hover">
                      <Avatar src={m?.avatarUrl} name={m?.name} size={40} status={presenceOf(m)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-ink truncate">{mId === user?.id ? 'Você' : (m?.name || 'Usuário')}</p>
                        <p className="text-xs text-ink-2 truncate">{m?.bio || m?.role || PRESENCE[presenceOf(m)].label}</p>
                      </div>
                      {isAdmin && <span className="pill bg-chat-accent/15 text-chat-accent">Admin</span>}
                      {currentRoomInfo.createdBy === user?.id && mId !== user?.id && (
                        <button onClick={() => handleRemoveMember(currentRoomInfo.id, mId)} className="icon-btn opacity-0 group-hover/member:opacity-100 hover:text-danger" title="Remover do grupo">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-surface py-1">
              <button onClick={() => toggleMuteRoom(activeRoomId)} className="w-full flex items-center gap-4 px-6 py-3 hover:bg-hover text-ink">
                {mutedRooms?.includes(activeRoomId) ? <Bell className="w-5 h-5 text-ink-3" /> : <BellOff className="w-5 h-5 text-ink-3" />}
                {mutedRooms?.includes(activeRoomId) ? 'Reativar notificações' : 'Silenciar notificações'}
              </button>
              <button onClick={() => setRoomToDelete(currentRoomInfo)} className="w-full flex items-center gap-4 px-6 py-3 hover:bg-danger-soft text-danger">
                {isGroup ? <LogOut className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                {isGroup ? 'Sair do grupo' : 'Apagar conversa'}
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Encaminhar para */}
      {showForwardTargetModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowForwardTargetModal(false)}>
          <div className="card w-full max-w-md flex flex-col max-h-[80vh] animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 flex items-center gap-3 border-b border-line">
              <button onClick={() => setShowForwardTargetModal(false)} className="icon-btn"><X className="w-5 h-5" /></button>
              <h3 className="text-lg font-semibold text-ink">Encaminhar mensagem para</h3>
            </div>
            <div className="py-2 overflow-y-auto custom-scrollbar">
              {chatRooms.map(room => (
                <button key={room.id} onClick={() => onForwardMessages([room.id])} className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-hover">
                  <Avatar src={room.avatarUrl} name={room.name} size={40} />
                  <span className="flex-1 text-left">
                    <span className="block text-ink">{room.name}</span>
                    <span className="block text-xs text-ink-2">{room.isGroup ? 'Grupo' : 'Contato'}</span>
                  </span>
                  <Forward className="w-4 h-4 text-ink-3" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de apagar conversa / sair do grupo */}
      <AnimatePresence>
        {roomToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[2000] flex items-center justify-center p-4" onClick={() => setRoomToDelete(null)}>
            <motion.div initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }} className="card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-ink mb-2">
                {roomToDelete?.isGroup ? `Sair do grupo "${roomToDelete.name}"?` : `Apagar conversa com ${roomToDelete?.name}?`}
              </h3>
              <p className="text-ink-2 mb-6 leading-relaxed">
                {roomToDelete?.isGroup ? 'Você deixará de receber as mensagens deste grupo.' : 'A conversa será removida da sua lista. Esta ação não pode ser desfeita.'}
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setRoomToDelete(null)} className="btn-secondary">Cancelar</button>
                <button onClick={() => { handleDeleteRoom(roomToDelete.id); setRoomToDelete(null); }} className="btn-danger">
                  {roomToDelete?.isGroup ? 'Sair do grupo' : 'Apagar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Papel de parede */}
      {showWallpaperModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowWallpaperModal(false)}>
          <div className="card w-full max-w-md animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 flex items-center justify-between border-b border-line">
              <h3 className="text-lg font-semibold text-ink">Papel de parede da conversa</h3>
              <button onClick={() => setShowWallpaperModal(false)} className="icon-btn"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {WALLPAPERS.map((wp) => (
                <button
                  key={wp.id}
                  onClick={() => { handleUpdateRoomWallpaper(activeRoomId, wp.id); setShowWallpaperModal(false); }}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 chat-wallpaper wp-${wp.id} ${wallpaperId === wp.id ? 'border-chat-accent' : 'border-line hover:border-ink-3'}`}
                >
                  <span className="absolute left-2 bottom-2 text-xs bg-surface/90 text-ink rounded px-2 py-0.5">{wp.name}</span>
                  {wallpaperId === wp.id && <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-chat-accent text-white flex items-center justify-center"><Check className="w-3 h-3" /></span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
