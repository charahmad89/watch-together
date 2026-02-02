const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for now, should restrict in production
    methods: ["GET", "POST"]
  }
});

// Store room state in memory for now (or use Redis/DB later)
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomId, user }) => {
    socket.join(roomId);
    console.log(`User ${user.name} (${socket.id}) joined room ${roomId}`);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        participants: [],
        playbackState: {
          isPlaying: false,
          currentTime: 0,
          timestamp: Date.now()
        }
      });
    }

    const room = rooms.get(roomId);
    room.participants.push({ ...user, id: socket.id });

    // Broadcast updated participant list
    io.to(roomId).emit('participants-update', room.participants);
    
    // Send current playback state to the new user
    socket.emit('playback-state', room.playbackState);
  });

  socket.on('sync-playback', ({ roomId, playbackState }) => {
    // Update room state
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.playbackState = {
        ...playbackState,
        timestamp: Date.now()
      };
      // Broadcast to others in the room
      socket.to(roomId).emit('playback-update', room.playbackState);
    }
  });

  socket.on('send-message', ({ roomId, message }) => {
    io.to(roomId).emit('new-message', message);
  });

  socket.on('send-reaction', ({ roomId, reaction }) => {
    io.to(roomId).emit('new-reaction', reaction);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove user from rooms
    rooms.forEach((room, roomId) => {
      const index = room.participants.findIndex(p => p.id === socket.id);
      if (index !== -1) {
        room.participants.splice(index, 1);
        io.to(roomId).emit('participants-update', room.participants);
        io.to(roomId).emit('user-left', { userId: socket.id });
      }
    });
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
