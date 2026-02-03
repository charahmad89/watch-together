const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const paymentRoutes = require('./routes/payments');

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/payments', paymentRoutes);



const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? (process.env.CLIENT_URL || ["https://your-production-domain.com"]) 
      : "*", 
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store room state in memory for now (or use Redis/DB later)
const rooms = new Map();
// Track disconnects for graceful reconnect handling: userId -> { timeout, roomId }
const disconnectTimers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomId, user }) => {
    // Clear any pending disconnect timer for this user
    if (disconnectTimers.has(user.id)) {
      console.log(`User ${user.name} reconnected, cancelling cleanup.`);
      clearTimeout(disconnectTimers.get(user.id).timeout);
      disconnectTimers.delete(user.id);
    }

    socket.join(roomId);
    // Attach metadata to socket for efficient disconnect handling
    socket.roomId = roomId;
    socket.userId = user.id;

    console.log(`User ${user.name} (${socket.id}) joined room ${roomId}`);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        participants: [],
        playbackState: {
          isPlaying: false,
          currentTime: 0,
          timestamp: Date.now()
        },
        hostUserId: user.id // Use stable User ID for host authority
      });
    }

    const room = rooms.get(roomId);
    
    // Check if user is already in participants (reconnect scenario)
    const existingParticipantIndex = room.participants.findIndex(p => p.userId === user.id);
    
    if (existingParticipantIndex !== -1) {
      // Update existing participant
      room.participants[existingParticipantIndex] = { 
        ...user, 
        userId: user.id, 
        socketId: socket.id,
        isOnline: true 
      };
    } else {
      // Add new participant
      room.participants.push({ 
        ...user, 
        userId: user.id, 
        socketId: socket.id, // Store current socket ID
        isOnline: true
      });
    }

    // Determine current host socket ID
    let hostSocketId = null;
    const hostParticipant = room.participants.find(p => p.userId === room.hostUserId);
    if (hostParticipant) {
      hostSocketId = hostParticipant.socketId;
    } else {
      // Host not found (maybe left?), assign new host
      if (room.participants.length > 0) {
        room.hostUserId = room.participants[0].userId;
        hostSocketId = room.participants[0].socketId;
      }
    }

    // Broadcast updated participant list and host ID
    io.to(roomId).emit('participants-update', { 
      participants: room.participants, 
      hostId: hostSocketId 
    });
    
    // Send existing users to the new user for WebRTC signaling
    const existingUsers = room.participants.filter(p => p.socketId !== socket.id && p.isOnline);
    socket.emit('existing-users', existingUsers);

    // Send current playback state to the new user
    socket.emit('playback-state', room.playbackState);
  });

  socket.on('sync-playback', ({ roomId, playbackState }) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      
      // STRICT AUTHORITY CHECK: Only the host can sync playback
      if (room.hostUserId !== socket.userId) {
        console.warn(`Unauthorized sync attempt by ${socket.id} in room ${roomId}`);
        return;
      }

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

  // WebRTC Signaling for Voice Chat
  socket.on('offer', (payload) => {
    io.to(payload.target).emit('offer', payload);
  });

  socket.on('answer', (payload) => {
    io.to(payload.target).emit('answer', payload);
  });

  socket.on('ice-candidate', (payload) => {
    io.to(payload.target).emit('ice-candidate', payload);
  });

  socket.on('signal', (payload) => {
    io.to(payload.target).emit('signal', payload);
  });

  socket.on('kick-user', ({ roomId, targetUserId }) => {
    const room = rooms.get(roomId);
    if (room && room.hostUserId === socket.userId) { // Check via userId
      const index = room.participants.findIndex(p => p.userId === targetUserId);
      if (index !== -1) {
        const participant = room.participants[index];
        io.to(participant.socketId).emit('kicked');
        room.participants.splice(index, 1);
        
        // Resolve host socket ID
        const hostParticipant = room.participants.find(p => p.userId === room.hostUserId);
        
        io.to(roomId).emit('participants-update', { 
          participants: room.participants, 
          hostId: hostParticipant ? hostParticipant.socketId : null 
        });
        
        const socketToKick = io.sockets.sockets.get(participant.socketId);
        if (socketToKick) {
          socketToKick.leave(roomId);
        }
      }
    }
  });

  socket.on('end-party', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (room && room.hostUserId === socket.userId) {
      io.to(roomId).emit('party-ended');
      // Clear room data
      io.in(roomId).socketsLeave(roomId);
      rooms.delete(roomId);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const { roomId, userId } = socket;
    
    if (!roomId || !userId || !rooms.has(roomId)) return;

    // Schedule cleanup with a grace period (e.g., 5 seconds)
    // This allows users to refresh the page without losing their spot or host status
    const timeout = setTimeout(() => {
      if (!rooms.has(roomId)) return;
      const room = rooms.get(roomId);
      
      const index = room.participants.findIndex(p => p.userId === userId);
      if (index !== -1) {
        room.participants.splice(index, 1); // Remove user

        if (room.participants.length === 0) {
          console.log(`Room ${roomId} is empty, deleting...`);
          rooms.delete(roomId);
          disconnectTimers.delete(userId);
        } else {
          // Transfer host if needed
          if (room.hostUserId === userId) {
            room.hostUserId = room.participants[0].userId;
          }
          
          const hostParticipant = room.participants.find(p => p.userId === room.hostUserId);
          
          io.to(roomId).emit('participants-update', { 
            participants: room.participants, 
            hostId: hostParticipant ? hostParticipant.socketId : null
          });
          io.to(roomId).emit('user-left', { userId: socket.id });
        }
      }
      disconnectTimers.delete(userId);
    }, 5000); // 5 seconds grace period

    disconnectTimers.set(userId, { timeout, roomId });
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
