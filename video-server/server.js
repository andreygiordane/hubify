const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());

const server = http.createServer(app);
app.get('/health', (req, res) => res.status(200).send('OK'));

const BACKEND_URL = process.env.BACKEND_URL || 'https://hubify-backend-358184322842.us-central1.run.app/api';

// ICE SERVERS (STUN + TURN)
// Sem TURN, chamadas entre redes diferentes (4G/CGNAT, NAT simétrico) falham.
// Prioridade: Cloudflare TURN > coturn com segredo compartilhado > credenciais estáticas.
const STUN_URLS = ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'];
const ICE_TTL = parseInt(process.env.TURN_TTL || '86400', 10);

const buildIceServers = async () => {
  const { CLOUDFLARE_TURN_KEY_ID, CLOUDFLARE_TURN_API_TOKEN, TURN_URLS, TURN_SECRET, TURN_USERNAME, TURN_CREDENTIAL } = process.env;

  if (CLOUDFLARE_TURN_KEY_ID && CLOUDFLARE_TURN_API_TOKEN) {
    const res = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${CLOUDFLARE_TURN_KEY_ID}/credentials/generate-ice-servers`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${CLOUDFLARE_TURN_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttl: ICE_TTL })
    });
    if (!res.ok) throw new Error(`Cloudflare TURN respondeu ${res.status}`);
    const data = await res.json();
    return [].concat(data.iceServers);
  }

  const iceServers = [{ urls: STUN_URLS }];
  if (TURN_URLS) {
    const urls = TURN_URLS.split(',').map(u => u.trim()).filter(Boolean);
    if (TURN_SECRET) {
      // TURN REST API (coturn --use-auth-secret): credenciais temporárias
      const username = `${Math.floor(Date.now() / 1000) + ICE_TTL}:hubify`;
      const credential = crypto.createHmac('sha1', TURN_SECRET).update(username).digest('base64');
      iceServers.push({ urls, username, credential });
    } else if (TURN_USERNAME && TURN_CREDENTIAL) {
      iceServers.push({ urls, username: TURN_USERNAME, credential: TURN_CREDENTIAL });
    }
  }
  return iceServers;
};

app.get('/ice-servers', async (req, res) => {
  try {
    const iceServers = await buildIceServers();
    if (!iceServers.some(s => [].concat(s.urls).some(u => u.startsWith('turn')))) {
      console.warn('[ICE] Nenhum servidor TURN configurado: chamadas entre redes diferentes podem falhar.');
    }
    res.json({ iceServers, ttl: ICE_TTL });
  } catch (e) {
    console.error('[ICE] Erro ao gerar ICE servers:', e.message);
    res.json({ iceServers: [{ urls: STUN_URLS }], ttl: 300 });
  }
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'],
  // Detecta mais rápido aparelhos que sumiram sem avisar (navegador do celular fechado)
  pingInterval: 10000,
  pingTimeout: 10000,
  // Anexos vão em base64 dentro da mensagem (mesmo limite do nginx/backend)
  maxHttpBufferSize: 12e6
});

io.engine.on("connection_error", (err) => {
  console.log(`[!] Connection Error:`, err.req ? `Request to ${err.req.url}` : 'No request', `| Code: ${err.code} | Message: ${err.message}`);
});

const backend = async (method, path, body) => {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Backend ${method} ${path} respondeu ${res.status}`);
  return res.json();
};

// Presença no backend (não bloqueia a entrada na sala)
const setOnline = (uid, isOnline) => {
  backend('PUT', `/auth/users/${uid}`, { isOnline })
    .catch(e => console.error(`[STATUS] Error updating presence for ${uid}:`, e.message));
};

// Presença: sockets abertos por usuário. Só fica offline quando o último aparelho desconecta.
const userSockets = new Map(); // uid -> Set(socketId)
const offlineTimers = new Map(); // uid -> timeout (tolerância para reconexões rápidas)

const userRoom = (uid) => `user:${uid}`;
const chatRoom = (roomId) => `chat:${roomId}`;

// Quem deve receber eventos de uma conversa: os dois lados de uma DM, ou quem assina o grupo
const recipientsOf = (roomId) => {
  if (roomId.startsWith('dm_')) {
    return roomId.slice(3).split('_').filter(Boolean).map(userRoom);
  }
  return [chatRoom(roomId)];
};

// Pode falar nesta conversa? (DM só entre os dois participantes)
const canUseRoom = (socket, roomId) => {
  if (!socket.userId || typeof roomId !== 'string' || !roomId) return false;
  if (roomId.startsWith('dm_')) return roomId.slice(3).split('_').includes(socket.userId);
  return true;
};

// Convites de chamada em andamento: callId -> convite (entregue também a quem conectar depois)
const pendingCalls = new Map();
const CALL_RING_MS = 50000;

const closeCall = (callId) => {
  const call = pendingCalls.get(callId);
  if (!call) return null;
  clearTimeout(call.timer);
  pendingCalls.delete(callId);
  return call;
};

const registerPresence = (socket, uid) => {
  if (!uid || socket.userId === uid) return;
  socket.userId = uid;
  socket.join(userRoom(uid));
  if (!userSockets.has(uid)) userSockets.set(uid, new Set());
  const sockets = userSockets.get(uid);
  sockets.add(socket.id);
  clearTimeout(offlineTimers.get(uid));
  offlineTimers.delete(uid);
  if (sockets.size === 1) setOnline(uid, true);

  // Aparelho que acabou de conectar ainda deve tocar se houver uma chamada para ele
  for (const call of pendingCalls.values()) {
    if (call.to === uid) socket.emit('call-incoming', call.invite);
  }
};

const unregisterPresence = (socket) => {
  const uid = socket.userId;
  const sockets = uid && userSockets.get(uid);
  if (!sockets) return;
  sockets.delete(socket.id);
  if (sockets.size > 0) return;
  userSockets.delete(uid);
  offlineTimers.set(uid, setTimeout(() => {
    offlineTimers.delete(uid);
    if (userSockets.has(uid)) return;
    setOnline(uid, false);
    // Quem ligou caiu de vez: para de tocar no outro lado
    for (const [callId, call] of pendingCalls) {
      if (call.from === uid) {
        closeCall(callId);
        io.to(userRoom(call.to)).emit('call-cancelled', { callId });
      }
    }
  }, 5000));
};

// State
const rooms = {}; // roomId -> Map of participant states

const cleanupRoom = (roomId) => {
  if (rooms[roomId] && rooms[roomId].size === 0) {
    delete rooms[roomId];
    console.log(`[GC] Room ${roomId} removed from memory (empty). Active rooms: ${Object.keys(rooms).length}`);
  }
};

const ack = (fn, payload) => { if (typeof fn === 'function') fn(payload); };

io.on('connection', (socket) => {
  console.log(`[+] User connected: ${socket.id} | Active connections: ${io.engine.clientsCount}`);

  // Relógio do servidor: o cliente calcula a diferença para o seu (ordem e "lida" corretas)
  socket.on('server-time', (fn) => ack(fn, Date.now()));

  // Cada aparelho se identifica ao conectar (não depende de abrir uma conversa)
  socket.on('presence', ({ uid } = {}) => registerPresence(socket, uid));

  // Grupos que este aparelho acompanha (mensagens, digitando, leitura)
  socket.on('subscribe-rooms', ({ rooms: roomIds } = {}) => {
    if (!Array.isArray(roomIds)) return;
    const wanted = new Set(roomIds.filter(id => typeof id === 'string' && !id.startsWith('dm_')).map(chatRoom));
    for (const r of socket.rooms) {
      if (r.startsWith('chat:') && !wanted.has(r)) socket.leave(r);
    }
    wanted.forEach(r => socket.join(r));
  });

  // ---------- Mensagens ----------
  // Grava no backend e só então entrega e confirma ao remetente (✓). Reenvio com o mesmo id é seguro.
  socket.on('send-message', async (message, fn) => {
    try {
      if (!message?.id || !canUseRoom(socket, message.roomId)) return ack(fn, { ok: false, error: 'invalid' });
      const { isOptimistic, status, ...clean } = message;
      const stored = { ...clean, senderId: socket.userId, timestamp: Date.now() };
      const saved = await backend('POST', '/data/messages', stored);
      const final = { ...stored, updatedAt: saved.updatedAt };
      socket.to(recipientsOf(final.roomId)).emit('message-created', final);
      ack(fn, { ok: true, message: final });
    } catch (e) {
      console.error('[MSG] Falha ao salvar mensagem:', e.message);
      ack(fn, { ok: false, error: 'storage' });
    }
  });

  // Edição e exclusão ("Mensagem apagada")
  socket.on('update-message', async ({ id, roomId, changes } = {}, fn) => {
    try {
      if (!id || !changes || !canUseRoom(socket, roomId)) return ack(fn, { ok: false, error: 'invalid' });
      const saved = await backend('PATCH', `/data/messages/${encodeURIComponent(id)}`, changes);
      const message = { ...JSON.parse(saved.jsonData), updatedAt: saved.updatedAt };
      socket.to(recipientsOf(roomId)).emit('message-updated', message);
      ack(fn, { ok: true, message });
    } catch (e) {
      console.error('[MSG] Falha ao atualizar mensagem:', e.message);
      ack(fn, { ok: false, error: 'storage' });
    }
  });

  socket.on('typing', ({ roomId, userName } = {}) => {
    if (!canUseRoom(socket, roomId)) return;
    socket.to(recipientsOf(roomId)).emit('user-typing', { roomId, userId: socket.userId, userName });
  });

  socket.on('stop-typing', ({ roomId } = {}) => {
    if (!canUseRoom(socket, roomId)) return;
    socket.to(recipientsOf(roomId)).emit('user-stop-typing', { roomId, userId: socket.userId });
  });

  // Confirmação de leitura com a hora do servidor (mesma base do timestamp das mensagens)
  socket.on('messages-read', ({ roomId } = {}, fn) => {
    if (!canUseRoom(socket, roomId)) return ack(fn, { ok: false });
    const timestamp = Date.now();
    socket.to(recipientsOf(roomId)).emit('user-read-messages', { userId: socket.userId, roomId, timestamp });
    ack(fn, { ok: true, timestamp });
  });

  socket.on('profile-update', ({ userId, data } = {}) => {
    if (!userId || userId !== socket.userId) return;
    socket.broadcast.emit('profile-update', { userId, data });
  });

  socket.on('conversation-deleted', ({ roomId, deletedBy, deletedAt } = {}) => {
    // DMs não são apagadas para o outro participante; grupos sim
    if (!roomId || !roomId.startsWith('group_')) return;
    socket.to(chatRoom(roomId)).emit('conversation-deleted', { roomId, deletedBy, deletedAt });
  });

  // ---------- Convites de chamada (entrega imediata, sem passar pelo banco) ----------
  socket.on('call-invite', (invite, fn) => {
    if (!socket.userId || !invite?.callId || !invite?.to || !invite?.roomId) return ack(fn, { ok: false });
    const call = {
      callId: invite.callId,
      from: socket.userId,
      to: invite.to,
      invite: { ...invite, id: invite.callId, from: socket.userId, status: 'ringing', timestamp: Date.now() }
    };
    closeCall(call.callId);
    call.timer = setTimeout(() => {
      if (!closeCall(call.callId)) return;
      io.to(userRoom(call.from)).emit('call-missed', { callId: call.callId });
      io.to(userRoom(call.to)).emit('call-cancelled', { callId: call.callId });
    }, CALL_RING_MS);
    pendingCalls.set(call.callId, call);
    io.to(userRoom(call.to)).emit('call-incoming', call.invite);
    console.log(`[CALL] ${call.from} -> ${call.to} (${invite.type}) ${call.callId}`);
    ack(fn, { ok: true, online: userSockets.has(call.to) });
  });

  socket.on('call-accept', ({ callId } = {}, fn) => {
    const call = pendingCalls.get(callId);
    if (!call || call.to !== socket.userId) return ack(fn, { ok: false });
    closeCall(callId);
    ack(fn, { ok: true });
    io.to(userRoom(call.from)).emit('call-accepted', { callId, roomId: call.invite.roomId });
    // Outros aparelhos de quem atendeu param de tocar
    socket.to(userRoom(call.to)).emit('call-cancelled', { callId });
  });

  socket.on('call-decline', ({ callId, reason } = {}) => {
    const call = pendingCalls.get(callId);
    if (!call || call.to !== socket.userId) return;
    closeCall(callId);
    io.to(userRoom(call.from)).emit('call-declined', { callId, reason: reason || 'declined' });
    socket.to(userRoom(call.to)).emit('call-cancelled', { callId });
  });

  socket.on('call-cancel', ({ callId } = {}) => {
    const call = pendingCalls.get(callId);
    if (!call || call.from !== socket.userId) return;
    closeCall(callId);
    io.to(userRoom(call.to)).emit('call-cancelled', { callId });
  });

  // ---------- Sala da chamada (WebRTC) ----------
  socket.on('join-room', ({ roomId, uid, name, avatarUrl } = {}) => {
    try {
      if (!roomId) return;
      socket.join(roomId);
      registerPresence(socket, uid);

      if (!rooms[roomId]) rooms[roomId] = new Map();
      const isNew = !rooms[roomId].has(socket.id);
      rooms[roomId].set(socket.id, { isMicOn: true, isCamOn: true, ...rooms[roomId].get(socket.id), uid, name, avatarUrl, socketId: socket.id });

      // Quem já está na sala inicia a conexão WebRTC com o novo participante
      if (isNew) socket.to(roomId).emit('user-connected', socket.id);

      const participants = Array.from(rooms[roomId].values());
      io.to(roomId).emit('room-participants', participants);
      console.log(`[ROOM] User ${name} (${uid}) joined ${roomId}. Participants: ${participants.length}`);
    } catch (e) {
      console.error(`Error joining room:`, e);
    }
  });

  socket.on('update-user-state', ({ roomId, state } = {}) => {
    try {
      if (rooms[roomId] && rooms[roomId].has(socket.id)) {
        const current = rooms[roomId].get(socket.id);
        rooms[roomId].set(socket.id, { ...current, ...state });
        io.to(roomId).emit('room-participants', Array.from(rooms[roomId].values()));
      }
    } catch (e) {
      console.error(`Error updating state:`, e);
    }
  });

  socket.on('send-chat', ({ roomId, message } = {}) => {
    if (rooms[roomId]?.has(socket.id)) io.to(roomId).emit('receive-chat', message);
  });

  // Sinalização WebRTC (classe Peer)
  socket.on("sending-signal", payload => {
    const sig = payload.signal || {};
    if (sig.type) console.log(`[SIGNAL] ${payload.callerID} -> ${payload.userToSignal}: ${sig.type}`);
    io.to(payload.userToSignal).emit('user-joined', { signal: payload.signal, callerID: socket.id });
  });

  socket.on("returning-signal", payload => {
    const sig = payload.signal || {};
    if (sig.type) console.log(`[SIGNAL] ${socket.id} -> ${payload.callerID}: ${sig.type}`);
    io.to(payload.callerID).emit('receiving-returned-signal', { signal: payload.signal, id: socket.id });
  });

  socket.on('leave-room', ({ roomId } = {}) => {
    socket.leave(roomId);
    if (rooms[roomId] && rooms[roomId].delete(socket.id)) {
      io.to(roomId).emit('room-participants', Array.from(rooms[roomId].values()));
      io.to(roomId).emit('user-disconnected', socket.id);
      cleanupRoom(roomId);
    }
  });

  socket.on('end-call', ({ roomId } = {}) => {
    if (rooms[roomId]?.has(socket.id)) io.to(roomId).emit('call-ended');
  });

  socket.on('disconnect', () => {
    console.log(`[-] User disconnected: ${socket.id} | Active connections: ${io.engine.clientsCount}`);
    unregisterPresence(socket);

    for (const roomId in rooms) {
      if (rooms[roomId].delete(socket.id)) {
        io.to(roomId).emit('room-participants', Array.from(rooms[roomId].values()));
        io.to(roomId).emit('user-disconnected', socket.id);
        cleanupRoom(roomId);
      }
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Video Signaling Server listening on port ${PORT} at 0.0.0.0`);
});
