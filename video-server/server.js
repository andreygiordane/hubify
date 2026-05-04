const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
app.get('/health', (req, res) => res.status(200).send('OK'));

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

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

  socket.on('join-room', async ({ roomId, uid, name, avatarUrl }) => {
    try {
      socket.join(roomId);
      socket.userId = uid; // Store for disconnect logic
      
      // Marcar como online no backend
      try {
        const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8081/api';
        await fetch(`${BACKEND_URL}/auth/users/${uid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isOnline: true })
        });
      } catch (e) {
        console.error(`[STATUS] Error marking online for ${uid}:`, e.message);
      }

      if (!rooms[roomId]) rooms[roomId] = new Map();
      
      // Envia a lista de sockets existentes para o novo usuário (para a classe Peer)
      const existingSockets = Array.from(rooms[roomId].keys());
      socket.emit("all-users", existingSockets);

      rooms[roomId].set(socket.id, { uid, name, avatarUrl, socketId: socket.id, isMicOn: true, isCamOn: true });
      
      const participants = Array.from(rooms[roomId].values());
      io.to(roomId).emit('room-participants', participants);
      console.log(`[ROOM] User ${name} (${uid}) joined ${roomId}. Participants: ${participants.length}`);
    } catch (e) {
      console.error(`Error joining room:`, e);
    }
  });

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

  // Novos eventos de Sinalização WebRTC (Padrão Simple-Peer / Classe Peer)
  socket.on("sending-signal", payload => {
    io.to(payload.userToSignal).emit('user-joined', { signal: payload.signal, callerID: payload.callerID });
  });

  socket.on("returning-signal", payload => {
    io.to(payload.callerID).emit('receiving-returned-signal', { signal: payload.signal, id: socket.id });
  });

  // Legado (Mantido por compatibilidade de transição)
  socket.on('webrtc-signal', ({ roomId, signal }) => {
    try {
      if (signal.targetUid && rooms[roomId]) {
        const target = Array.from(rooms[roomId].values()).find(p => p.uid === signal.targetUid);
        if (target) {
          io.to(target.socketId).emit('webrtc-signal', signal);
          return;
        }
      }
      socket.to(roomId).emit('webrtc-signal', signal);
    } catch (e) {
      console.error(`Error in WebRTC signaling:`, e);
    }
  });

  socket.on('leave-room', ({ roomId }) => {
    socket.leave(roomId);
    if (rooms[roomId]) {
      rooms[roomId].delete(socket.id);
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

  socket.on('disconnect', async () => {
    console.log(`[-] User disconnected: ${socket.id} | Active connections: ${io.engine.clientsCount - 1}`);
    const userId = socket.userId; // Precisamos armazenar o userId no socket ao conectar
    
    if (userId) {
      // Notificar o backend que o usuário ficou offline, mas preservar o status de texto
      try {
        const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8081/api';
        await fetch(`${BACKEND_URL}/auth/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isOnline: false })
        });
        console.log(`[STATUS] User ${userId} marked as OFFLINE (presence only)`);
      } catch (e) {
        console.error(`[STATUS] Error updating offline status for ${userId}:`, e.message);
      }
    }

    for (const roomId in rooms) {
      if (rooms[roomId].has(socket.id)) {
        rooms[roomId].delete(socket.id);
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
