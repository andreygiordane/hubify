import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, SendHorizontal, Trash2, Phone, Video, ChevronLeft, ChevronDown, Camera,
  Image as ImageIcon, FileText, Download, X, Plus, FileSpreadsheet, FileCode, FileArchive,
  Bell, BellOff, Pencil, CornerUpLeft, CornerUpRight, Copy, Forward, CheckCircle2, Circle, Smile, Check,
  MoreHorizontal, Mail, Briefcase, UserPlus, Ban, Palette, LogOut, Keyboard, User as UserRound, Users
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
  { id: 'nenhum', name: 'Liso' },
  { id: 'padrao', name: 'Ícones' },
  { id: 'pontos', name: 'Pontos' },
  { id: 'linhas', name: 'Linhas' },
];
const LEGACY_WALLPAPER = { none: 'nenhum', dots: 'pontos', lines: 'linhas', circuit: 'padrao', topography: 'padrao' };
const GROUP_WINDOW = 7 * 60 * 1000; // mensagens seguidas da mesma pessoa em até 7 min ficam agrupadas

// Seletor de emojis em português
const EMOJI_PROPS = {
  skinTonesDisabled: true,
  previewConfig: { showPreview: false },
  searchPlaceholder: 'Pesquisar emoji',
  categories: [
    { category: 'suggested', name: 'Usados recentemente' },
    { category: 'smileys_people', name: 'Rostos e pessoas' },
    { category: 'animals_nature', name: 'Animais e natureza' },
    { category: 'food_drink', name: 'Comidas e bebidas' },
    { category: 'travel_places', name: 'Viagens e lugares' },
    { category: 'activities', name: 'Atividades' },
    { category: 'objects', name: 'Objetos' },
    { category: 'symbols', name: 'Símbolos' },
    { category: 'flags', name: 'Bandeiras' },
  ],
};

const isDarkTheme = () => document.documentElement.classList.contains('dark');
const isTouch = () => window.matchMedia('(hover: none)').matches;

const longStamp = (ts) => {
  const day = formatDaySeparator(ts);
  const time = formatTime(ts);
  return day === 'Hoje' ? `hoje às ${time}` : day === 'Ontem' ? `ontem às ${time}` : `${new Date(ts).toLocaleDateString('pt-BR')} ${time}`;
};

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
  const wallpaperId = LEGACY_WALLPAPER[savedWallpaper] || savedWallpaper || 'nenhum';

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
  const lastMineId = [...currentMessages].reverse().find(m => m.senderId === user?.id)?.id;

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
    setShowEmojiPicker(false);
    setIsAtBottom(true);
    setTimeout(() => messagesEndRef.current?.scrollIntoView(), 0);
  }, [activeRoomId]);

  // Quando o teclado/painel de emoji muda a altura da área de mensagens, mantém o fim visível
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => { if (isAtBottom) messagesEndRef.current?.scrollIntoView(); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isAtBottom, activeRoomId]);

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
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Campo de texto cresce com o conteúdo (até ~6 linhas)
  useEffect(() => {
    const el = messageInputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
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
    if (!isTouch()) setShowEmojiPicker(false);
    setIsAtBottom(true);
  };

  // Celular: o painel de emojis ocupa o lugar do teclado (e vice-versa)
  const toggleEmojiPicker = () => {
    if (isTouch()) {
      if (showEmojiPicker) {
        setShowEmojiPicker(false);
        messageInputRef.current?.focus();
      } else {
        messageInputRef.current?.blur();
        setShowEmojiPicker(true);
      }
    } else {
      setShowEmojiPicker(v => !v);
    }
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

  const startReply = (msg) => { setReplyingToMessage(msg); setActiveMessageMenuId(null); if (!isTouch()) messageInputRef.current?.focus(); };
  const startEdit = (msg) => { setEditingMessage(msg); setNewMessage(msg.text); setActiveMessageMenuId(null); messageInputRef.current?.focus(); };

  const typingOthers = Object.entries(typingUsers[activeRoomId] || {}).filter(([id]) => id !== user?.id);
  const roomPresence = !isGroup && currentRoomInfo ? presenceOf(recipient || currentRoomInfo) : null;
  const memberName = (msg) => users.find(u => u.id === msg.senderId)?.name || msg.senderName || 'Usuário';
  const memberAvatar = (msg) => users.find(u => u.id === msg.senderId)?.avatarUrl;
  const placeholder = currentRoomInfo ? (isGroup ? `Conversar em ${currentRoomInfo.name}` : `Conversar com ${currentRoomInfo.name}`) : '';

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-surface">
      <aside className={`w-full md:w-[280px] lg:w-[300px] shrink-0 h-full ${selectedChatMobile ? 'hidden md:flex' : 'flex'}`}>
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
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center px-8 bg-surface">
          <div className="w-16 h-16 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mb-5">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-semibold text-ink mb-2">Converse com sua equipe</h3>
          <p className="max-w-sm text-ink-2 leading-relaxed">
            Escolha uma conversa à esquerda, ou comece uma nova. Dá para ligar por áudio ou vídeo direto da conversa.
          </p>
          <div className="flex gap-2 mt-6">
            <button onClick={() => setShowDMModal(true)} className="btn-primary h-9">Nova conversa</button>
            <button onClick={() => setShowGroupModal(true)} className="btn-secondary h-9">Novo grupo</button>
          </div>
          <p className="mt-8 text-xs text-ink-3">Dica: <kbd className="px-1.5 py-0.5 rounded bg-hover text-ink-2 font-sans">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-hover text-ink-2 font-sans">K</kbd> abre a busca rápida</p>
        </div>
      ) : (
        <section className={`flex-1 flex flex-col min-w-0 h-full bg-surface ${!selectedChatMobile ? 'hidden md:flex' : 'flex'}`}>
          {/* Cabeçalho da conversa */}
          <header className="h-14 md:h-12 shrink-0 px-2 md:px-4 flex items-center gap-2 border-b border-line md:border-0 md:shadow-[0_1px_0_rgb(0_0_0/0.18),0_1.5px_0_rgb(0_0_0/0.05)] z-30">
            <button className="md:hidden icon-btn w-9 h-9" onClick={() => { setSelectedChatMobile(false); setActiveRoomId(null); }} aria-label="Voltar">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button className="flex items-center gap-2.5 min-w-0 flex-1 text-left" onClick={() => setShowChatInfo(!showChatInfo)}>
              <Avatar src={currentRoomInfo.avatarUrl} name={currentRoomInfo.name} size={30} status={roomPresence} square={isGroup} />
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-ink truncate leading-tight">{currentRoomInfo.name}</h2>
                <p className={`text-xs truncate leading-tight ${typingOthers.length ? 'text-brand' : 'text-ink-3'}`}>
                  {typingOthers.length > 0
                    ? `${typingOthers.map(([, n]) => n.split(' ')[0]).join(', ')} está digitando...`
                    : isGroup ? `${currentRoomInfo.members?.length || 0} membros` : PRESENCE[roomPresence]?.label}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-0.5 shrink-0">
              {currentRoomInfo.id !== user.id && (
                <>
                  <button onClick={() => handleStartAudioCall()} className="icon-btn w-9 h-9" title="Chamada de áudio"><Phone className="w-[18px] h-[18px]" /></button>
                  <button onClick={() => handleStartMeeting()} className="icon-btn w-9 h-9" title="Chamada de vídeo"><Video className="w-5 h-5" /></button>
                </>
              )}
              <button onClick={() => setShowChatInfo(!showChatInfo)} className={`icon-btn w-9 h-9 hidden md:inline-flex ${showChatInfo ? 'text-ink bg-hover' : ''}`} title={isGroup ? 'Membros' : 'Perfil'}>
                {isGroup ? <Users className="w-5 h-5" /> : <UserRound className="w-5 h-5" />}
              </button>
              {showSearch ? (
                <div className="flex items-center h-8 bg-app rounded-md px-2 ml-1">
                  <input
                    autoFocus
                    value={msgSearchQuery}
                    onChange={(e) => setMsgSearchQuery(e.target.value)}
                    placeholder="Buscar"
                    className="bg-transparent outline-none text-sm w-24 md:w-40 text-ink placeholder:text-ink-3"
                  />
                  <button onClick={() => { setShowSearch(false); setMsgSearchQuery(''); }} className="text-ink-3 hover:text-ink"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <button onClick={() => setShowSearch(true)} className="icon-btn w-9 h-9" title="Buscar mensagens"><Search className="w-[18px] h-[18px]" /></button>
              )}
              <div className="relative" ref={menuRef}>
                <button onClick={() => setShowMoreMenu(!showMoreMenu)} className={`icon-btn w-9 h-9 ${showMoreMenu ? 'bg-hover text-ink' : ''}`} title="Mais opções">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {showMoreMenu && (
                  <div className="menu absolute right-0 top-full mt-1 w-60 z-50">
                    <button onClick={() => { setShowChatInfo(true); setShowMoreMenu(false); }} className="menu-item">
                      <UserRound className="w-4 h-4 text-ink-2" /> {isGroup ? 'Dados do grupo' : 'Ver perfil'}
                    </button>
                    <button onClick={() => { setIsForwardMode(true); setShowMoreMenu(false); }} className="menu-item">
                      <CheckCircle2 className="w-4 h-4 text-ink-2" /> Selecionar mensagens
                    </button>
                    <button onClick={() => { toggleMuteRoom(activeRoomId); setShowMoreMenu(false); }} className="menu-item">
                      {mutedRooms?.includes(activeRoomId)
                        ? <><Bell className="w-4 h-4 text-ink-2" /> Reativar notificações</>
                        : <><BellOff className="w-4 h-4 text-ink-2" /> Silenciar</>}
                    </button>
                    <button onClick={() => { setShowWallpaperModal(true); setShowMoreMenu(false); }} className="menu-item">
                      <Palette className="w-4 h-4 text-ink-2" /> Fundo da conversa
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

          <div className="flex-1 min-h-0 flex">
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Mensagens */}
              <div className={`flex-1 min-h-0 relative chat-wallpaper wp-${wallpaperId}`}>
                <div ref={scrollContainerRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto custom-scrollbar pb-4">
                  {/* Início da conversa */}
                  {!msgSearchQuery && (
                    <div className="px-4 pt-10 pb-4">
                      <Avatar src={currentRoomInfo.avatarUrl} name={currentRoomInfo.name} size={72} square={isGroup} />
                      <h3 className="text-2xl md:text-[28px] font-bold text-ink mt-3">{currentRoomInfo.name}</h3>
                      <p className="text-ink-2 mt-1">
                        {isGroup
                          ? <>Este é o começo do grupo <b className="text-ink">{currentRoomInfo.name}</b>.</>
                          : <>Este é o começo da sua conversa com <b className="text-ink">{currentRoomInfo.name}</b>.</>}
                      </p>
                    </div>
                  )}
                  {msgSearchQuery && currentMessages.length === 0 && (
                    <p className="text-center text-ink-2 py-16">Nenhuma mensagem com "{msgSearchQuery}".</p>
                  )}

                  {currentMessages.map((msg, index) => {
                    const isMine = msg.senderId === user.id;
                    const prev = currentMessages[index - 1];
                    const showDateSeparator = shouldShowDateSeparator(index);
                    const firstOfGroup = showDateSeparator || !prev || prev.senderId !== msg.senderId || msg.timestamp - prev.timestamp > GROUP_WINDOW || !!msg.replyToId;
                    const selected = selectedForwardMessages.includes(msg.id);
                    const repliedTo = msg.replyToId ? allMessages.find(m => m.id === msg.replyToId) : null;
                    const isRead = (recipientReadTimestamps[activeRoomId] || 0) >= msg.timestamp;
                    const name = memberName(msg);
                    const menuOpen = activeMessageMenuId === msg.id;
                    const canEdit = isMine && msg.text && !msg.isDeleted && Date.now() - msg.timestamp < 5 * 60 * 1000;

                    return (
                      <React.Fragment key={msg.id}>
                        {showDateSeparator && (
                          <div className="flex items-center gap-2 px-4 my-4">
                            <span className="flex-1 h-px bg-line" />
                            <span className="text-xs font-semibold text-ink-3">{formatDaySeparator(msg.timestamp)}</span>
                            <span className="flex-1 h-px bg-line" />
                          </div>
                        )}
                        <div
                          id={`msg-${msg.id}`}
                          onClick={() => {
                            if (isForwardMode) toggleForwardSelection(msg.id);
                            else if (isTouch() && !msg.isDeleted) setActiveMessageMenuId(menuOpen ? null : msg.id);
                          }}
                          onContextMenu={(e) => { if (!msg.isDeleted && !isForwardMode) { e.preventDefault(); setActiveMessageMenuId(msg.id); } }}
                          className={`group relative flex gap-3 md:gap-4 pl-3 md:pl-4 pr-3 md:pr-12 ${firstOfGroup ? 'mt-3 pt-1 pb-0.5' : 'py-0.5'} ${selected ? 'bg-brand-soft/60' : menuOpen ? 'bg-hover/60' : 'hover:bg-hover/40'} ${isForwardMode ? 'cursor-pointer' : ''}`}
                        >
                          {isForwardMode && (
                            <span className={`shrink-0 self-center ${selected ? 'text-brand' : 'text-ink-3'}`}>
                              {selected ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                            </span>
                          )}

                          {/* Coluna do avatar / hora */}
                          <div className="w-10 shrink-0 flex justify-center">
                            {firstOfGroup ? (
                              <Avatar src={memberAvatar(msg)} name={name} size={40} className={msg.replyToId ? 'mt-5' : 'mt-0.5'} />
                            ) : (
                              <span className="text-[10px] text-ink-3 leading-[22px] opacity-0 group-hover:opacity-100 select-none">{formatTime(msg.timestamp)}</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            {repliedTo !== null && msg.replyToId && (
                              <button onClick={(e) => { e.stopPropagation(); jumpToMessage(msg.replyToId); }} className="flex items-center gap-1.5 text-xs text-ink-3 hover:text-ink-2 mb-0.5 max-w-full">
                                <CornerUpRight className="w-3.5 h-3.5 shrink-0 -scale-x-100" />
                                {repliedTo ? (
                                  <>
                                    <Avatar src={users.find(u => u.id === repliedTo.senderId)?.avatarUrl} name={repliedTo.senderName} size={16} />
                                    <span className="font-semibold text-ink-2 shrink-0">{repliedTo.senderId === user.id ? 'Você' : repliedTo.senderName}</span>
                                    <span className="truncate">{repliedTo.text || '📎 Arquivo'}</span>
                                  </>
                                ) : <span className="italic">Mensagem original não encontrada</span>}
                              </button>
                            )}

                            {firstOfGroup && (
                              <p className="flex items-baseline gap-2 leading-[22px]">
                                <span className="font-semibold text-ink text-[15px]" style={isGroup && !isMine ? { color: colorFor(name) } : undefined}>{isMine ? (users.find(u => u.id === user.id)?.name || name) : name}</span>
                                <span className="text-xs text-ink-3">{longStamp(msg.timestamp)}</span>
                              </p>
                            )}

                            {msg.isForwarded && (
                              <p className="flex items-center gap-1 text-xs italic text-ink-3"><Forward size={12} /> Encaminhada</p>
                            )}

                            {msg.text && (
                              <p className={`whitespace-pre-wrap break-words text-[15px] leading-[22px] ${msg.isDeleted ? 'italic text-ink-3 flex items-center gap-1.5' : 'text-ink/90'}`}>
                                {msg.isDeleted && <Ban className="w-3.5 h-3.5" />}
                                {msg.isDeleted ? 'Mensagem apagada' : msg.text}
                                {msg.isEdited && !msg.isDeleted && <span className="text-[11px] text-ink-3 ml-1">(editada)</span>}
                              </p>
                            )}

                            {msg.attachment && (
                              msg.attachment.type?.startsWith('image/') ? (
                                <img
                                  src={msg.attachment.data}
                                  alt={msg.attachment.name}
                                  className="mt-1 max-h-[320px] max-w-full md:max-w-[420px] rounded-lg cursor-pointer object-cover"
                                  onClick={(e) => { e.stopPropagation(); setPreviewDocument(msg.attachment); }}
                                />
                              ) : (
                                <div onClick={(e) => { e.stopPropagation(); setPreviewDocument(msg.attachment); }} className="mt-1 flex items-center gap-3 p-3 rounded-lg bg-subtle border border-line cursor-pointer w-full max-w-[420px] hover:border-ink-3/50">
                                  {(() => { const { Icon, color } = getFileIcon(msg.attachment.name); return <span className={`w-9 h-11 rounded flex items-center justify-center shrink-0 ${color}`}><Icon size={18} /></span>; })()}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-brand truncate hover:underline">{msg.attachment.name}</p>
                                    <p className="text-xs text-ink-3">{(msg.attachment.size / 1024 / 1024).toFixed(2)} MB</p>
                                  </div>
                                  <a href={msg.attachment.data} download={msg.attachment.name} onClick={(e) => e.stopPropagation()} className="icon-btn" title="Baixar">
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              )
                            )}

                            {isMine && !isGroup && msg.id === lastMineId && !msg.isDeleted && (
                              <p className={`flex items-center gap-1 text-[11px] mt-0.5 ${isRead ? 'text-brand' : 'text-ink-3'}`}>
                                <ReadIndicator isRead={isRead} size={14} className={isRead ? '!text-brand' : '!text-ink-3'} />
                                {isRead ? 'Lida' : 'Enviada'}
                              </p>
                            )}
                          </div>

                          {/* Barra de ações (hover no desktop, toque no celular) */}
                          {!msg.isDeleted && !isForwardMode && (
                            <div
                              ref={menuOpen ? messageMenuRef : null}
                              onClick={(e) => e.stopPropagation()}
                              className={`absolute right-3 md:right-4 -top-4 z-20 flex items-center bg-surface border border-line rounded-md shadow-card overflow-hidden ${menuOpen ? 'flex' : 'hidden md:group-hover:flex'}`}
                            >
                              <button onClick={() => startReply(msg)} className="w-8 h-8 flex items-center justify-center text-ink-2 hover:bg-hover hover:text-ink" title="Responder"><CornerUpLeft className="w-4 h-4" /></button>
                              {canEdit && <button onClick={() => startEdit(msg)} className="w-8 h-8 flex items-center justify-center text-ink-2 hover:bg-hover hover:text-ink" title="Editar"><Pencil className="w-4 h-4" /></button>}
                              {msg.text && <button onClick={() => { navigator.clipboard.writeText(msg.text); setActiveMessageMenuId(null); }} className="w-8 h-8 flex items-center justify-center text-ink-2 hover:bg-hover hover:text-ink" title="Copiar"><Copy className="w-4 h-4" /></button>}
                              <button onClick={() => { setIsForwardMode(true); setSelectedForwardMessages([msg.id]); setActiveMessageMenuId(null); }} className="w-8 h-8 flex items-center justify-center text-ink-2 hover:bg-hover hover:text-ink" title="Encaminhar"><Forward className="w-4 h-4" /></button>
                              {isMine && <button onClick={() => { handleDeleteMessage(msg.id); setActiveMessageMenuId(null); }} className="w-8 h-8 flex items-center justify-center text-danger hover:bg-danger-soft" title="Apagar"><Trash2 className="w-4 h-4" /></button>}
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {showScrollButton && !isAtBottom && (
                  <button
                    onClick={() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowScrollButton(false); }}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 h-8 px-3 rounded-full bg-brand text-white text-xs font-semibold shadow-pop flex items-center gap-1 z-20"
                  >
                    Ir para as mais recentes <ChevronDown className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Rodapé: seleção para encaminhar OU campo de mensagem */}
              {isForwardMode ? (
                <div className="shrink-0 px-4 py-3 flex items-center gap-3 border-t border-line">
                  <button onClick={() => { setIsForwardMode(false); setSelectedForwardMessages([]); }} className="btn-ghost">Cancelar</button>
                  <span className="flex-1 text-sm text-ink-2">{selectedForwardMessages.length} selecionada{selectedForwardMessages.length === 1 ? '' : 's'}</span>
                  <button disabled={selectedForwardMessages.length === 0} onClick={() => setShowForwardTargetModal(true)} className="btn-primary"><Forward className="w-4 h-4" /> Encaminhar</button>
                </div>
              ) : (
                <div className="shrink-0 px-2 md:px-4 pb-2 md:pb-5 pt-1" style={{ paddingBottom: showEmojiPicker ? undefined : 'max(0.5rem, env(safe-area-inset-bottom))' }}>
                  {(replyingToMessage || editingMessage || pendingFile) && (
                    <div className="flex items-center gap-3 rounded-t-lg bg-subtle px-3 py-2 text-sm">
                      {pendingFile && (pendingFile.type.startsWith('image/')
                        ? <img src={pendingFile.data} alt="" className="w-10 h-10 rounded object-cover" />
                        : <span className="w-10 h-10 rounded bg-hover flex items-center justify-center text-ink-2"><FileText className="w-5 h-5" /></span>)}
                      <p className="flex-1 min-w-0 truncate text-ink-2">
                        {editingMessage ? <>Editando mensagem <span className="text-ink-3">· Esc para cancelar</span></>
                          : replyingToMessage ? <>Respondendo a <b className="text-ink">{replyingToMessage.senderId === user.id ? 'você' : replyingToMessage.senderName}</b></>
                          : <><b className="text-ink">{pendingFile.name}</b> · {(pendingFile.size / 1024 / 1024).toFixed(2)} MB</>}
                      </p>
                      <button
                        onClick={() => {
                          if (editingMessage) { setEditingMessage(null); setNewMessage(''); }
                          else if (replyingToMessage) setReplyingToMessage(null);
                          else setPendingFile(null);
                        }}
                        className="w-6 h-6 rounded-full bg-ink-3/30 text-ink-2 hover:text-ink flex items-center justify-center"
                        aria-label="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={onSubmit} className={`flex items-end gap-1 bg-hover px-2 ${(replyingToMessage || editingMessage || pendingFile) ? 'rounded-b-lg' : 'rounded-lg'}`}>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

                    <div className="relative shrink-0" ref={attachmentMenuRef}>
                      <button type="button" onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} className="w-10 h-11 flex items-center justify-center text-ink-2 hover:text-ink" title="Anexar arquivo">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center bg-ink-2 text-surface transition-transform ${showAttachmentMenu ? 'rotate-45' : ''}`}><Plus className="w-4 h-4" strokeWidth={3} /></span>
                      </button>
                      {showAttachmentMenu && (
                        <div className="menu absolute bottom-full left-0 mb-2 w-52 z-[70]">
                          <button type="button" onClick={() => { fileInputRef.current.accept = "image/*"; fileInputRef.current.click(); }} className="menu-item">
                            <ImageIcon className="w-4 h-4 text-ink-2" /> Foto ou imagem
                          </button>
                          <button type="button" onClick={() => { fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"; fileInputRef.current.click(); }} className="menu-item">
                            <FileText className="w-4 h-4 text-ink-2" /> Documento
                          </button>
                        </div>
                      )}
                    </div>

                    <textarea
                      ref={messageInputRef}
                      rows={1}
                      value={newMessage}
                      onFocus={() => { if (isTouch()) setShowEmojiPicker(false); }}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        setTyping(true);
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                        typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !isTouch()) { e.preventDefault(); onSubmit(); }
                        if (e.key === 'Escape') { setReplyingToMessage(null); setShowEmojiPicker(false); if (editingMessage) { setEditingMessage(null); setNewMessage(''); } }
                        if (e.key === 'ArrowUp' && !newMessage) {
                          const last = [...currentMessages].reverse().find(m => m.senderId === user.id && m.text && !m.isDeleted);
                          if (last && Date.now() - last.timestamp < 5 * 60 * 1000) { e.preventDefault(); startEdit(last); }
                        }
                      }}
                      placeholder={placeholder}
                      className="flex-1 min-w-0 block resize-none bg-transparent text-ink py-[11px] text-[15px] leading-[22px] outline-none placeholder:text-ink-3 custom-scrollbar max-h-[144px]"
                    />

                    <div className="relative shrink-0">
                      <button type="button" onClick={toggleEmojiPicker} className={`w-10 h-11 flex items-center justify-center hover:text-ink ${showEmojiPicker ? 'text-brand' : 'text-ink-2'}`} title={showEmojiPicker && isTouch() ? 'Teclado' : 'Emojis'}>
                        {showEmojiPicker && isTouch() ? <Keyboard className="w-6 h-6" /> : <Smile className="w-6 h-6" />}
                      </button>
                      {showEmojiPicker && !isTouch() && (
                        <>
                          <div className="fixed inset-0 z-[90]" onClick={() => setShowEmojiPicker(false)} />
                          <div className="absolute bottom-full right-0 mb-3 z-[100] shadow-pop rounded-lg overflow-hidden">
                            <EmojiPicker
                              onEmojiClick={(emojiData) => { setNewMessage(prev => prev + emojiData.emoji); messageInputRef.current?.focus(); }}
                              width={340}
                              height={400}
                              theme={isDarkTheme() ? 'dark' : 'light'}
                              {...EMOJI_PROPS}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {(newMessage.trim() || pendingFile) && (
                      <button type="submit" className="w-9 h-9 my-1 shrink-0 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-hover" title={editingMessage ? 'Salvar' : 'Enviar'}>
                        {editingMessage ? <Check className="w-5 h-5" /> : <SendHorizontal className="w-[18px] h-[18px]" />}
                      </button>
                    )}
                  </form>
                </div>
              )}

              {/* Celular: painel de emojis no lugar do teclado */}
              {showEmojiPicker && isTouch() && !isForwardMode && (
                <div className="md:hidden shrink-0 w-full border-t border-line" style={{ height: 'var(--kb-height, 300px)', minHeight: 260 }}>
                  <EmojiPicker
                    onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)}
                    width="100%"
                    height="100%"
                    theme={isDarkTheme() ? 'dark' : 'light'}
                    {...EMOJI_PROPS}
                    searchDisabled
                  />
                </div>
              )}
            </div>

            {/* Painel de perfil / membros */}
            {showChatInfo && (
              <aside className="fixed inset-0 z-[60] md:static md:z-auto md:w-[320px] shrink-0 bg-subtle md:border-l border-line flex flex-col animate-slide-left md:animate-fade-in overflow-hidden">
                <div className="h-24 shrink-0 relative" style={{ backgroundColor: colorFor(currentRoomInfo.name) }}>
                  <button onClick={() => setShowChatInfo(false)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50" aria-label="Fechar">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-6">
                  <div className="relative -mt-11 inline-block">
                    <div className="rounded-full ring-[6px] ring-subtle">
                      <Avatar src={currentRoomInfo.avatarUrl} name={currentRoomInfo.name} size={80} status={roomPresence} square={isGroup} />
                    </div>
                    {isGroup && currentRoomInfo.createdBy === user?.id && (
                      <button onClick={() => setShowAvatarPicker(!showAvatarPicker)} className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center ring-4 ring-subtle" title="Alterar imagem do grupo">
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {showAvatarPicker && (
                      <div className="menu absolute top-full left-0 mt-2 w-48 z-[70]">
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

                  <div className="mt-3 rounded-lg bg-surface p-4">
                    <h4 className="text-xl font-bold text-ink">{currentRoomInfo.name}</h4>
                    <p className="text-sm text-ink-2">{isGroup ? `Grupo · ${currentRoomInfo.members?.length || 0} membros` : (recipient?.username ? `@${recipient.username}` : PRESENCE[roomPresence]?.label)}</p>

                    {!isGroup && recipient && (
                      <div className="mt-4 pt-4 border-t border-line space-y-3 text-sm">
                        {recipient.bio && (
                          <div><p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3 mb-0.5">Sobre</p><p className="text-ink">{recipient.bio}</p></div>
                        )}
                        <div className="flex items-center gap-2 text-ink-2"><Briefcase className="w-4 h-4 text-ink-3" /> {recipient.role || 'Membro da equipe'}</div>
                        <div className="flex items-center gap-2 text-ink-2 min-w-0"><Mail className="w-4 h-4 text-ink-3 shrink-0" /> <span className="truncate">{recipient.email || '—'}</span></div>
                        <div className="flex items-center gap-2 text-ink-2"><span className={`w-2.5 h-2.5 rounded-full ${PRESENCE[roomPresence].color}`} /> {PRESENCE[roomPresence].label}</div>
                      </div>
                    )}
                    {isGroup && currentRoomInfo.description && (
                      <div className="mt-4 pt-4 border-t border-line text-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3 mb-0.5">Descrição</p>
                        <p className="text-ink">{currentRoomInfo.description}</p>
                      </div>
                    )}
                  </div>

                  {currentRoomInfo.id !== user.id && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button onClick={() => handleStartAudioCall()} className="btn-secondary h-9"><Phone className="w-4 h-4" /> Áudio</button>
                      <button onClick={() => handleStartMeeting()} className="btn-primary h-9"><Video className="w-4 h-4" /> Vídeo</button>
                    </div>
                  )}

                  {isGroup && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between px-1 mb-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Membros — {currentRoomInfo.members?.length || 0}</p>
                        <button onClick={() => setShowAddMemberModal(true)} className="icon-btn w-7 h-7" title="Adicionar membro"><UserPlus className="w-4 h-4" /></button>
                      </div>
                      {(currentRoomInfo.members || []).map(mId => {
                        const m = users.find(u => u.id === mId);
                        const isAdmin = currentRoomInfo.createdBy === mId;
                        return (
                          <div key={mId} className="group/member flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-hover">
                            <Avatar src={m?.avatarUrl} name={m?.name} size={32} status={presenceOf(m)} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-ink truncate">{mId === user?.id ? 'Você' : (m?.name || 'Usuário')}</p>
                              <p className="text-[11px] text-ink-3 truncate">{isAdmin ? 'Administrador' : (m?.role || PRESENCE[presenceOf(m)].label)}</p>
                            </div>
                            {currentRoomInfo.createdBy === user?.id && mId !== user?.id && (
                              <button onClick={() => handleRemoveMember(currentRoomInfo.id, mId)} className="icon-btn w-7 h-7 opacity-0 group-hover/member:opacity-100 hover:text-danger" title="Remover do grupo">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-4 space-y-0.5">
                    <button onClick={() => toggleMuteRoom(activeRoomId)} className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-hover text-sm text-ink-2">
                      {mutedRooms?.includes(activeRoomId) ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      {mutedRooms?.includes(activeRoomId) ? 'Reativar notificações' : 'Silenciar conversa'}
                    </button>
                    <button onClick={() => setRoomToDelete(currentRoomInfo)} className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-danger-soft text-sm text-danger">
                      {isGroup ? <LogOut className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                      {isGroup ? 'Sair do grupo' : 'Apagar conversa'}
                    </button>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </section>
      )}

      {/* Encaminhar para */}
      {showForwardTargetModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowForwardTargetModal(false)}>
          <div className="w-full max-w-md bg-surface rounded-xl shadow-pop flex flex-col max-h-[80vh] animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-lg font-bold text-ink">Encaminhar para</h3>
              <p className="text-sm text-ink-2">{selectedForwardMessages.length} mensagem(ns) selecionada(s)</p>
            </div>
            <div className="px-3 pb-3 overflow-y-auto custom-scrollbar">
              {chatRooms.map(room => (
                <button key={room.id} onClick={() => onForwardMessages([room.id])} className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-hover">
                  <Avatar src={room.avatarUrl} name={room.name} size={36} square={room.isGroup} />
                  <span className="flex-1 text-left text-ink">{room.name}</span>
                  <span className="btn-secondary h-7 text-xs">Enviar</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de apagar conversa / sair do grupo */}
      <AnimatePresence>
        {roomToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4" onClick={() => setRoomToDelete(null)}>
            <motion.div initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }} className="w-full max-w-sm bg-surface rounded-xl shadow-pop overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-5">
                <h3 className="text-lg font-bold text-ink mb-2">
                  {roomToDelete?.isGroup ? `Sair de "${roomToDelete.name}"?` : `Apagar conversa com ${roomToDelete?.name}?`}
                </h3>
                <p className="text-sm text-ink-2 leading-relaxed">
                  {roomToDelete?.isGroup ? 'Você deixará de receber as mensagens deste grupo.' : 'A conversa será removida da sua lista. Esta ação não pode ser desfeita.'}
                </p>
              </div>
              <div className="flex justify-end gap-2 px-5 py-3 bg-subtle">
                <button onClick={() => setRoomToDelete(null)} className="btn-ghost">Cancelar</button>
                <button onClick={() => { handleDeleteRoom(roomToDelete.id); setRoomToDelete(null); }} className="btn-danger">
                  {roomToDelete?.isGroup ? 'Sair do grupo' : 'Apagar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fundo da conversa */}
      {showWallpaperModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowWallpaperModal(false)}>
          <div className="w-full max-w-md bg-surface rounded-xl shadow-pop animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">Fundo da conversa</h3>
              <button onClick={() => setShowWallpaperModal(false)} className="icon-btn"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 pt-3 grid grid-cols-2 gap-3">
              {WALLPAPERS.map((wp) => (
                <button
                  key={wp.id}
                  onClick={() => { handleUpdateRoomWallpaper(activeRoomId, wp.id); setShowWallpaperModal(false); }}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 chat-wallpaper wp-${wp.id} ${wallpaperId === wp.id ? 'border-brand' : 'border-line hover:border-ink-3'}`}
                >
                  <span className="absolute left-2 bottom-2 text-xs bg-app/90 text-ink rounded px-2 py-0.5">{wp.name}</span>
                  {wallpaperId === wp.id && <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center"><Check className="w-3 h-3" /></span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
