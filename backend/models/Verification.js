const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 2024
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    default: 1000
  },
  calculationAmount: {
    type: Number,
    required: [true, 'Calculation amount is required'],
    default: 500
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['pending', 'paid', 'verified', 'expired'],
    default: 'pending'
  },
  paymentReference: {
    type: String,
    index: true
  },
  paymentGateway: {
    type: String,
    enum: ['paystack', 'flutterwave', 'manual'],
    default: 'manual'
  },
  paidAt: Date,
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: {
    type: Date,
    required: true
  },
  remindersSent: {
    type: Number,
    default: 0
  },
  lastReminderAt: Date,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate verifications
verificationSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });
verificationSchema.index({ status: 1 });
verificationSchema.index({ dueDate: 1 });

// Virtual to check if verification is overdue
verificationSchema.virtual('isOverdue').get(function() {
  return this.status !== 'verified' && new Date() > this.dueDate;
});

// Static method to create monthly verification for user
verificationSchema.statics.createMonthlyVerification = async function(userId, month = null, year = null) {
  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();
  
  // Check if verification already exists
  const existing = await this.findOne({ userId, month: targetMonth, year: targetYear });
  if (existing) {
    return existing;
  }

  // Create due date (end of the month)
  const dueDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

  const verification = new this({
    userId,
    month: targetMonth,
    year: targetYear,
    dueDate,
    amount: parseInt(process.env.MONTHLY_VERIFICATION_FEE) || 1000,
    calculationAmount: parseInt(process.env.MONTHLY_CALCULATION_FEE) || 500
  });

  return await verification.save();
};

// Method to mark as paid
verificationSchema.methods.markAsPaid = function(paymentReference, gateway = 'manual') {
  this.status = 'paid';
  this.paidAt = new Date();
  this.paymentReference = paymentReference;
  this.paymentGateway = gateway;
  return this.save();
};

// Method to verify payment
verificationSchema.methods.verify = function(verifiedBy) {
  this.status = 'verified';
  this.verifiedAt = new Date();
  this.verifiedBy = verifiedBy;
  return this.save();
};

module.exports = mongoose.model('Verification', verificationSchema);