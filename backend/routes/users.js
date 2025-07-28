const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Verification = require('../models/Verification');
const { protect, authorize, verifyPin } = require('../middleware/auth');
const { getUserTree, getStageConfig, canAdvanceLevel } = require('../utils/mlm');
const { getPaginationMeta, generateReferralLink } = require('../utils/helpers');

const router = express.Router();

// @desc    Get user dashboard data
// @route   GET /api/users/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('sponsorId', 'fullName email referralCode')
      .populate('directReferrals', 'fullName email currentStage registrationDate walletBalance');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get current month verification status
    const now = new Date();
    const currentVerification = await Verification.findOne({
      userId: user._id,
      month: now.getMonth() + 1,
      year: now.getFullYear()
    });

    // Get recent transactions
    const recentTransactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('type amount status description createdAt');

    // Get stage configuration
    const stageConfig = getStageConfig(user.currentStage);
    
    // Check advancement status
    const advancementStatus = await canAdvanceLevel(user._id);

    // Calculate earnings this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyEarnings = await Transaction.aggregate([
      {
        $match: {
          userId: user._id,
          type: { $in: ['stage_earning', 'monthly_earning', 'referral_bonus'] },
          status: 'completed',
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$amount' }
        }
      }
    ]);

    const dashboardData = {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        referralCode: user.referralCode,
        currentStage: user.currentStage,
        stageLevel: user.stageLevel,
        stageMembersCount: user.stageMembersCount,
        walletBalance: user.walletBalance,
        totalEarnings: user.totalEarnings,
        totalReferrals: user.totalReferrals,
        registrationDate: user.registrationDate,
        verificationStatus: user.verificationStatus,
        lastVerificationDate: user.lastVerificationDate
      },
      sponsor: user.sponsorId,
      referralLink: generateReferralLink(user.referralCode),
      directReferrals: user.directReferrals,
      currentStage: stageConfig,
      advancement: advancementStatus,
      monthlyVerification: currentVerification || null,
      monthlyEarnings: monthlyEarnings.length > 0 ? monthlyEarnings[0].totalEarnings : 0,
      recentTransactions,
      stats: {
        totalMembers: user.stageMembersCount,
        requiredMembers: stageConfig ? stageConfig.levels.find(l => l.level === user.stageLevel)?.members : 0,
        completionPercentage: stageConfig ? 
          Math.round((user.stageMembersCount / stageConfig.levels.find(l => l.level === user.stageLevel)?.members) * 100) : 0
      }
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data'
    });
  }
});

// @desc    Get user's binary tree
// @route   GET /api/users/tree
// @access  Private
router.get('/tree', protect, async (req, res) => {
  try {
    const { depth = 3 } = req.query;
    const maxDepth = Math.min(parseInt(depth), 5); // Limit max depth to 5

    const tree = await getUserTree(req.user.id, maxDepth);

    if (!tree) {
      return res.status(404).json({
        success: false,
        message: 'User tree not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        tree,
        depth: maxDepth
      }
    });

  } catch (error) {
    console.error('Tree error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user tree'
    });
  }
});

// @desc    Get user referrals
// @route   GET /api/users/referrals
// @access  Private
router.get('/referrals', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get direct referrals
    const directReferrals = await User.find({ sponsorId: req.user.id })
      .select('fullName email phoneNumber currentStage stageLevel walletBalance totalEarnings registrationDate isActive')
      .sort({ registrationDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalDirectReferrals = await User.countDocuments({ sponsorId: req.user.id });

    // Get referral statistics
    const referralStats = await User.aggregate([
      { $match: { sponsorId: req.user.id } },
      {
        $group: {
          _id: '$currentStage',
          count: { $sum: 1 },
          totalEarnings: { $sum: '$totalEarnings' }
        }
      }
    ]);

    const pagination = getPaginationMeta(page, limit, totalDirectReferrals);

    res.status(200).json({
      success: true,
      data: {
        referrals: directReferrals,
        stats: referralStats,
        pagination
      }
    });

  } catch (error) {
    console.error('Referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get referrals'
    });
  }
});

// @desc    Get user transactions
// @route   GET /api/users/transactions
// @access  Private
router.get('/transactions', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { type, status } = req.query;

    // Build filter
    const filter = { userId: req.user.id };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('type amount status description createdAt relatedStage stageLevel paymentReference');

    const totalTransactions = await Transaction.countDocuments(filter);

    // Get transaction summary
    const summary = await Transaction.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const pagination = getPaginationMeta(page, limit, totalTransactions);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        summary,
        pagination
      }
    });

  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phoneNumber')
    .optional()
    .matches(/^(\+234|234|0)?[789][01]\d{8}$/)
    .withMessage('Please enter a valid Nigerian phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { fullName, phoneNumber } = req.body;

    // Check if phone number is already taken
    if (phoneNumber) {
      const existingUser = await User.findOne({
        phoneNumber,
        _id: { $ne: req.user.id }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already in use'
        });
      }
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -withdrawalPin');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// @desc    Change withdrawal PIN
// @route   PUT /api/users/change-pin
// @access  Private
router.put('/change-pin', protect, [
  body('currentPin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('Current PIN must be 4 digits'),
  body('newPin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('New PIN must be 4 digits'),
  body('confirmPin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('Confirm PIN must be 4 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { currentPin, newPin, confirmPin } = req.body;

    if (newPin !== confirmPin) {
      return res.status(400).json({
        success: false,
        message: 'New PIN and confirm PIN do not match'
      });
    }

    const user = await User.findById(req.user.id).select('+withdrawalPin');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current PIN
    const isCurrentPinCorrect = await user.comparePin(currentPin);

    if (!isCurrentPinCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Current PIN is incorrect'
      });
    }

    // Set new PIN
    user.withdrawalPin = newPin;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Withdrawal PIN changed successfully'
    });

  } catch (error) {
    console.error('Change PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change PIN'
    });
  }
});

// @desc    Request withdrawal
// @route   POST /api/users/withdraw
// @access  Private
router.post('/withdraw', protect, verifyPin, [
  body('amount')
    .isNumeric()
    .custom(value => value > 0)
    .withMessage('Amount must be greater than 0'),
  body('withdrawalMethod')
    .isIn(['bank_transfer', 'mobile_money'])
    .withMessage('Invalid withdrawal method'),
  body('accountNumber')
    .notEmpty()
    .withMessage('Account number is required'),
  body('accountName')
    .notEmpty()
    .withMessage('Account name is required'),
  body('bankName')
    .optional()
    .notEmpty()
    .withMessage('Bank name is required for bank transfers')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { amount, withdrawalMethod, accountNumber, accountName, bankName, bankCode } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has sufficient balance
    if (user.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // Check minimum withdrawal amount (optional)
    const minWithdrawal = 1000; // ₦1,000 minimum
    if (amount < minWithdrawal) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal amount is ₦${minWithdrawal}`
      });
    }

    // Create withdrawal transaction
    const withdrawal = new Transaction({
      userId: user._id,
      type: 'withdrawal',
      amount,
      status: 'pending',
      description: `Withdrawal request via ${withdrawalMethod}`,
      withdrawalMethod,
      withdrawalDetails: {
        accountNumber,
        accountName,
        bankName: withdrawalMethod === 'bank_transfer' ? bankName : undefined,
        bankCode: withdrawalMethod === 'bank_transfer' ? bankCode : undefined
      }
    });

    await withdrawal.save();

    // Deduct amount from wallet (will be refunded if withdrawal is rejected)
    user.walletBalance -= amount;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        transactionId: withdrawal._id,
        amount,
        status: withdrawal.status
      }
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal request'
    });
  }
});

// @desc    Get monthly verification status
// @route   GET /api/users/verification
// @access  Private
router.get('/verification', protect, async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const verification = await Verification.findOne({
      userId: req.user.id,
      month: targetMonth,
      year: targetYear
    });

    if (!verification) {
      // Create verification record if it doesn't exist
      const newVerification = await Verification.createMonthlyVerification(
        req.user.id,
        targetMonth,
        targetYear
      );

      return res.status(200).json({
        success: true,
        data: newVerification
      });
    }

    res.status(200).json({
      success: true,
      data: verification
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification status'
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get earnings by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyEarnings = await Transaction.aggregate([
      {
        $match: {
          userId: user._id,
          type: { $in: ['stage_earning', 'monthly_earning', 'referral_bonus'] },
          status: 'completed',
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalEarnings: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get referral growth (last 12 months)
    const referralGrowth = await User.aggregate([
      {
        $match: {
          sponsorId: user._id,
          registrationDate: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$registrationDate' },
            month: { $month: '$registrationDate' }
          },
          newReferrals: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get stage progression history
    const stageHistory = await Transaction.find({
      userId: user._id,
      type: 'stage_earning',
      status: 'completed'
    }).sort({ createdAt: 1 }).select('relatedStage stageLevel amount createdAt');

    const stats = {
      totalEarnings: user.totalEarnings,
      walletBalance: user.walletBalance,
      totalReferrals: user.totalReferrals,
      currentStage: user.currentStage,
      stageLevel: user.stageLevel,
      monthlyEarnings,
      referralGrowth,
      stageHistory
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics'
    });
  }
});

module.exports = router;