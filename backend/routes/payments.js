const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Verification = require('../models/Verification');
const { protect, optionalAuth } = require('../middleware/auth');
const { processMonthlyEarnings } = require('../utils/mlm');

const router = express.Router();

// @desc    Initialize payment for registration
// @route   POST /api/payments/initialize-registration
// @access  Public
router.post('/initialize-registration', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('gateway').isIn(['paystack', 'flutterwave']).withMessage('Invalid payment gateway')
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

    const { email, gateway } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already has a completed registration payment
    const existingPayment = await Transaction.findOne({
      userId: user._id,
      type: 'registration_payment',
      status: 'completed'
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Registration payment already completed'
      });
    }

    const amount = parseInt(process.env.REGISTRATION_FEE) || 3500;
    const reference = `LPN_REG_${user._id}_${Date.now()}`;

    // Create or update pending transaction
    await Transaction.findOneAndUpdate(
      {
        userId: user._id,
        type: 'registration_payment',
        status: 'pending'
      },
      {
        userId: user._id,
        type: 'registration_payment',
        amount,
        status: 'pending',
        description: 'Registration fee payment',
        paymentGateway: gateway,
        paymentReference: reference,
        metadata: {
          calculationFee: parseInt(process.env.CALCULATION_FEE) || 1000
        }
      },
      { upsert: true, new: true }
    );

    // Generate payment initialization data based on gateway
    let paymentData = {};

    if (gateway === 'paystack') {
      paymentData = {
        reference,
        amount: amount * 100, // Paystack uses kobo
        email: user.email,
        currency: 'NGN',
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
        metadata: {
          user_id: user._id,
          payment_type: 'registration',
          custom_fields: [
            {
              display_name: 'User Name',
              variable_name: 'user_name',
              value: user.fullName
            }
          ]
        }
      };
    } else if (gateway === 'flutterwave') {
      paymentData = {
        tx_ref: reference,
        amount,
        currency: 'NGN',
        redirect_url: `${process.env.FRONTEND_URL}/payment/callback`,
        customer: {
          email: user.email,
          name: user.fullName,
          phonenumber: user.phoneNumber
        },
        customizations: {
          title: 'LPN PRO MLM Registration',
          description: 'Registration fee payment',
          logo: `${process.env.FRONTEND_URL}/logo.png`
        },
        meta: {
          user_id: user._id,
          payment_type: 'registration'
        }
      };
    }

    res.status(200).json({
      success: true,
      message: 'Payment initialized successfully',
      data: {
        reference,
        amount,
        gateway,
        paymentData,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email
        }
      }
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment'
    });
  }
});

// @desc    Initialize payment for monthly verification
// @route   POST /api/payments/initialize-verification
// @access  Private
router.post('/initialize-verification', protect, [
  body('gateway').isIn(['paystack', 'flutterwave']).withMessage('Invalid payment gateway'),
  body('month').optional().isInt({ min: 1, max: 12 }).withMessage('Invalid month'),
  body('year').optional().isInt({ min: 2024 }).withMessage('Invalid year')
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

    const { gateway, month, year } = req.body;
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get or create verification record
    let verification = await Verification.findOne({
      userId: user._id,
      month: targetMonth,
      year: targetYear
    });

    if (!verification) {
      verification = await Verification.createMonthlyVerification(
        user._id,
        targetMonth,
        targetYear
      );
    }

    // Check if already verified
    if (verification.status === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Monthly verification already completed'
      });
    }

    const amount = verification.amount;
    const reference = `LPN_VER_${user._id}_${targetMonth}_${targetYear}_${Date.now()}`;

    // Update verification with payment reference
    verification.paymentReference = reference;
    verification.paymentGateway = gateway;
    await verification.save();

    // Generate payment initialization data
    let paymentData = {};

    if (gateway === 'paystack') {
      paymentData = {
        reference,
        amount: amount * 100, // Paystack uses kobo
        email: user.email,
        currency: 'NGN',
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
        metadata: {
          user_id: user._id,
          payment_type: 'verification',
          month: targetMonth,
          year: targetYear,
          custom_fields: [
            {
              display_name: 'Verification Month',
              variable_name: 'verification_month',
              value: `${targetMonth}/${targetYear}`
            }
          ]
        }
      };
    } else if (gateway === 'flutterwave') {
      paymentData = {
        tx_ref: reference,
        amount,
        currency: 'NGN',
        redirect_url: `${process.env.FRONTEND_URL}/payment/callback`,
        customer: {
          email: user.email,
          name: user.fullName,
          phonenumber: user.phoneNumber
        },
        customizations: {
          title: 'LPN PRO MLM Monthly Verification',
          description: `Monthly verification for ${targetMonth}/${targetYear}`,
          logo: `${process.env.FRONTEND_URL}/logo.png`
        },
        meta: {
          user_id: user._id,
          payment_type: 'verification',
          month: targetMonth,
          year: targetYear
        }
      };
    }

    res.status(200).json({
      success: true,
      message: 'Verification payment initialized successfully',
      data: {
        reference,
        amount,
        gateway,
        paymentData,
        verification: {
          id: verification._id,
          month: targetMonth,
          year: targetYear,
          status: verification.status
        }
      }
    });

  } catch (error) {
    console.error('Verification payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize verification payment'
    });
  }
});

// @desc    Verify payment (webhook handler)
// @route   POST /api/payments/verify/:gateway
// @access  Public
router.post('/verify/:gateway', async (req, res) => {
  try {
    const { gateway } = req.params;
    
    if (!['paystack', 'flutterwave'].includes(gateway)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment gateway'
      });
    }

    let paymentData = {};
    let isValidSignature = false;

    if (gateway === 'paystack') {
      // Verify Paystack signature
      const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      isValidSignature = hash === req.headers['x-paystack-signature'];
      paymentData = req.body.data;
    } else if (gateway === 'flutterwave') {
      // Verify Flutterwave signature
      const secretHash = process.env.FLUTTERWAVE_SECRET_HASH || 'your-secret-hash';
      const signature = req.headers['verif-hash'];
      
      isValidSignature = signature === secretHash;
      paymentData = req.body.data;
    }

    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Extract payment information
    const reference = paymentData.reference || paymentData.tx_ref;
    const amount = gateway === 'paystack' ? paymentData.amount / 100 : paymentData.amount;
    const status = paymentData.status;

    if (status !== 'success') {
      console.log(`Payment failed: ${reference} - ${status}`);
      return res.status(200).json({ message: 'Payment not successful' });
    }

    // Find transaction by reference
    let transaction = await Transaction.findOne({ paymentReference: reference });
    let verification = null;

    if (!transaction) {
      // Check if it's a verification payment
      verification = await Verification.findOne({ paymentReference: reference });
      
      if (!verification) {
        console.log(`Transaction not found for reference: ${reference}`);
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }
    }

    // Start database transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (transaction && transaction.type === 'registration_payment') {
        // Handle registration payment
        await handleRegistrationPayment(transaction, amount, paymentData, session);
      } else if (verification) {
        // Handle verification payment
        await handleVerificationPayment(verification, amount, paymentData, session);
      }

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully'
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});

// Helper function to handle registration payment
async function handleRegistrationPayment(transaction, amount, paymentData, session) {
  // Update transaction status
  transaction.status = 'completed';
  transaction.gatewayResponse = paymentData;
  transaction.processedAt = new Date();
  await transaction.save({ session });

  // Update user account status
  const user = await User.findById(transaction.userId).session(session);
  if (user) {
    // User is now fully registered and can start earning
    user.registrationPaymentId = transaction.paymentReference;
    await user.save({ session });
  }

  console.log(`Registration payment completed for user: ${user._id}`);
}

// Helper function to handle verification payment
async function handleVerificationPayment(verification, amount, paymentData, session) {
  // Update verification status
  verification.status = 'paid';
  verification.paidAt = new Date();
  await verification.save({ session });

  // Create transaction record
  const transaction = new Transaction({
    userId: verification.userId,
    type: 'monthly_verification',
    amount: verification.amount,
    status: 'completed',
    description: `Monthly verification payment for ${verification.month}/${verification.year}`,
    paymentGateway: verification.paymentGateway,
    paymentReference: verification.paymentReference,
    gatewayResponse: paymentData,
    processedAt: new Date()
  });
  await transaction.save({ session });

  // Get user for monthly earnings processing
  const user = await User.findById(verification.userId).session(session);
  if (user) {
    // Update user verification status
    user.verificationStatus = 'verified';
    user.lastVerificationDate = new Date();
    await user.save({ session });

    // Process monthly earnings
    await processMonthlyEarnings(
      user._id,
      user.currentStage,
      user.stageLevel,
      session
    );
  }

  console.log(`Monthly verification completed for user: ${user._id} - ${verification.month}/${verification.year}`);
}

// @desc    Get payment status
// @route   GET /api/payments/status/:reference
// @access  Public
router.get('/status/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    // Check transaction
    const transaction = await Transaction.findOne({ paymentReference: reference })
      .populate('userId', 'fullName email');

    if (transaction) {
      return res.status(200).json({
        success: true,
        data: {
          type: 'transaction',
          reference,
          status: transaction.status,
          amount: transaction.amount,
          description: transaction.description,
          user: transaction.userId,
          createdAt: transaction.createdAt
        }
      });
    }

    // Check verification
    const verification = await Verification.findOne({ paymentReference: reference })
      .populate('userId', 'fullName email');

    if (verification) {
      return res.status(200).json({
        success: true,
        data: {
          type: 'verification',
          reference,
          status: verification.status,
          amount: verification.amount,
          month: verification.month,
          year: verification.year,
          user: verification.userId,
          createdAt: verification.createdAt
        }
      });
    }

    res.status(404).json({
      success: false,
      message: 'Payment record not found'
    });

  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status'
    });
  }
});

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get user's payment transactions
    const payments = await Transaction.find({
      userId: req.user.id,
      type: { $in: ['registration_payment', 'monthly_verification'] },
      status: 'completed'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('type amount status description paymentReference createdAt');

    const totalPayments = await Transaction.countDocuments({
      userId: req.user.id,
      type: { $in: ['registration_payment', 'monthly_verification'] },
      status: 'completed'
    });

    // Get verification history
    const verifications = await Verification.find({ userId: req.user.id })
      .sort({ year: -1, month: -1 })
      .limit(12)
      .select('month year status amount paidAt verifiedAt');

    res.status(200).json({
      success: true,
      data: {
        payments,
        verifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPayments / limit),
          totalItems: totalPayments,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history'
    });
  }
});

// @desc    Manual payment verification (Admin)
// @route   POST /api/payments/manual-verify
// @access  Private (Admin only)
router.post('/manual-verify', protect, [
  body('reference').notEmpty().withMessage('Payment reference is required'),
  body('type').isIn(['registration', 'verification']).withMessage('Invalid payment type')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { reference, type, amount } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (type === 'registration') {
        const transaction = await Transaction.findOne({ paymentReference: reference }).session(session);
        if (!transaction) {
          throw new Error('Transaction not found');
        }

        await handleRegistrationPayment(transaction, amount || transaction.amount, { manual: true }, session);
      } else if (type === 'verification') {
        const verification = await Verification.findOne({ paymentReference: reference }).session(session);
        if (!verification) {
          throw new Error('Verification not found');
        }

        await handleVerificationPayment(verification, amount || verification.amount, { manual: true }, session);
      }

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: 'Payment verified manually'
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Manual verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Manual verification failed'
    });
  }
});

module.exports = router;