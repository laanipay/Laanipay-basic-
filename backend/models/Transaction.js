const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: [
      'registration_payment',
      'stage_earning',
      'monthly_verification',
      'monthly_earning',
      'withdrawal',
      'referral_bonus',
      'spillover_bonus',
      'recycling_bonus'
    ]
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  
  // Payment Gateway Information
  paymentGateway: {
    type: String,
    enum: ['paystack', 'flutterwave', 'manual'],
    default: 'manual'
  },
  paymentReference: {
    type: String,
    index: true
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // MLM Specific Information
  relatedStage: {
    type: String,
    enum: ['feeder', 'stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'stage6']
  },
  stageLevel: {
    type: Number,
    min: 1,
    max: 3
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Withdrawal Specific
  withdrawalMethod: {
    type: String,
    enum: ['bank_transfer', 'mobile_money', 'wallet']
  },
  withdrawalDetails: {
    accountNumber: String,
    accountName: String,
    bankName: String,
    bankCode: String
  },
  withdrawalPin: {
    type: String,
    select: false
  },
  
  // Processing Information
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: Date,
  adminNotes: {
    type: String,
    maxlength: [1000, 'Admin notes cannot be more than 1000 characters']
  },

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }

}, {
  timestamps: true
});

// Indexes for better performance
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ paymentReference: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });

// Virtual to calculate net amount (considering fees)
transactionSchema.virtual('netAmount').get(function() {
  if (this.type === 'withdrawal') {
    // Subtract withdrawal fees if any
    const withdrawalFee = this.metadata?.withdrawalFee || 0;
    return this.amount - withdrawalFee;
  }
  return this.amount;
});

// Method to validate withdrawal PIN
transactionSchema.methods.validateWithdrawalPin = async function(pin) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(pin, this.withdrawalPin);
};

module.exports = mongoose.model('Transaction', transactionSchema);