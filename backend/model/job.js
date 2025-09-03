const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  salary: { type: Number, required: true },
  contact: { type: String, required: true, trim: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  city: { type: String }, // new field to store nearest city
  createdAt: { type: Date, default: Date.now }
});

// Geospatial index
JobSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Job', JobSchema);
