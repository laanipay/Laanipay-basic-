const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password -withdrawalPin');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    if (user.isBlocked) {
      return res.status(401).json({
        success: false,
        message: 'Account is blocked',
      });
    }

    if (user.isLocked) {
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};

// Middleware to check if user is coordinator or admin
const requireCoordinator = (req, res, next) => {
  if (!['coordinator', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Coordinator or Admin access required',
    });
  }
  next();
};

// Middleware to check if user has paid registration fee
const requirePaidRegistration = (req, res, next) => {
  if (!req.user.registrationFee.paid) {
    return res.status(403).json({
      success: false,
      message: 'Registration fee payment required',
    });
  }
  next();
};

// Middleware to check if user email is verified
const requireEmailVerification = (req, res, next) => {
  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
    });
  }
  next();
};

// Middleware to check monthly verification status
const requireMonthlyVerification = (req, res, next) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Check if user has verified this month
  const lastVerified = req.user.monthlyVerification.lastVerified;
  
  if (!lastVerified || 
      lastVerified.getMonth() !== currentMonth || 
      lastVerified.getFullYear() !== currentYear) {
    return res.status(403).json({
      success: false,
      message: 'Monthly verification required',
      requireVerification: true,
    });
  }
  
  next();
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId).select('-password -withdrawalPin');
      
      if (user && user.isActive && !user.isBlocked && !user.isLocked) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignore auth errors for optional auth
  }
  
  next();
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireCoordinator,
  requirePaidRegistration,
  requireEmailVerification,
  requireMonthlyVerification,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
};