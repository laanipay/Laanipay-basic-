const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  authenticateToken 
} = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const { findBinaryPosition } = require('../utils/binaryTree');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phoneNumber')
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('withdrawalPin')
    .matches(/^\d{4}$/)
    .withMessage('Withdrawal PIN must be exactly 4 digits'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { firstName, lastName, email, phoneNumber, password, withdrawalPin, referralCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phoneNumber }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? 
          'Email already registered' : 
          'Phone number already registered',
      });
    }

    // Find sponsor if referral code provided
    let sponsor = null;
    if (referralCode) {
      sponsor = await User.findOne({ referralCode });
      if (!sponsor) {
        return res.status(400).json({
          success: false,
          message: 'Invalid referral code',
        });
      }
    }

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      withdrawalPin,
      sponsorId: sponsor ? sponsor._id : null,
      ipAddress: req.ip,
      deviceInfo: req.get('User-Agent'),
    });

    // Find binary position if there's a sponsor
    if (sponsor) {
      const binaryPosition = await findBinaryPosition(sponsor._id);
      newUser.parentId = binaryPosition.parentId;
      newUser.position = binaryPosition.position;
      newUser.level = binaryPosition.level;
    }

    // Generate email verification token
    newUser.emailVerificationToken = crypto.randomBytes(32).toString('hex');

    await newUser.save();

    // Update binary tree structure
    if (newUser.parentId) {
      await updateBinaryTreeCounts(newUser._id);
    }

    // Create registration transaction
    const registrationTransaction = new Transaction({
      userId: newUser._id,
      type: 'registration_fee',
      amount: 3500,
      description: 'Registration fee payment',
      status: 'pending',
      balanceBefore: 0,
      balanceAfter: 0,
    });

    await registrationTransaction.save();

    // Send verification email
    try {
      await sendEmail({
        to: email,
        subject: 'Verify your LPN PRO account',
        html: `
          <h2>Welcome to LPN PRO!</h2>
          <p>Thank you for registering. Please click the link below to verify your email:</p>
          <a href="${process.env.FRONTEND_URL}/verify-email?token=${newUser.emailVerificationToken}">
            Verify Email
          </a>
          <p>This link will expire in 24 hours.</p>
        `,
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    // Generate tokens
    const token = generateToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email and complete payment.',
      data: {
        user: {
          id: newUser._id,
          userId: newUser.userId,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
          currentStage: newUser.currentStage,
          emailVerified: newUser.emailVerified,
          registrationFeePaid: newUser.registrationFee.paid,
          referralCode: newUser.referralCode,
          referralLink: newUser.getReferralLink(),
        },
        tokens: {
          accessToken: token,
          refreshToken,
        },
        paymentRequired: {
          amount: 3500,
          reference: registrationTransaction.reference,
        },
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts',
        lockUntil: user.lockUntil,
      });
    }

    // Check if account is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked',
        reason: user.blockReason,
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          currentStage: user.currentStage,
          availableBalance: user.availableBalance,
          totalEarnings: user.totalEarnings,
          emailVerified: user.emailVerified,
          registrationFeePaid: user.registrationFee.paid,
          referralCode: user.referralCode,
          referralLink: user.getReferralLink(),
        },
        tokens: {
          accessToken: token,
          refreshToken,
        },
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive || user.isBlocked) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    // Generate new tokens
    const newAccessToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      },
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
});

// @route   GET /api/auth/verify-email
// @desc    Verify email address
// @access  Public
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token required',
      });
    }

    // Find user with verification token
    const user = await User.findOne({ emailVerificationToken: token });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    // Verify email
    user.emailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully',
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed',
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    try {
      await sendEmail({
        to: email,
        subject: 'Reset your LPN PRO password',
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">
            Reset Password
          </a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });
    } catch (emailError) {
      console.error('Password reset email failed:', emailError);
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset request failed',
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { token, password } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful',
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -withdrawalPin')
      .populate('sponsorId', 'firstName lastName userId')
      .populate('parentId', 'firstName lastName userId');

    res.json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          referralLink: user.getReferralLink(),
        },
      },
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// Helper function to update binary tree counts
async function updateBinaryTreeCounts(userId) {
  const user = await User.findById(userId);
  if (!user || !user.parentId) return;

  let currentParent = await User.findById(user.parentId);
  
  while (currentParent) {
    if (user.position === 'left') {
      currentParent.leftCount += 1;
    } else {
      currentParent.rightCount += 1;
    }
    
    currentParent.totalDownline += 1;
    await currentParent.save();
    
    // Check for stage upgrade
    if (currentParent.canUpgradeStage()) {
      // Trigger stage upgrade logic here
    }
    
    // Move up the tree
    currentParent = currentParent.parentId ? 
      await User.findById(currentParent.parentId) : null;
  }
}

module.exports = router;