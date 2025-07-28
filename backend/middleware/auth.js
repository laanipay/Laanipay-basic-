const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user and attach to request
      req.user = await User.findById(decoded.id).select('+role');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'No user found with this token'
        });
      }

      // Check if user is active
      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      // Check if user is locked
      if (req.user.isLocked) {
        return res.status(401).json({
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts'
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Optional auth - doesn't require token but sets user if valid token provided
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('+role');
      } catch (err) {
        // Invalid token, but continue without user
        req.user = null;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Verify withdrawal PIN middleware
exports.verifyPin = async (req, res, next) => {
  try {
    const { withdrawalPin } = req.body;

    if (!withdrawalPin) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal PIN is required'
      });
    }

    // Get user with PIN
    const user = await User.findById(req.user.id).select('+withdrawalPin');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify PIN
    const isPinCorrect = await user.comparePin(withdrawalPin);
    
    if (!isPinCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Invalid withdrawal PIN'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in PIN verification'
    });
  }
};

// Rate limiting for sensitive operations
exports.sensitiveOpRateLimit = (req, res, next) => {
  // Additional rate limiting for sensitive operations like withdrawals
  // This can be implemented with Redis for production
  next();
};