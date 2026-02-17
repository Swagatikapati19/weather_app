const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
    trim: true,
  },
  temperature: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  humidity: {
    type: Number,
    required: true,
  },
  wind_speed: {
    type: Number,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

weatherSchema.index({ city: 1, timestamp: -1 });

module.exports = mongoose.model('Weather', weatherSchema);
