const socket = io();

// Join room
socket.emit('join-room', ROOM_ID, USER_ID, USERNAME); // These variables should be passed via EJS

// Render messages to chat box
function appendMessage(msgObj) {
  const messageElement = document.createElement('div');
  messageElement.textContent = `${msgObj.username}: ${msgObj.message}`;
  document.getElementById('chat-box').appendChild(messageElement);
}

// 1. Show chat history on join
socket.on('chat-history', (messages) => {
  messages.forEach(msg => appendMessage(msg));
});

// 2. Show new incoming message
socket.on('createMessage', (message) => {
  appendMessage({ username: USERNAME, message }); // If you want to show others' name, adjust accordingly
});

// 3. Send message to server
document.getElementById('chat-form').addEventListener('submit', e => {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const msg = input.value;
  if (msg.trim()) {
    socket.emit('message', msg); // Server handles and broadcasts this
    input.value = '';
  }
});
