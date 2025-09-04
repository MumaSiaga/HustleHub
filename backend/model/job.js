
const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  salary: { type: Number, required: true },
  contact: { type: String, required: true, trim: true },
  employerid: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } 
  },
  applicants: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // keep ref too
      name: { type: String, required: true },
      email: { type: String, required: true },
      skills: { type: [String], required: true },
      location: { type: String, required: true },
      appliedAt: { type: Date, default: Date.now }
    }
  ],
  city: { type: String },
  createdAt: { type: Date, default: Date.now }
});


JobSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Job', JobSchema);