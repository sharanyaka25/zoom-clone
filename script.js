// 🔝 Add this at the top
const username = prompt("Enter your name");
const chatMessages = [];
const socket = io('/');

const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443'
});
let myVideoStream;
const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};
// fetch existing chat
fetch(`/api/messages/${ROOM_ID}`)
  .then(r => r.json())
  .then(messages => {
    messages.forEach(m => {
      const msgEl = document.createElement('div');
      msgEl.innerHTML = `<strong>${m.username}</strong>: ${m.message}`;
      messagesContainer.append(msgEl);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
 


navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream);

  myPeer.on('call', call => {
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    });
  });

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream);
  });

  // Fetch previous chat messages when joining a room
  fetch(`/api/messages/${ROOM_ID}`)
    .then(response => response.json())
    .then(messages => {
      messages.forEach(msg => {
        chatMessages.push(msg.message);
        const msgEl = document.createElement('div');
        msgEl.innerText = msg.message;
        messagesContainer.append(msgEl);
      });
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });

  // Keyboard enter for message
  let text = $("input");
  $('html').keydown(function (e) {
    if (e.which == 13 && text.val().length !== 0) {
      socket.emit('message', text.val());
      text.val('');
    }
  });
});

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close();
});

// 🛠️ Modify this block:
myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id, username); // now sends username
});

const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-message');
const messagesContainer = document.getElementById('messages');

// Send message on form submit
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = chatInput.value;
  if (message.trim().length > 0) {
    socket.emit('message', message);
    chatInput.value = '';
  }
});

// ✅ Receive and save messages
socket.on('createMessage', message => {
  chatMessages.push(message); // Save for download

  const msgEl = document.createElement('div');
  msgEl.innerText = message;
  messagesContainer.append(msgEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  });
  call.on('close', () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}


// ✅ Download chat function
function downloadChat() {
  const chatText = chatMessages.join('\n');
  const blob = new Blob([chatText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `chat-${ROOM_ID}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
let participants = {};

socket.on("user-connected", (userId, username) => {
   participants[userId] = username || `User (${userId})`;
   updateParticipantsList();
});
let text  =$('input');
$('html').keydown((e) => {
   if (e.which == 13 && text.val().length !== 0) {
    console.log( text.val())
    socket.emit('message', text.val());
    text.val('');
   }
});
 
socket.on(' create message',message  => {
    console.log('createMessage', message)
    $('.messages').append(`<li class="message"><b>user</b><br/>${message}</li>`);
})
  

socket.on("user-disconnected", (userId) => {
   delete participants[userId];
   updateParticipantsList();
});

function updateParticipantsList() {
   const list = document.getElementById("participants-list");
   list.innerHTML = "";
   Object.values(participants).forEach(name => {
      const li = document.createElement("li");
      li.textContent = name;
      list.appendChild(li);
   });
   socket.on('room-locked', () => {
    alert("This room is locked. You cannot join.");
    window.location.href = "/"; // redirect to home or show a message
  });
  socket.emit('current-users', usersInRoom[roomId]);
  socket.on("current-users", (users) => {
    participants = users;
    updateParticipantsList();
  });
  const username = prompt("Enter your name");
  socket.emit("join-room", ROOM_ID, peer.id, username);
  socket.on("room-locked", () => {
    alert("The meeting is locked. You cannot join.");
    window.location.href = "/"; // optional redirect
  });
  socket.on('message', text => {
    const msgEl = document.createElement('div');
    msgEl.textContent = text;
    messagesContainer.append(msgEl);
  });
    
}
