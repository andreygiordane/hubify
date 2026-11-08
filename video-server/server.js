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
  pingTimeout: 10000
});

io.engine.on("connection_error", (err) => {
  console.log(`[!] Connection Error:`, err.req ? `Request to ${err.req.url}` : 'No request', `| Code: ${err.code} | Message: ${err.message}`);
});

// Presença no backend (não bloqueia a entrada na sala)
const setOnline = (uid, isOnline) => {
  fetch(`${BACKEND_URL}/auth/users/${uid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isOnline })
  }).catch(e => console.error(`[STATUS] Error updating presence for ${uid}:`, e.message));
};

// Presença: sockets abertos por usuário. Só fica offline quando o último aparelho desconecta.
const userSockets = new Map(); // uid -> Set(socketId)
const offlineTimers = new Map(); // uid -> timeout (tolerância para reconexões rápidas)

const registerPresence = (socket, uid) => {
  if (!uid || socket.userId === uid) return;
  socket.userId = uid;
  if (!userSockets.has(uid)) userSockets.set(uid, new Set());
  const sockets = userSockets.get(uid);
  sockets.add(socket.id);
  clearTimeout(offlineTimers.get(uid));
  offlineTimers.delete(uid);
  if (sockets.size === 1) setOnline(uid, true);
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
    if (!userSockets.has(uid)) setOnline(uid, false);
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

io.on('connection', (socket) => {
  console.log(`[+] User connected: ${socket.id} | Active connections: ${io.engine.clientsCount}`);

  socket.on('join-room', ({ roomId, uid, name, avatarUrl }) => {
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

  // Cada aparelho se identifica ao conectar (não depende de abrir uma conversa)
  socket.on('presence', ({ uid }) => registerPresence(socket, uid));

  socket.on('update-user-state', ({ roomId, state }) => {
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

  socket.on('send-chat', ({ roomId, message }) => {
    io.to(roomId).emit('receive-chat', message);
  });

  socket.on('message-created', (message) => {
    if (!message || !message.roomId) return;
    socket.broadcast.emit('message-created', message);
  });

  // Sinalização WebRTC (classe Peer)
  socket.on("sending-signal", payload => {
    const sig = payload.signal || {};
    console.log(`[SIGNAL] ${payload.callerID} -> ${payload.userToSignal}: ${sig.type || 'candidate'}`);
    io.to(payload.userToSignal).emit('user-joined', { signal: payload.signal, callerID: payload.callerID });
  });

  socket.on("returning-signal", payload => {
    const sig = payload.signal || {};
    console.log(`[SIGNAL] ${socket.id} -> ${payload.callerID}: ${sig.type || 'candidate'}`);
    io.to(payload.callerID).emit('receiving-returned-signal', { signal: payload.signal, id: socket.id });
  });

  socket.on('leave-room', ({ roomId }) => {
    socket.leave(roomId);
    if (rooms[roomId] && rooms[roomId].delete(socket.id)) {
      io.to(roomId).emit('room-participants', Array.from(rooms[roomId].values()));
      io.to(roomId).emit('user-disconnected', socket.id);
      cleanupRoom(roomId);
    }
  });

  socket.on('end-call', ({ roomId }) => {
    io.to(roomId).emit('call-ended');
  });

  socket.on('typing', ({ roomId, userId, userName }) => {
    socket.to(roomId).emit('user-typing', { userId, userName });
  });

  socket.on('stop-typing', ({ roomId, userId }) => {
    socket.to(roomId).emit('user-stop-typing', { userId });
  });

  socket.on('messages-read', ({ roomId, userId, timestamp }) => {
    console.log(`[READ] User ${userId} marked room ${roomId} as read at ${new Date(timestamp).toISOString()}`);
    socket.to(roomId).emit('user-read-messages', { userId, roomId, timestamp });
  });

  socket.on('profile-update', ({ userId, data }) => {
    socket.broadcast.emit('profile-update', { userId, data });
  });

  socket.on('conversation-deleted', ({ roomId, deletedBy, deletedAt }) => {
    if (!roomId) return;
    // Only broadcast group deletions to everyone. DMs should not be broadcast from client.
    if (roomId.startsWith('group_')) {
      socket.broadcast.emit('conversation-deleted', { roomId, deletedBy, deletedAt });
    } else {
      // Ignore DM deletion broadcasts to avoid removing conversation for the other participant.
      console.log(`[CONV_DELETE] DM deletion for ${roomId} by ${deletedBy} ignored for broadcast`);
    }
  });

  socket.on('message-deleted', ({ messageId, roomId, deletedBy, deletedAt }) => {
    if (!messageId) return;
    socket.broadcast.emit('message-deleted', { messageId, roomId, deletedBy, deletedAt });
  });

  socket.on('disconnect', () => {
    console.log(`[-] User disconnected: ${socket.id} | Active connections: ${io.engine.clientsCount}`);
    // Notificar o backend que o usuário ficou offline, mas preservar o status de texto
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
