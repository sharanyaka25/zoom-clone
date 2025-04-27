const { v4: uuidV4 } = require('uuid');
const express = require('express');
const app = express();
const http = require('http');
const server = http.Server(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, { debug: true });
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/peerjs', peerServer);
app.set('view engine', 'ejs');
app.use(express.static('public'));

// ✅ Generate random room on root
app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

// ✅ Show join form
app.get('/:room', (req, res) => {
  const { room } = req.params;
  const { password } = req.query;
  const correctPassword = '123456';

  if (password === correctPassword) {
    res.render('room', { roomId: room });
  } else {
    res.render('join', { roomId: room });
  }
});

app.post('/join', (req, res) => {
  const { roomId, password } = req.body;
  const correctPassword = '123456';

  if (password === correctPassword) {
    res.redirect(`/${roomId}?password=${password}`);
  } else {
    res.send('❌ Incorrect password. <a href="/">Try again</a>');
  }
});

const usersInRoom = {};
const lockedRooms = {};

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId, username) => {
    if (lockedRooms[roomId]) {
      socket.emit('room-locked');
      return;
    }

    socket.join(roomId);

    if (!usersInRoom[roomId]) usersInRoom[roomId] = {};
    usersInRoom[roomId][userId] = username;

    // Emit user joined
    socket.to(roomId).broadcast.emit('user-connected', userId, username);

    // Send current user list
    socket.emit('current-users', usersInRoom[roomId]);

    // Chat messages (no DB)
    socket.on('message', message => {
      io.to(roomId).emit('createMessage', { username, message });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId);
      if (usersInRoom[roomId]) {
        delete usersInRoom[roomId][userId];
        if (Object.keys(usersInRoom[roomId]).length === 0) {
          delete usersInRoom[roomId];
        }
      }
    });
  });

  socket.on('toggle-lock', ({ roomId, lock }) => {
    lockedRooms[roomId] = lock;
  });
});

server.listen(process.env.PORT || 3030, () => {
  console.log('✅ Server is running on port 3030');
});
