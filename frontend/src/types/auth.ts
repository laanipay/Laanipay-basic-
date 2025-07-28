export interface User {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: 'member' | 'coordinator' | 'admin';
  currentStage: 'feeder' | 'marketer' | 'manager' | 'senior_manager' | 'director' | 'ruby_director' | 'diamond_director';
  stageLevel: number;
  isActive: boolean;
  isBlocked: boolean;
  emailVerified: boolean;
  registrationFeePaid: boolean;
  
  // MLM Structure
  sponsorId?: string;
  parentId?: string;
  position?: 'left' | 'right' | 'root';
  level: number;
  
  // Earnings and Wallet
  totalEarnings: number;
  availableBalance: number;
  totalWithdrawn: number;
  pendingEarnings: number;
  
  // Binary Tree Counts
  leftCount: number;
  rightCount: number;
  totalDownline: number;
  
  // Verification Status
  monthlyVerification: {
    lastVerified?: string;
    isVerifiedThisMonth: boolean;
    verificationCount: number;
  };
  
  // Referral Information
  referralCode: string;
  referralLink: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  
  // Recycling
  recycleCount: number;
  
  // Coordinator specific
  coordinatorLevel?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  withdrawalPin: string;
  referralCode?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: AuthTokens;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: AuthTokens;
    paymentRequired: {
      amount: number;
      reference: string;
    };
  };
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    tokens: AuthTokens;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// Stage related types
export interface Stage {
  name: string;
  displayName: string;
  order: number;
  description: string;
  requirements: {
    totalMembers: number;
    levels: Array<{
      level: number;
      members: number;
      earnings: number;
    }>;
    totalEarnings: number;
  };
  monthlyVerificationEarnings: number;
  binaryRequirements: {
    leftLeg: number;
    rightLeg: number;
  };
  nextStage?: string;
  recyclesTo?: string;
  isActive: boolean;
  isRecycling: boolean;
  badge: {
    color: string;
    icon: string;
  };
}

// Transaction related types
export interface Transaction {
  id: string;
  userId: string;
  type: 'registration_fee' | 'stage_earnings' | 'monthly_verification_earnings' | 'withdrawal' | 'verification_payment' | 'referral_bonus' | 'spillover_bonus' | 'admin_adjustment';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference: string;
  paymentGateway?: 'paystack' | 'flutterwave' | 'manual' | 'internal';
  gatewayReference?: string;
  createdAt: string;
  completedAt?: string;
  
  // Stage related
  stageInfo?: {
    stageName?: string;
    stageLevel?: number;
    fromStage?: string;
    toStage?: string;
  };
  
  // Verification related
  verificationType?: 'monthly' | 'annual' | 'special';
  verificationMonth?: string;
  verificationYear?: number;
  
  // Withdrawal specific
  withdrawalDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    processingFee?: number;
    netAmount?: number;
    approvedBy?: string;
    approvedAt?: string;
    rejectedReason?: string;
  };
  
  // Binary tree related
  binaryInfo?: {
    leftCount?: number;
    rightCount?: number;
    triggerMember?: string;
  };
  
  // Admin details
  processedBy?: string;
  adminNotes?: string;
  
  // Balance tracking
  balanceBefore?: number;
  balanceAfter?: number;
}

// Binary Tree types
export interface BinaryTreeNode {
  id: string;
  userId: string;
  name: string;
  stage: string;
  leftCount: number;
  rightCount: number;
  totalDownline: number;
  children: {
    left: BinaryTreeNode | null;
    right: BinaryTreeNode | null;
  };
}

// Withdrawal types
export interface WithdrawalRequest {
  amount: number;
  withdrawalPin: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

// Verification types
export interface VerificationRequest {
  amount: number;
  verificationType: 'monthly';
}

// Dashboard stats types
export interface DashboardStats {
  totalEarnings: number;
  availableBalance: number;
  pendingEarnings: number;
  totalWithdrawn: number;
  totalDownline: number;
  leftCount: number;
  rightCount: number;
  currentStage: string;
  nextStageProgress: number;
  recentTransactions: Transaction[];
  monthlyVerificationStatus: boolean;
  referralStats: {
    totalReferrals: number;
    activeReferrals: number;
    thisMonthReferrals: number;
  };
}