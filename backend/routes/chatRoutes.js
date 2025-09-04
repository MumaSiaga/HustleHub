const express = require('express');
const Chat = require('../model/chat');
const User = require('../model/User');
const { ensureAuth, redirectIfLoggedIn } = require('../middleware/authmiddleware');
const router = express.Router();

router.get('/',ensureAuth ,async (req, res) => {
  const currentUserId = req.user._id; // logged-in user ID

  try {
    // Fetch all chats for the current user
    const chats = await Chat.find({ participants: currentUserId })
      .populate('participants', 'username profileImage')  // include username
      .populate('messages.sender', 'username profileImage') // include sender username
      .sort({ updatedAt: -1 });

    // Pass `chat: null` to prevent ReferenceError in EJS
    res.render('chats', { chats, chat: null, currentUserId });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});



// GET single chat
// GET single chat
// GET single chat
router.get('/:chatId',ensureAuth ,async (req, res) => {
  const { chatId } = req.params;
  const currentUserId = req.user._id;

  try {
    // Fetch all chats for sidebar
    const chats = await Chat.find({ participants: currentUserId })
      .populate('participants', 'username profileImage')
      .populate('messages.sender', 'username profileImage')
      .sort({ updatedAt: -1 });

    // Fetch the selected chat
    const chat = await Chat.findById(chatId)
      .populate('participants', 'username profileImage')
      .populate('messages.sender', 'username profileImage');

    if (!chat) return res.status(404).send('Chat not found');

    // Find other participant
    const otherUser = chat.participants.find(p => p._id.toString() !== currentUserId.toString());

    // Fetch current user
    const currentUser = await User.findById(currentUserId);

    res.render('chats', { chats, chat, currentUser, otherUser, currentUserId });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


module.exports = router;