const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[0-9+\-\s()]+$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  withdrawalPin: {
    type: String,
    required: [true, 'Withdrawal PIN is required'],
    minlength: [4, 'PIN must be 4 digits'],
    maxlength: [4, 'PIN must be 4 digits'],
    select: false
  },

  // Role Management
  role: {
    type: String,
    enum: ['member', 'coordinator', 'admin'],
    default: 'member'
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,

  // MLM Structure - Binary Tree
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  position: {
    type: String,
    enum: ['left', 'right'],
    default: null
  },
  leftChild: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rightChild: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Stage Information
  currentStage: {
    type: String,
    enum: ['feeder', 'stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'stage6'],
    default: 'feeder'
  },
  stageLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 3
  },
  stageMembersCount: {
    type: Number,
    default: 0
  },

  // Financial Information
  walletBalance: {
    type: Number,
    default: 0,
    min: [0, 'Wallet balance cannot be negative']
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: [0, 'Total earnings cannot be negative']
  },
  totalWithdrawals: {
    type: Number,
    default: 0,
    min: [0, 'Total withdrawals cannot be negative']
  },

  // Monthly Verification
  lastVerificationDate: {
    type: Date,
    default: null
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'expired'],
    default: 'pending'
  },
  monthlyVerificationCount: {
    type: Number,
    default: 0
  },

  // Referral Information
  referralCode: {
    type: String,
    unique: true,
    required: true
  },
  totalReferrals: {
    type: Number,
    default: 0
  },
  directReferrals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Coordinator Specific
  coordinatorTeams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Payment Information
  registrationPaymentId: String,
  registrationDate: {
    type: Date,
    default: Date.now
  },

  // Security
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  lastLogin: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ sponsorId: 1 });
userSchema.index({ parentId: 1 });
userSchema.index({ currentStage: 1 });

// Pre-save middleware to hash password and PIN
userSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Hash withdrawal PIN if modified
  if (this.isModified('withdrawalPin')) {
    const salt = await bcrypt.genSalt(parseInt(process.env.PIN_BCRYPT_ROUNDS) || 10);
    this.withdrawalPin = await bcrypt.hash(this.withdrawalPin, salt);
  }

  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to compare withdrawal PIN
userSchema.methods.comparePin = async function(candidatePin) {
  return await bcrypt.compare(candidatePin, this.withdrawalPin);
};

// Method to handle failed login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // If we've reached max attempts and it's not locked already, lock account
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    };
  }
  
  return this.updateOne(updates);
};

// Method to generate referral code
userSchema.methods.generateReferralCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'LPN';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Static method to find available position in binary tree
userSchema.statics.findAvailablePosition = async function(parentId = null) {
  if (!parentId) {
    // Find root with available position
    const roots = await this.find({ parentId: null, $or: [
      { leftChild: null },
      { rightChild: null }
    ]}).limit(1);
    
    if (roots.length > 0) {
      const position = !roots[0].leftChild ? 'left' : 'right';
      return { parentId: roots[0]._id, position };
    }
    
    // No root available, create new root
    return { parentId: null, position: null };
  }

  const parent = await this.findById(parentId);
  if (!parent) throw new Error('Parent not found');

  if (!parent.leftChild) {
    return { parentId, position: 'left' };
  } else if (!parent.rightChild) {
    return { parentId, position: 'right' };
  }

  // If parent is full, find next available position in the tree
  const queue = [parent.leftChild, parent.rightChild];
  
  while (queue.length > 0) {
    const currentId = queue.shift();
    const current = await this.findById(currentId);
    
    if (!current) continue;
    
    if (!current.leftChild) {
      return { parentId: currentId, position: 'left' };
    } else if (!current.rightChild) {
      return { parentId: currentId, position: 'right' };
    } else {
      queue.push(current.leftChild, current.rightChild);
    }
  }

  throw new Error('No available position found');
};

module.exports = mongoose.model('User', userSchema);