const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
  stageName: {
    type: String,
    required: [true, 'Stage name is required'],
    enum: ['feeder', 'stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'stage6'],
    unique: true
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  levels: [{
    levelNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 3
    },
    membersRequired: {
      type: Number,
      required: true,
      min: 0
    },
    earnings: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalMembers: {
    type: Number,
    required: true,
    min: 0
  },
  totalEarnings: {
    type: Number,
    required: true,
    min: 0
  },
  monthlyEarnings: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Index for better performance
stageSchema.index({ stageName: 1 });
stageSchema.index({ order: 1 });

module.exports = mongoose.model('Stage', stageSchema);