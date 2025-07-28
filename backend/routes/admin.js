const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Verification = require('../models/Verification');
const Stage = require('../models/Stage');
const { protect, authorize } = require('../middleware/auth');
const { getPaginationMeta } = require('../utils/helpers');
const { initializeStages } = require('../utils/mlm');

const router = express.Router();

// All admin routes require admin authorization
router.use(protect, authorize('admin'));

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsersToday = await User.countDocuments({
      registrationDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    // Get stage distribution
    const stageDistribution = await User.aggregate([
      {
        $group: {
          _id: '$currentStage',
          count: { $sum: 1 },
          totalEarnings: { $sum: '$totalEarnings' }
        }
      }
    ]);

    // Get financial statistics
    const financialStats = await Transaction.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get pending withdrawals
    const pendingWithdrawals = await Transaction.countDocuments({
      type: 'withdrawal',
      status: 'pending'
    });

    // Get pending verifications
    const pendingVerifications = await Verification.countDocuments({
      status: 'paid'
    });

    // Recent activities
    const recentRegistrations = await User.find()
      .sort({ registrationDate: -1 })
      .limit(5)
      .select('fullName email registrationDate currentStage');

    const recentTransactions = await Transaction.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'fullName email')
      .select('type amount description createdAt userId');

    // Monthly growth data
    const monthlyGrowth = await User.aggregate([
      {
        $match: {
          registrationDate: {
            $gte: new Date(new Date().getFullYear(), 0, 1) // Start of current year
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$registrationDate' },
            month: { $month: '$registrationDate' }
          },
          newUsers: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const dashboardData = {
      statistics: {
        totalUsers,
        activeUsers,
        newUsersToday,
        pendingWithdrawals,
        pendingVerifications
      },
      stageDistribution,
      financialStats,
      monthlyGrowth,
      recentActivities: {
        registrations: recentRegistrations,
        transactions: recentTransactions
      }
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data'
    });
  }
});

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { search, stage, status, role } = req.query;

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { referralCode: { $regex: search, $options: 'i' } }
      ];
    }
    if (stage) filter.currentStage = stage;
    if (status) filter.isActive = status === 'active';
    if (role) filter.role = role;

    const users = await User.find(filter)
      .populate('sponsorId', 'fullName email referralCode')
      .sort({ registrationDate: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password -withdrawalPin');

    const totalUsers = await User.countDocuments(filter);
    const pagination = getPaginationMeta(page, limit, totalUsers);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

// @desc    Get single user details
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('sponsorId', 'fullName email referralCode')
      .populate('parentId', 'fullName email')
      .populate('directReferrals', 'fullName email currentStage registrationDate')
      .select('-password -withdrawalPin');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's transactions
    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    // Get user's verifications
    const verifications = await Verification.find({ userId: user._id })
      .sort({ year: -1, month: -1 })
      .limit(12);

    res.status(200).json({
      success: true,
      data: {
        user,
        transactions,
        verifications
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user details'
    });
  }
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
router.put('/users/:id/status', [
  body('isActive').isBoolean().withMessage('Status must be boolean'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
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

    const { isActive, reason } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password -withdrawalPin');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log the action
    console.log(`User ${user.email} ${isActive ? 'activated' : 'deactivated'} by admin. Reason: ${reason}`);

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin only)
router.put('/users/:id/role', [
  body('role').isIn(['member', 'coordinator', 'admin']).withMessage('Invalid role')
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

    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password -withdrawalPin');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
});

// @desc    Get all withdrawal requests
// @route   GET /api/admin/withdrawals
// @access  Private (Admin only)
router.get('/withdrawals', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { status } = req.query;

    const filter = { type: 'withdrawal' };
    if (status) filter.status = status;

    const withdrawals = await Transaction.find(filter)
      .populate('userId', 'fullName email phoneNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalWithdrawals = await Transaction.countDocuments(filter);
    const pagination = getPaginationMeta(page, limit, totalWithdrawals);

    // Get withdrawal statistics
    const stats = await Transaction.aggregate([
      { $match: { type: 'withdrawal' } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        withdrawals,
        stats,
        pagination
      }
    });

  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal requests'
    });
  }
});

// @desc    Process withdrawal request
// @route   PUT /api/admin/withdrawals/:id
// @access  Private (Admin only)
router.put('/withdrawals/:id', [
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('adminNotes').optional().trim().isLength({ max: 1000 }).withMessage('Admin notes cannot exceed 1000 characters')
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

    const { action, adminNotes } = req.body;

    const withdrawal = await Transaction.findById(req.params.id).populate('userId');

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawal.type !== 'withdrawal') {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction type'
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal request already processed'
      });
    }

    if (action === 'approve') {
      withdrawal.status = 'completed';
      withdrawal.processedBy = req.user.id;
      withdrawal.processedAt = new Date();
      withdrawal.adminNotes = adminNotes;

      // Update user's total withdrawals
      await User.findByIdAndUpdate(withdrawal.userId._id, {
        $inc: { totalWithdrawals: withdrawal.amount }
      });

    } else if (action === 'reject') {
      withdrawal.status = 'cancelled';
      withdrawal.processedBy = req.user.id;
      withdrawal.processedAt = new Date();
      withdrawal.adminNotes = adminNotes;

      // Refund the amount to user's wallet
      await User.findByIdAndUpdate(withdrawal.userId._id, {
        $inc: { walletBalance: withdrawal.amount }
      });
    }

    await withdrawal.save();

    res.status(200).json({
      success: true,
      message: `Withdrawal request ${action}d successfully`,
      data: withdrawal
    });

  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal request'
    });
  }
});

// @desc    Get pending verifications
// @route   GET /api/admin/verifications
// @access  Private (Admin only)
router.get('/verifications', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const verifications = await Verification.find(filter)
      .populate('userId', 'fullName email currentStage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalVerifications = await Verification.countDocuments(filter);
    const pagination = getPaginationMeta(page, limit, totalVerifications);

    res.status(200).json({
      success: true,
      data: {
        verifications,
        pagination
      }
    });

  } catch (error) {
    console.error('Get verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verifications'
    });
  }
});

// @desc    Verify monthly payment
// @route   PUT /api/admin/verifications/:id/verify
// @access  Private (Admin only)
router.put('/verifications/:id/verify', async (req, res) => {
  try {
    const verification = await Verification.findById(req.params.id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found'
      });
    }

    if (verification.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Verification not paid or already verified'
      });
    }

    await verification.verify(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Verification approved successfully',
      data: verification
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
});

// @desc    Get financial reports
// @route   GET /api/admin/reports
// @access  Private (Admin only)
router.get('/reports', async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    // Default to current month if no dates provided
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const filter = {
      createdAt: { $gte: start, $lte: end },
      status: 'completed'
    };

    if (type) filter.type = type;

    // Transaction summary
    const transactionSummary = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Daily breakdown
    const dailyBreakdown = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // User registration stats
    const registrationStats = await User.aggregate([
      {
        $match: {
          registrationDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$registrationDate' },
            month: { $month: '$registrationDate' },
            day: { $dayOfMonth: '$registrationDate' }
          },
          newRegistrations: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period: { start, end },
        transactionSummary,
        dailyBreakdown,
        registrationStats
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate reports'
    });
  }
});

// @desc    Initialize system (create stages, admin user)
// @route   POST /api/admin/initialize
// @access  Private (Admin only)
router.post('/initialize', async (req, res) => {
  try {
    // Initialize stage configurations
    await initializeStages();

    res.status(200).json({
      success: true,
      message: 'System initialized successfully'
    });

  } catch (error) {
    console.error('System initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize system'
    });
  }
});

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private (Admin only)
router.get('/logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get recent significant transactions
    const logs = await Transaction.find({
      type: { $in: ['stage_earning', 'withdrawal', 'registration_payment'] }
    })
    .populate('userId', 'fullName email')
    .populate('processedBy', 'fullName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const totalLogs = await Transaction.countDocuments({
      type: { $in: ['stage_earning', 'withdrawal', 'registration_payment'] }
    });

    const pagination = getPaginationMeta(page, limit, totalLogs);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination
      }
    });

  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system logs'
    });
  }
});

module.exports = router;