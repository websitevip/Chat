const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

let waitingUser = null;
let onlineUsers = 0;

io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('onlineUsers', onlineUsers);
  console.log('User connected:', socket.id, 'Total online:', onlineUsers);

  socket.on('find-stranger', () => {
    if (waitingUser && waitingUser.id !== socket.id) {
      socket.emit('matched', { peerId: waitingUser.id, initiator: true });
      waitingUser.emit('matched', { peerId: socket.id, initiator: false });
      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  socket.on('signal', (data) => {
    io.to(data.to).emit('signal', { signal: data.signal, from: socket.id });
  });

  socket.on('disconnect', () => {
    onlineUsers--;
    io.emit('onlineUsers', onlineUsers);
    console.log('User disconnected:', socket.id, 'Total online:', onlineUsers);
    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    }
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server running on port 3000');
});