// public/js/socket-hiring.js
(() => {
  const socket = io();

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);

    if (window.currentUserId) {
      socket.emit('registerUser', { userId: window.currentUserId });
    }
  });

 
  socket.on('chatStarted', ({ roomId, chatId, messages }) => {
    console.log('Chat started:', chatId);
    window.currentRoomId = roomId;
    window.currentChatId = chatId;
   
  });

  socket.on('receiveMessage', (msg) => {
    console.log('Message received:', msg);

  });

  socket.on('typingNotification', ({ senderId, isTyping }) => {
    console.log(`User ${senderId} is ${isTyping ? 'typing...' : 'not typing'}`);
  });

  socket.on('chatClosed', () => {
    console.log('Chat closed.');

  });

  window.hiringSocket = socket;
})();
