const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  withdrawalPin: {
    type: String,
    required: [true, 'Withdrawal PIN is required'],
    match: [/^\d{4}$/, 'PIN must be exactly 4 digits'],
  },

  // MLM Structure
  userId: {
    type: String,
    unique: true,
    required: true,
  },
  referralCode: {
    type: String,
    unique: true,
    required: true,
  },
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // Binary Tree Structure
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  leftChild: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  rightChild: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  position: {
    type: String,
    enum: ['left', 'right', 'root'],
    default: 'root',
  },
  level: {
    type: Number,
    default: 0,
  },

  // Stage and Status
  currentStage: {
    type: String,
    enum: ['feeder', 'marketer', 'manager', 'senior_manager', 'director', 'ruby_director', 'diamond_director'],
    default: 'feeder',
  },
  stageLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 3,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Earnings and Wallet
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0,
  },
  availableBalance: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalWithdrawn: {
    type: Number,
    default: 0,
    min: 0,
  },
  pendingEarnings: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Verification Status
  monthlyVerification: {
    lastVerified: {
      type: Date,
      default: null,
    },
    isVerifiedThisMonth: {
      type: Boolean,
      default: false,
    },
    verificationCount: {
      type: Number,
      default: 0,
    },
  },

  // Counters for Binary Tree
  leftCount: {
    type: Number,
    default: 0,
  },
  rightCount: {
    type: Number,
    default: 0,
  },
  totalDownline: {
    type: Number,
    default: 0,
  },

  // Role and Permissions
  role: {
    type: String,
    enum: ['member', 'coordinator', 'admin'],
    default: 'member',
  },
  coordinatorLevel: {
    type: Number,
    default: 0,
  },

  // Payment and Registration
  registrationFee: {
    amount: {
      type: Number,
      default: 3500,
    },
    paid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paymentReference: {
      type: String,
      default: null,
    },
  },

  // Account Status
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    default: null,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  blockReason: {
    type: String,
    default: null,
  },

  // Security
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
    default: null,
  },

  // Recycling Counter
  recycleCount: {
    type: Number,
    default: 0,
  },

  // Metadata
  ipAddress: {
    type: String,
    default: null,
  },
  deviceInfo: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better performance
userSchema.index({ userId: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ email: 1 });
userSchema.index({ sponsorId: 1 });
userSchema.index({ parentId: 1 });
userSchema.index({ currentStage: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password and PIN
userSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  // Hash withdrawal PIN if modified
  if (this.isModified('withdrawalPin')) {
    this.withdrawalPin = await bcrypt.hash(this.withdrawalPin, 12);
  }

  // Generate unique user ID and referral code
  if (this.isNew) {
    this.userId = `LPN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    this.referralCode = `REF${Date.now()}${Math.floor(Math.random() * 10000)}`;
  }

  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to compare withdrawal PIN
userSchema.methods.compareWithdrawalPin = async function(candidatePin) {
  return bcrypt.compare(candidatePin, this.withdrawalPin);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: {
        loginAttempts: 1,
      },
      $unset: {
        lockUntil: 1,
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // If we have exceeded max attempts and it's not locked already, lock the account
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // Lock for 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1,
    }
  });
};

// Method to check if user can be upgraded to next stage
userSchema.methods.canUpgradeStage = function() {
  const stageRequirements = {
    feeder: { left: 1, right: 1 },
    marketer: { left: 14, right: 14 },
    manager: { left: 112, right: 112 },
    senior_manager: { left: 896, right: 896 },
    director: { left: 7168, right: 7168 },
    ruby_director: { left: 57344, right: 57344 },
    diamond_director: { left: 458752, right: 458752 },
  };

  const requirements = stageRequirements[this.currentStage];
  if (!requirements) return false;

  return this.leftCount >= requirements.left && this.rightCount >= requirements.right;
};

// Method to get referral link
userSchema.methods.getReferralLink = function() {
  return `${process.env.FRONTEND_URL}/register?ref=${this.referralCode}`;
};

module.exports = mongoose.model('User', userSchema);