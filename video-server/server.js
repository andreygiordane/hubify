const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/health', (req, res) => res.status(200).send('OK'));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ['websocket', 'polling']
});

const rooms = {};

io.on('connection', (socket) => {
  console.log(`[+] Conectado: ${socket.id}`);

  socket.on('join-room', ({ roomId, uid, name, avatarUrl }) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.userId = uid;

    if (!rooms[roomId]) rooms[roomId] = new Map();
    
    // Se o usuário já estava na sala com outro socket, remover o antigo
    rooms[roomId].set(socket.id, { socketId: socket.id, uid, name, avatarUrl, isMicOn: true, isCamOn: true });

    // Avisar quem já está na sala
    socket.to(roomId).emit('user-connected', socket.id);

    // Enviar lista para todos
    io.to(roomId).emit('room-participants', Array.from(rooms[roomId].values()));
  });

  socket.on('sending-signal', payload => {
    io.to(payload.userToSignal).emit('user-joined', { signal: payload.signal, callerID: payload.callerID });
  });

  socket.on('returning-signal', payload => {
    io.to(payload.callerID).emit('receiving-returned-signal', { signal: payload.signal, id: socket.id });
  });

  // ENCERRAMENTO DE CHAMADA (O que estava faltando)
  socket.on('end-call', ({ roomId }) => {
    console.log(`[CALL] Ending call in room ${roomId}`);
    io.to(roomId).emit('call-ended');
  });

  socket.on('leave-room', ({ roomId }) => {
    socket.leave(roomId);
    if (rooms[roomId]) {
      rooms[roomId].delete(socket.id);
      io.to(roomId).emit('room-participants', Array.from(rooms[roomId].values()));
      io.to(roomId).emit('user-disconnected', socket.id);
    }
  });

  socket.on('disconnect', () => {
    const { roomId } = socket;
    if (roomId && rooms[roomId]) {
      rooms[roomId].delete(socket.id);
      io.to(roomId).emit('room-participants', Array.from(rooms[roomId].values()));
      io.to(roomId).emit('user-disconnected', socket.id);
    }
  });

  socket.on('update-user-state', (data) => {
    if (rooms[data.roomId] && rooms[data.roomId].has(socket.id)) {
      const current = rooms[data.roomId].get(socket.id);
      rooms[data.roomId].set(socket.id, { ...current, ...data.state });
      io.to(data.roomId).emit('room-participants', Array.from(rooms[data.roomId].values()));
    }
  });
  
  socket.on('send-chat', (data) => io.to(data.roomId).emit('receive-chat', data.message));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => console.log(`Server listening on ${PORT}`));
