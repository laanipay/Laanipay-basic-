const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: [
      'registration_fee',
      'stage_earnings',
      'monthly_verification_earnings',
      'withdrawal',
      'verification_payment',
      'referral_bonus',
      'spillover_bonus',
      'admin_adjustment',
    ],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  description: {
    type: String,
    required: true,
  },
  reference: {
    type: String,
    unique: true,
    required: true,
  },
  
  // Payment Gateway Details
  paymentGateway: {
    type: String,
    enum: ['paystack', 'flutterwave', 'manual', 'internal'],
    default: 'internal',
  },
  gatewayReference: {
    type: String,
    default: null,
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },

  // Stage related information
  stageInfo: {
    stageName: {
      type: String,
      enum: ['feeder', 'marketer', 'manager', 'senior_manager', 'director', 'ruby_director', 'diamond_director'],
      default: null,
    },
    stageLevel: {
      type: Number,
      default: null,
    },
    fromStage: {
      type: String,
      default: null,
    },
    toStage: {
      type: String,
      default: null,
    },
  },

  // Verification related
  verificationType: {
    type: String,
    enum: ['monthly', 'annual', 'special'],
    default: null,
  },
  verificationMonth: {
    type: String,
    default: null,
  },
  verificationYear: {
    type: Number,
    default: null,
  },

  // Withdrawal specific fields
  withdrawalDetails: {
    bankName: {
      type: String,
      default: null,
    },
    accountNumber: {
      type: String,
      default: null,
    },
    accountName: {
      type: String,
      default: null,
    },
    processingFee: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedReason: {
      type: String,
      default: null,
    },
  },

  // Binary tree related information
  binaryInfo: {
    leftCount: {
      type: Number,
      default: null,
    },
    rightCount: {
      type: Number,
      default: null,
    },
    triggerMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },

  // Admin details
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  adminNotes: {
    type: String,
    default: null,
  },

  // Metadata
  ipAddress: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },
  balanceBefore: {
    type: Number,
    default: 0,
  },
  balanceAfter: {
    type: Number,
    default: 0,
  },

  // Timestamps
  completedAt: {
    type: Date,
    default: null,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for better performance
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ reference: 1 });
transactionSchema.index({ gatewayReference: 1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ 'stageInfo.stageName': 1 });
transactionSchema.index({ verificationType: 1, verificationMonth: 1, verificationYear: 1 });

// Pre-save middleware to generate reference
transactionSchema.pre('save', function(next) {
  if (this.isNew && !this.reference) {
    this.reference = `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;
  }
  next();
});

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return `₦${this.amount.toLocaleString()}`;
});

// Virtual for transaction age
transactionSchema.virtual('age').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
});

// Method to mark transaction as completed
transactionSchema.methods.markCompleted = function(balanceAfter = null) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (balanceAfter !== null) {
    this.balanceAfter = balanceAfter;
  }
  return this.save();
};

// Method to mark transaction as failed
transactionSchema.methods.markFailed = function(reason = null) {
  this.status = 'failed';
  if (reason) {
    this.adminNotes = reason;
  }
  return this.save();
};

module.exports = mongoose.model('Transaction', transactionSchema);