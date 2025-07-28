const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Stage = require('../models/Stage');

// Stage configuration based on specification
const STAGE_CONFIG = {
  feeder: {
    name: 'Feeder Stage',
    levels: [
      { level: 1, members: 2, earnings: 0 }
    ],
    totalMembers: 2,
    totalEarnings: 0,
    monthlyEarnings: 0,
    nextStage: 'stage1'
  },
  stage1: {
    name: 'MARKETER',
    levels: [
      { level: 1, members: 4, earnings: 200 },
      { level: 2, members: 8, earnings: 400 },
      { level: 3, members: 16, earnings: 800 }
    ],
    totalMembers: 28,
    totalEarnings: 1400,
    monthlyEarnings: 700,
    nextStage: 'stage2'
  },
  stage2: {
    name: 'MANAGER',
    levels: [
      { level: 1, members: 32, earnings: 1600 },
      { level: 2, members: 64, earnings: 3200 },
      { level: 3, members: 128, earnings: 6400 }
    ],
    totalMembers: 224,
    totalEarnings: 11200,
    monthlyEarnings: 5600,
    nextStage: 'stage3'
  },
  stage3: {
    name: 'SENIOR MANAGER',
    levels: [
      { level: 1, members: 256, earnings: 12800 },
      { level: 2, members: 512, earnings: 25600 },
      { level: 3, members: 1024, earnings: 51200 }
    ],
    totalMembers: 1792,
    totalEarnings: 89600,
    monthlyEarnings: 44800,
    nextStage: 'stage4'
  },
  stage4: {
    name: 'DIRECTOR',
    levels: [
      { level: 1, members: 2048, earnings: 102400 },
      { level: 2, members: 4096, earnings: 204800 },
      { level: 3, members: 8192, earnings: 409600 }
    ],
    totalMembers: 14336,
    totalEarnings: 716800,
    monthlyEarnings: 358800,
    nextStage: 'stage5'
  },
  stage5: {
    name: 'RUBY DIRECTOR',
    levels: [
      { level: 1, members: 16384, earnings: 819200 },
      { level: 2, members: 32768, earnings: 1638400 },
      { level: 3, members: 65536, earnings: 3276800 }
    ],
    totalMembers: 114688,
    totalEarnings: 5734400,
    monthlyEarnings: 2867200,
    nextStage: 'stage6'
  },
  stage6: {
    name: 'DIAMOND DIRECTOR',
    levels: [
      { level: 1, members: 131072, earnings: 6553600 },
      { level: 2, members: 262144, earnings: 13107200 },
      { level: 3, members: 524288, earnings: 26214400 }
    ],
    totalMembers: 917504,
    totalEarnings: 45875200,
    monthlyEarnings: 22937600,
    nextStage: 'recycle'
  }
};

// Get stage configuration
exports.getStageConfig = (stageName) => {
  return STAGE_CONFIG[stageName] || null;
};

// Calculate required members for current level
exports.getRequiredMembersForLevel = (stage, level) => {
  const config = STAGE_CONFIG[stage];
  if (!config) return 0;
  
  const levelConfig = config.levels.find(l => l.level === level);
  return levelConfig ? levelConfig.members : 0;
};

// Calculate earnings for completing a level
exports.getEarningsForLevel = (stage, level, isMonthly = false) => {
  const config = STAGE_CONFIG[stage];
  if (!config) return 0;
  
  const levelConfig = config.levels.find(l => l.level === level);
  if (!levelConfig) return 0;
  
  return isMonthly ? (config.monthlyEarnings / config.levels.length) : levelConfig.earnings;
};

// Check if user can advance to next level/stage
exports.canAdvanceLevel = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return { canAdvance: false, reason: 'User not found' };

    const requiredMembers = this.getRequiredMembersForLevel(user.currentStage, user.stageLevel);
    
    if (user.stageMembersCount >= requiredMembers) {
      const config = STAGE_CONFIG[user.currentStage];
      const isLastLevel = user.stageLevel >= config.levels.length;
      
      return {
        canAdvance: true,
        isStageComplete: isLastLevel,
        nextStage: isLastLevel ? config.nextStage : user.currentStage,
        nextLevel: isLastLevel ? 1 : user.stageLevel + 1
      };
    }

    return {
      canAdvance: false,
      reason: `Need ${requiredMembers - user.stageMembersCount} more members`,
      required: requiredMembers,
      current: user.stageMembersCount
    };
  } catch (error) {
    return { canAdvance: false, reason: 'Error checking advancement', error: error.message };
  }
};

// Advance user to next level/stage
exports.advanceUser = async (userId, session = null) => {
  try {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found');

    const advancement = await this.canAdvanceLevel(userId);
    if (!advancement.canAdvance) {
      throw new Error(advancement.reason);
    }

    // Calculate earnings for completed level
    const earnings = this.getEarningsForLevel(user.currentStage, user.stageLevel);
    
    // Update user stage/level
    if (advancement.isStageComplete && advancement.nextStage === 'recycle') {
      // Handle recycling for Stage 6 completion
      user.currentStage = 'feeder';
      user.stageLevel = 1;
      user.stageMembersCount = 0;
    } else if (advancement.isStageComplete) {
      // Move to next stage
      user.currentStage = advancement.nextStage;
      user.stageLevel = 1;
      user.stageMembersCount = 0;
    } else {
      // Move to next level in same stage
      user.stageLevel = advancement.nextLevel;
      user.stageMembersCount = 0;
    }

    // Update financial information
    user.walletBalance += earnings;
    user.totalEarnings += earnings;

    await user.save({ session });

    // Create transaction record
    if (earnings > 0) {
      const transaction = new Transaction({
        userId: user._id,
        type: 'stage_earning',
        amount: earnings,
        status: 'completed',
        description: `Stage ${user.currentStage} Level ${user.stageLevel} completion earning`,
        relatedStage: user.currentStage,
        stageLevel: user.stageLevel
      });
      await transaction.save({ session });
    }

    return {
      success: true,
      user,
      earnings,
      advancement
    };
  } catch (error) {
    throw new Error(`Error advancing user: ${error.message}`);
  }
};

// Find available position in binary tree
exports.findAvailablePosition = async (sponsorId = null) => {
  try {
    if (!sponsorId) {
      // Look for any user with available positions
      const userWithSpace = await User.findOne({
        $or: [
          { leftChild: null },
          { rightChild: null }
        ]
      }).sort({ createdAt: 1 });

      if (userWithSpace) {
        const position = !userWithSpace.leftChild ? 'left' : 'right';
        return { parentId: userWithSpace._id, position };
      }

      // No available positions, will be placed as root
      return { parentId: null, position: null };
    }

    // Start with the sponsor
    const queue = [sponsorId];
    const visited = new Set();

    while (queue.length > 0) {
      const currentId = queue.shift();
      
      if (visited.has(currentId.toString())) continue;
      visited.add(currentId.toString());

      const current = await User.findById(currentId);
      if (!current) continue;

      // Check if current user has available positions
      if (!current.leftChild) {
        return { parentId: currentId, position: 'left' };
      } else if (!current.rightChild) {
        return { parentId: currentId, position: 'right' };
      }

      // Add children to queue for breadth-first search
      if (current.leftChild) queue.push(current.leftChild);
      if (current.rightChild) queue.push(current.rightChild);
    }

    // No position found in sponsor's downline, find globally
    return await this.findAvailablePosition();
  } catch (error) {
    throw new Error(`Error finding position: ${error.message}`);
  }
};

// Place user in binary tree
exports.placeUserInTree = async (userId, sponsorId = null, session = null) => {
  try {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found');

    // Find position
    const placement = await this.findAvailablePosition(sponsorId);
    
    // Update user's tree position
    user.sponsorId = sponsorId;
    user.parentId = placement.parentId;
    user.position = placement.position;

    await user.save({ session });

    // Update parent's child reference
    if (placement.parentId) {
      const parent = await User.findById(placement.parentId).session(session);
      if (parent) {
        if (placement.position === 'left') {
          parent.leftChild = userId;
        } else {
          parent.rightChild = userId;
        }
        await parent.save({ session });
      }
    }

    // Update sponsor's referral count
    if (sponsorId) {
      await User.findByIdAndUpdate(
        sponsorId,
        {
          $inc: { totalReferrals: 1 },
          $push: { directReferrals: userId }
        },
        { session }
      );
    }

    return placement;
  } catch (error) {
    throw new Error(`Error placing user in tree: ${error.message}`);
  }
};

// Count downline members
exports.countDownlineMembers = async (userId, maxDepth = 10) => {
  try {
    let totalCount = 0;
    const queue = [{ id: userId, depth: 0 }];
    const visited = new Set();

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      
      if (depth >= maxDepth || visited.has(id.toString())) continue;
      visited.add(id.toString());

      const user = await User.findById(id);
      if (!user) continue;

      if (depth > 0) totalCount++; // Don't count the root user

      // Add children to queue
      if (user.leftChild && depth < maxDepth - 1) {
        queue.push({ id: user.leftChild, depth: depth + 1 });
      }
      if (user.rightChild && depth < maxDepth - 1) {
        queue.push({ id: user.rightChild, depth: depth + 1 });
      }
    }

    return totalCount;
  } catch (error) {
    throw new Error(`Error counting downline: ${error.message}`);
  }
};

// Update member counts for upline
exports.updateUplineCounts = async (userId, session = null) => {
  try {
    let currentUser = await User.findById(userId).session(session);
    
    while (currentUser && currentUser.parentId) {
      const parent = await User.findById(currentUser.parentId).session(session);
      if (!parent) break;

      // Increment parent's member count
      parent.stageMembersCount += 1;
      await parent.save({ session });

      // Check if parent can advance
      const canAdvance = await this.canAdvanceLevel(parent._id);
      if (canAdvance.canAdvance) {
        await this.advanceUser(parent._id, session);
      }

      currentUser = parent;
    }
  } catch (error) {
    throw new Error(`Error updating upline counts: ${error.message}`);
  }
};

// Get user's binary tree structure
exports.getUserTree = async (userId, depth = 3) => {
  try {
    const buildTree = async (id, currentDepth) => {
      if (currentDepth > depth || !id) return null;

      const user = await User.findById(id).select('fullName email currentStage stageLevel walletBalance totalEarnings leftChild rightChild position');
      if (!user) return null;

      return {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        currentStage: user.currentStage,
        stageLevel: user.stageLevel,
        walletBalance: user.walletBalance,
        totalEarnings: user.totalEarnings,
        position: user.position,
        leftChild: await buildTree(user.leftChild, currentDepth + 1),
        rightChild: await buildTree(user.rightChild, currentDepth + 1)
      };
    };

    return await buildTree(userId, 1);
  } catch (error) {
    throw new Error(`Error getting user tree: ${error.message}`);
  }
};

// Calculate spillover bonus
exports.calculateSpilloverBonus = (stage, level) => {
  // Spillover bonus is typically 10% of the level earnings
  const baseEarnings = this.getEarningsForLevel(stage, level);
  return Math.floor(baseEarnings * 0.1);
};

// Process monthly verification earnings
exports.processMonthlyEarnings = async (userId, stage, level, session = null) => {
  try {
    const monthlyEarnings = this.getEarningsForLevel(stage, level, true);
    
    if (monthlyEarnings > 0) {
      const user = await User.findById(userId).session(session);
      if (user) {
        user.walletBalance += monthlyEarnings;
        user.totalEarnings += monthlyEarnings;
        await user.save({ session });

        // Create transaction record
        const transaction = new Transaction({
          userId: user._id,
          type: 'monthly_earning',
          amount: monthlyEarnings,
          status: 'completed',
          description: `Monthly verification earning for ${stage} level ${level}`,
          relatedStage: stage,
          stageLevel: level
        });
        await transaction.save({ session });
      }
    }

    return monthlyEarnings;
  } catch (error) {
    throw new Error(`Error processing monthly earnings: ${error.message}`);
  }
};

// Initialize stage configurations in database
exports.initializeStages = async () => {
  try {
    for (const [stageName, config] of Object.entries(STAGE_CONFIG)) {
      const existingStage = await Stage.findOne({ stageName });
      
      if (!existingStage) {
        const stage = new Stage({
          stageName,
          displayName: config.name,
          description: `${config.name} stage with ${config.totalMembers} total members`,
          levels: config.levels,
          totalMembers: config.totalMembers,
          totalEarnings: config.totalEarnings,
          monthlyEarnings: config.monthlyEarnings,
          order: Object.keys(STAGE_CONFIG).indexOf(stageName)
        });
        
        await stage.save();
        console.log(`Initialized stage: ${stageName}`);
      }
    }
  } catch (error) {
    console.error('Error initializing stages:', error);
  }
};