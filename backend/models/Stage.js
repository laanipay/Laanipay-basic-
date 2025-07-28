const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['feeder', 'marketer', 'manager', 'senior_manager', 'director', 'ruby_director', 'diamond_director'],
    required: true,
    unique: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  
  // Requirements for this stage
  requirements: {
    totalMembers: {
      type: Number,
      required: true,
    },
    levels: [
      {
        level: {
          type: Number,
          required: true,
        },
        members: {
          type: Number,
          required: true,
        },
        earnings: {
          type: Number,
          required: true,
        },
      }
    ],
    totalEarnings: {
      type: Number,
      required: true,
    },
  },

  // Monthly verification earnings for this stage
  monthlyVerificationEarnings: {
    type: Number,
    required: true,
  },

  // Binary tree requirements
  binaryRequirements: {
    leftLeg: {
      type: Number,
      required: true,
    },
    rightLeg: {
      type: Number,
      required: true,
    },
  },

  // Next stage information
  nextStage: {
    type: String,
    enum: ['feeder', 'marketer', 'manager', 'senior_manager', 'director', 'ruby_director', 'diamond_director', null],
    default: null,
  },

  // Recycling information
  recyclesTo: {
    type: String,
    enum: ['feeder', 'marketer', 'manager', 'senior_manager', 'director', 'ruby_director', 'diamond_director', null],
    default: null,
  },

  // Stage configuration
  isActive: {
    type: Boolean,
    default: true,
  },
  isRecycling: {
    type: Boolean,
    default: false,
  },

  // Badge and visual information
  badge: {
    color: {
      type: String,
      default: '#3B82F6',
    },
    icon: {
      type: String,
      default: 'trophy',
    },
  },

  // Statistics
  stats: {
    totalUsers: {
      type: Number,
      default: 0,
    },
    activeUsers: {
      type: Number,
      default: 0,
    },
    totalEarningsDistributed: {
      type: Number,
      default: 0,
    },
    avgTimeToComplete: {
      type: Number, // in days
      default: 0,
    },
  },

  // Configuration for admin
  adminConfig: {
    autoUpgrade: {
      type: Boolean,
      default: true,
    },
    manualApprovalRequired: {
      type: Boolean,
      default: false,
    },
    maxUsersPerDay: {
      type: Number,
      default: null,
    },
  },
}, {
  timestamps: true,
});

// Indexes
stageSchema.index({ name: 1 });
stageSchema.index({ order: 1 });
stageSchema.index({ isActive: 1 });

// Virtual for completion percentage calculation
stageSchema.virtual('completionRate').get(function() {
  if (this.stats.totalUsers === 0) return 0;
  return Math.round((this.stats.activeUsers / this.stats.totalUsers) * 100);
});

// Method to check if user meets requirements
stageSchema.methods.checkUserRequirements = function(user) {
  const meetsMembers = user.totalDownline >= this.requirements.totalMembers;
  const meetsBinary = user.leftCount >= this.binaryRequirements.leftLeg && 
                      user.rightCount >= this.binaryRequirements.rightLeg;
  
  return {
    meetsRequirements: meetsMembers && meetsBinary,
    meetsMembers,
    meetsBinary,
    missingLeft: Math.max(0, this.binaryRequirements.leftLeg - user.leftCount),
    missingRight: Math.max(0, this.binaryRequirements.rightLeg - user.rightCount),
    missingMembers: Math.max(0, this.requirements.totalMembers - user.totalDownline),
  };
};

// Method to calculate earnings for level completion
stageSchema.methods.calculateLevelEarnings = function(level) {
  const levelData = this.requirements.levels.find(l => l.level === level);
  return levelData ? levelData.earnings : 0;
};

// Static method to get stage by name
stageSchema.statics.getByName = function(stageName) {
  return this.findOne({ name: stageName, isActive: true });
};

// Static method to get next stage
stageSchema.statics.getNextStage = function(currentStageName) {
  return this.findOne({ name: currentStageName, isActive: true })
    .then(stage => {
      if (!stage || !stage.nextStage) return null;
      return this.findOne({ name: stage.nextStage, isActive: true });
    });
};

// Static method to initialize default stages
stageSchema.statics.initializeDefaultStages = async function() {
  const defaultStages = [
    {
      name: 'feeder',
      displayName: 'Feeder Stage',
      order: 0,
      description: 'Entry qualification for Stage 1',
      requirements: {
        totalMembers: 2,
        levels: [
          { level: 1, members: 2, earnings: 0 }
        ],
        totalEarnings: 0,
      },
      monthlyVerificationEarnings: 0,
      binaryRequirements: { leftLeg: 1, rightLeg: 1 },
      nextStage: 'marketer',
      badge: { color: '#6B7280', icon: 'users' },
    },
    {
      name: 'marketer',
      displayName: 'MARKETER',
      order: 1,
      description: 'Stage 1 - Build your foundation',
      requirements: {
        totalMembers: 28,
        levels: [
          { level: 1, members: 4, earnings: 200 },
          { level: 2, members: 8, earnings: 400 },
          { level: 3, members: 16, earnings: 800 }
        ],
        totalEarnings: 1400,
      },
      monthlyVerificationEarnings: 700,
      binaryRequirements: { leftLeg: 14, rightLeg: 14 },
      nextStage: 'manager',
      badge: { color: '#059669', icon: 'trending-up' },
    },
    {
      name: 'manager',
      displayName: 'MANAGER',
      order: 2,
      description: 'Stage 2 - Expand your network',
      requirements: {
        totalMembers: 224,
        levels: [
          { level: 1, members: 32, earnings: 1600 },
          { level: 2, members: 64, earnings: 3200 },
          { level: 3, members: 128, earnings: 6400 }
        ],
        totalEarnings: 11200,
      },
      monthlyVerificationEarnings: 5600,
      binaryRequirements: { leftLeg: 112, rightLeg: 112 },
      nextStage: 'senior_manager',
      badge: { color: '#DC2626', icon: 'briefcase' },
    },
    {
      name: 'senior_manager',
      displayName: 'SENIOR MANAGER',
      order: 3,
      description: 'Stage 3 - Lead your organization',
      requirements: {
        totalMembers: 1792,
        levels: [
          { level: 1, members: 256, earnings: 12800 },
          { level: 2, members: 512, earnings: 25600 },
          { level: 3, members: 1024, earnings: 51200 }
        ],
        totalEarnings: 89600,
      },
      monthlyVerificationEarnings: 44800,
      binaryRequirements: { leftLeg: 896, rightLeg: 896 },
      nextStage: 'director',
      badge: { color: '#7C3AED', icon: 'star' },
    },
    {
      name: 'director',
      displayName: 'DIRECTOR',
      order: 4,
      description: 'Stage 4 - Executive leadership',
      requirements: {
        totalMembers: 14336,
        levels: [
          { level: 1, members: 2048, earnings: 102400 },
          { level: 2, members: 4096, earnings: 204800 },
          { level: 3, members: 8192, earnings: 409600 }
        ],
        totalEarnings: 716800,
      },
      monthlyVerificationEarnings: 358800,
      binaryRequirements: { leftLeg: 7168, rightLeg: 7168 },
      nextStage: 'ruby_director',
      badge: { color: '#EA580C', icon: 'crown' },
    },
    {
      name: 'ruby_director',
      displayName: 'RUBY DIRECTOR',
      order: 5,
      description: 'Stage 5 - Ruby level achievement',
      requirements: {
        totalMembers: 114688,
        levels: [
          { level: 1, members: 16384, earnings: 819200 },
          { level: 2, members: 32768, earnings: 1638400 },
          { level: 3, members: 65536, earnings: 3276800 }
        ],
        totalEarnings: 5734400,
      },
      monthlyVerificationEarnings: 2867200,
      binaryRequirements: { leftLeg: 57344, rightLeg: 57344 },
      nextStage: 'diamond_director',
      badge: { color: '#BE185D', icon: 'gem' },
    },
    {
      name: 'diamond_director',
      displayName: 'DIAMOND DIRECTOR',
      order: 6,
      description: 'Stage 6 - Diamond level mastery',
      requirements: {
        totalMembers: 917504,
        levels: [
          { level: 1, members: 131072, earnings: 6553600 },
          { level: 2, members: 262144, earnings: 13107200 },
          { level: 3, members: 524288, earnings: 26214400 }
        ],
        totalEarnings: 45875200,
      },
      monthlyVerificationEarnings: 22937600,
      binaryRequirements: { leftLeg: 458752, rightLeg: 458752 },
      nextStage: null,
      recyclesTo: 'feeder',
      isRecycling: true,
      badge: { color: '#1E40AF', icon: 'diamond' },
    },
  ];

  for (const stageData of defaultStages) {
    const existingStage = await this.findOne({ name: stageData.name });
    if (!existingStage) {
      await this.create(stageData);
      console.log(`✅ Created stage: ${stageData.displayName}`);
    }
  }
};

module.exports = mongoose.model('Stage', stageSchema);