const Chat = require("../backend/model/chat");
const User = require('../backend/model/User');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('⚡ Socket connected:', socket.id);

    // Join a specific chat room
    socket.on('joinRoom', async ({ chatId, userId }) => {
      try {
        const chat = await Chat.findById(chatId).populate('participants', 'name profileImage');
        if (!chat) return;

        socket.join(chatId);
        console.log(`User ${userId} joined room ${chatId}`);

        // Send existing messages
        socket.emit('chatStarted', { chatId, messages: chat.messages });
      } catch (err) {
        console.error(err);
      }
    });

    // Send a message
    socket.on('sendMessage', async ({ chatId, senderId, message }) => {
    try {
      const sender = await User.findById(senderId); // get sender details
      const chat = await Chat.findById(chatId);
      if (!chat) return;

      const newMsg = {
        sender: senderId,
        content: message,
        timestamp: new Date()
      };

      chat.messages.push(newMsg);
      await chat.save();

      // Broadcast to all users in the chat room
      io.to(chatId).emit('receiveMessage', {
        senderId,
        message,
        timestamp: newMsg.timestamp,
        senderImage: sender.profileImage || 'https://via.placeholder.com/150/2563eb/ffffff?text=User'
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  });


    // Typing notifications
    socket.on('typing', ({ chatId, senderId, isTyping }) => {
      socket.to(chatId).emit('typingNotification', { senderId, isTyping });
    });
  });
};
