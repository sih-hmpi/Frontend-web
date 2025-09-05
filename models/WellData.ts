import mongoose from 'mongoose';

const wellDataSchema = new mongoose.Schema({
  STATE: {
    type: String,
    required: true,
    trim: true
  },
  DISTRICT: {
    type: String,
    required: true,
    trim: true
  },
  LAT: {
    type: Number,
    required: true
  },
  LON: {
    type: Number,
    required: true
  },
  SITE_TYPE: {
    type: String,
    required: true,
    trim: true
  },
  WLCODE: {
    type: String,
    required: true,
    trim: true
  },
  measurements: {
    type: Map,
    of: Number,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  strict: false // Allow flexible schema for measurements
});

// Add indexes for better query performance
wellDataSchema.index({ STATE: 1, DISTRICT: 1 });
wellDataSchema.index({ LAT: 1, LON: 1 });
wellDataSchema.index({ WLCODE: 1 }, { unique: true });

export const WellData = mongoose.models.WellData || mongoose.model('WellData', wellDataSchema);