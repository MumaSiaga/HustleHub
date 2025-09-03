const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  salary: {
    type: Number,
    required: true
  },
  contact: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add geospatial index
JobSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Job', JobSchema);
