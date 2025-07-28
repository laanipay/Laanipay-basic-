const express = require('express');
const { body, validationResult } = require('express-validator');
const Stage = require('../models/Stage');
const User = require('../models/User');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { getStageConfig } = require('../utils/mlm');

const router = express.Router();

// @desc    Get all stages
// @route   GET /api/stages
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const stages = await Stage.find({ isActive: true })
      .sort({ order: 1 })
      .select('-__v');

    // Add current user count for each stage if available
    if (req.user) {
      for (let stage of stages) {
        const userCount = await User.countDocuments({ currentStage: stage.stageName });
        stage = stage.toObject();
        stage.currentUserCount = userCount;
      }
    }

    res.status(200).json({
      success: true,
      data: stages
    });

  } catch (error) {
    console.error('Get stages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stages'
    });
  }
});

// @desc    Get single stage details
// @route   GET /api/stages/:stageName
// @access  Public
router.get('/:stageName', optionalAuth, async (req, res) => {
  try {
    const { stageName } = req.params;

    const stage = await Stage.findOne({ 
      stageName, 
      isActive: true 
    }).select('-__v');

    if (!stage) {
      return res.status(404).json({
        success: false,
        message: 'Stage not found'
      });
    }

    // Get current user count
    const currentUserCount = await User.countDocuments({ currentStage: stageName });
    
    // Get level distribution
    const levelDistribution = await User.aggregate([
      { $match: { currentStage: stageName } },
      {
        $group: {
          _id: '$stageLevel',
          count: { $sum: 1 },
          totalEarnings: { $sum: '$totalEarnings' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const stageData = stage.toObject();
    stageData.currentUserCount = currentUserCount;
    stageData.levelDistribution = levelDistribution;

    res.status(200).json({
      success: true,
      data: stageData
    });

  } catch (error) {
    console.error('Get stage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stage details'
    });
  }
});

// @desc    Get stage statistics
// @route   GET /api/stages/:stageName/stats
// @access  Private
router.get('/:stageName/stats', protect, async (req, res) => {
  try {
    const { stageName } = req.params;

    // Verify stage exists
    const stage = await Stage.findOne({ stageName, isActive: true });
    if (!stage) {
      return res.status(404).json({
        success: false,
        message: 'Stage not found'
      });
    }

    // Get users in this stage
    const usersInStage = await User.find({ currentStage: stageName })
      .select('fullName email stageLevel stageMembersCount totalEarnings registrationDate')
      .sort({ totalEarnings: -1 });

    // Get top earners in this stage
    const topEarners = usersInStage.slice(0, 10);

    // Get progression statistics
    const progressionStats = await User.aggregate([
      { $match: { currentStage: stageName } },
      {
        $group: {
          _id: '$stageLevel',
          count: { $sum: 1 },
          averageMembers: { $avg: '$stageMembersCount' },
          totalEarnings: { $sum: '$totalEarnings' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Calculate completion rates for each level
    const completionRates = progressionStats.map(level => {
      const requiredMembers = stage.levels.find(l => l.levelNumber === level._id)?.membersRequired || 0;
      const completionRate = requiredMembers > 0 ? (level.averageMembers / requiredMembers) * 100 : 0;
      
      return {
        ...level,
        requiredMembers,
        completionRate: Math.round(completionRate * 100) / 100
      };
    });

    res.status(200).json({
      success: true,
      data: {
        stage: stage.toObject(),
        totalUsers: usersInStage.length,
        topEarners,
        progressionStats: completionRates,
        recentJoiners: usersInStage
          .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate))
          .slice(0, 5)
      }
    });

  } catch (error) {
    console.error('Get stage stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stage statistics'
    });
  }
});

// @desc    Create new stage (Admin only)
// @route   POST /api/stages
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), [
  body('stageName')
    .notEmpty()
    .withMessage('Stage name is required')
    .isIn(['feeder', 'stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'stage6'])
    .withMessage('Invalid stage name'),
  body('displayName')
    .notEmpty()
    .withMessage('Display name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Display name must be between 2 and 100 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('levels')
    .isArray({ min: 1, max: 3 })
    .withMessage('Levels must be an array with 1-3 items'),
  body('levels.*.levelNumber')
    .isInt({ min: 1, max: 3 })
    .withMessage('Level number must be between 1 and 3'),
  body('levels.*.membersRequired')
    .isInt({ min: 0 })
    .withMessage('Members required must be a non-negative integer'),
  body('levels.*.earnings')
    .isInt({ min: 0 })
    .withMessage('Earnings must be a non-negative integer'),
  body('totalMembers')
    .isInt({ min: 0 })
    .withMessage('Total members must be a non-negative integer'),
  body('totalEarnings')
    .isInt({ min: 0 })
    .withMessage('Total earnings must be a non-negative integer'),
  body('monthlyEarnings')
    .isInt({ min: 0 })
    .withMessage('Monthly earnings must be a non-negative integer'),
  body('order')
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
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

    const stageData = req.body;

    // Check if stage already exists
    const existingStage = await Stage.findOne({ stageName: stageData.stageName });
    if (existingStage) {
      return res.status(400).json({
        success: false,
        message: 'Stage already exists'
      });
    }

    const stage = new Stage(stageData);
    await stage.save();

    res.status(201).json({
      success: true,
      message: 'Stage created successfully',
      data: stage
    });

  } catch (error) {
    console.error('Create stage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create stage'
    });
  }
});

// @desc    Update stage (Admin only)
// @route   PUT /api/stages/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), [
  body('displayName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Display name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('levels')
    .optional()
    .isArray({ min: 1, max: 3 })
    .withMessage('Levels must be an array with 1-3 items'),
  body('totalMembers')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total members must be a non-negative integer'),
  body('totalEarnings')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total earnings must be a non-negative integer'),
  body('monthlyEarnings')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Monthly earnings must be a non-negative integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
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

    const stage = await Stage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!stage) {
      return res.status(404).json({
        success: false,
        message: 'Stage not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Stage updated successfully',
      data: stage
    });

  } catch (error) {
    console.error('Update stage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stage'
    });
  }
});

// @desc    Delete stage (Admin only)
// @route   DELETE /api/stages/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const stage = await Stage.findById(req.params.id);

    if (!stage) {
      return res.status(404).json({
        success: false,
        message: 'Stage not found'
      });
    }

    // Check if any users are currently in this stage
    const usersInStage = await User.countDocuments({ currentStage: stage.stageName });
    
    if (usersInStage > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete stage. ${usersInStage} users are currently in this stage.`
      });
    }

    await Stage.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Stage deleted successfully'
    });

  } catch (error) {
    console.error('Delete stage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete stage'
    });
  }
});

// @desc    Get stage leaderboard
// @route   GET /api/stages/:stageName/leaderboard
// @access  Public
router.get('/:stageName/leaderboard', async (req, res) => {
  try {
    const { stageName } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    // Verify stage exists
    const stage = await Stage.findOne({ stageName, isActive: true });
    if (!stage) {
      return res.status(404).json({
        success: false,
        message: 'Stage not found'
      });
    }

    // Get top performers in this stage
    const leaderboard = await User.find({ 
      currentStage: stageName,
      isActive: true 
    })
    .select('fullName totalEarnings stageMembersCount stageLevel registrationDate')
    .sort({ totalEarnings: -1, stageMembersCount: -1 })
    .limit(limit);

    // Add rank to each user
    const leaderboardWithRank = leaderboard.map((user, index) => ({
      rank: index + 1,
      fullName: user.fullName,
      totalEarnings: user.totalEarnings,
      stageMembersCount: user.stageMembersCount,
      stageLevel: user.stageLevel,
      registrationDate: user.registrationDate
    }));

    res.status(200).json({
      success: true,
      data: {
        stage: stage.displayName,
        leaderboard: leaderboardWithRank,
        totalParticipants: leaderboard.length
      }
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stage leaderboard'
    });
  }
});

// @desc    Get stage requirements for user
// @route   GET /api/stages/requirements/:stageName
// @access  Private
router.get('/requirements/:stageName', protect, async (req, res) => {
  try {
    const { stageName } = req.params;
    
    const stageConfig = getStageConfig(stageName);
    if (!stageConfig) {
      return res.status(404).json({
        success: false,
        message: 'Stage configuration not found'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate user's progress towards this stage
    const userProgress = {
      currentStage: user.currentStage,
      currentLevel: user.stageLevel,
      currentMembers: user.stageMembersCount,
      canAccess: false,
      requirements: stageConfig.levels,
      nextRequirement: null
    };

    // Determine if user can access this stage
    const stageOrder = ['feeder', 'stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'stage6'];
    const userStageIndex = stageOrder.indexOf(user.currentStage);
    const targetStageIndex = stageOrder.indexOf(stageName);

    if (targetStageIndex <= userStageIndex) {
      userProgress.canAccess = true;
    } else if (targetStageIndex === userStageIndex + 1) {
      // User is in the previous stage, check if they can advance
      const currentStageConfig = getStageConfig(user.currentStage);
      if (currentStageConfig && user.stageLevel === currentStageConfig.levels.length) {
        // User is at the last level of current stage
        const requiredMembers = currentStageConfig.levels[user.stageLevel - 1].members;
        if (user.stageMembersCount >= requiredMembers) {
          userProgress.canAccess = true;
        } else {
          userProgress.nextRequirement = {
            description: 'Complete current stage to unlock',
            membersNeeded: requiredMembers - user.stageMembersCount,
            currentMembers: user.stageMembersCount,
            requiredMembers
          };
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        stage: stageConfig,
        userProgress
      }
    });

  } catch (error) {
    console.error('Get stage requirements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stage requirements'
    });
  }
});

module.exports = router;