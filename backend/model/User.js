const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  location: { type: String },
  skills: { type: [String], default: [] },
  about: { type: String },
  certifications: { type: [String], default: [] },
  role: {
    type: String,
    enum: ['freelancer', 'client']
  },
  appliedJobs: [
    {
      job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
      status: { type: String, enum: ['pending', 'rejected', 'hired'], default: 'pending' }
    }
  ],
  contacts: [
    {
      name: { type: String },
      email: { type: String },
      phone: { type: String }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
