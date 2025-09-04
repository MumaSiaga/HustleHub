const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
});

const chatSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  product: { // optional, if you also have product chats
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  ],
  messages: [messageSchema],
  isClosed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-update lastMessageAt on new message
chatSchema.pre('save', function (next) {
  if (this.messages && this.messages.length > 0) {
    this.lastMessageAt = this.messages[this.messages.length - 1].timestamp;
  }
  next();
});

// Sort participants array before validation/save
chatSchema.pre('validate', function(next) {
  if (this.participants && this.participants.length > 1) {
    this.participants = this.participants.map(id => id.toString()).sort();
  }
  next();
});

// Optional: enforce unique chat per product/job + participants
chatSchema.index({ product: 1, job: 1, participants: 1 }, { unique: true });

module.exports = mongoose.model('Chat', chatSchema);
