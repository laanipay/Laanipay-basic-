const nodemailer = require('nodemailer');

// Create reusable transporter
let transporter;

// Initialize email transporter
const initializeEmailTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'gmail') {
    transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use app-specific password
      },
    });
  } else if (process.env.EMAIL_SERVICE === 'smtp') {
    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // Default to console logging for development
    transporter = nodemailer.createTransporter({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }
};

// Initialize transporter
initializeEmailTransporter();

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise} - Send result
 */
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"LPN PRO" <${process.env.EMAIL_FROM || 'noreply@lpnpro.com'}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email would be sent:', {
        to: options.to,
        subject: options.subject,
        content: options.html || options.text,
      });
      return { success: true, messageId: 'dev-mode' };
    }

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return result;

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
};

/**
 * Send welcome email to new user
 * @param {Object} user - User object
 * @param {string} verificationToken - Email verification token
 */
const sendWelcomeEmail = async (user, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to LPN PRO!</h1>
                <p>Your MLM journey starts here</p>
            </div>
            <div class="content">
                <h2>Hello ${user.firstName} ${user.lastName},</h2>
                <p>Thank you for joining LPN PRO! We're excited to have you as part of our growing community.</p>
                
                <p><strong>Your Account Details:</strong></p>
                <ul>
                    <li><strong>User ID:</strong> ${user.userId}</li>
                    <li><strong>Email:</strong> ${user.email}</li>
                    <li><strong>Referral Code:</strong> ${user.referralCode}</li>
                </ul>
                
                <p>To get started, please verify your email address by clicking the button below:</p>
                
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
                
                <p>After email verification, you'll need to complete your registration fee payment of ₦3,500 to activate your account.</p>
                
                <p><strong>Next Steps:</strong></p>
                <ol>
                    <li>Verify your email address</li>
                    <li>Complete registration fee payment</li>
                    <li>Start building your network</li>
                    <li>Earn from our comprehensive compensation plan</li>
                </ol>
                
                <p>If you have any questions, please don't hesitate to contact our support team.</p>
                
                <p>Welcome aboard!</p>
                <p><strong>The LPN PRO Team</strong></p>
            </div>
            <div class="footer">
                <p>This link will expire in 24 hours. If you didn't create this account, please ignore this email.</p>
                <p>&copy; ${new Date().getFullYear()} LPN PRO. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to LPN PRO - Verify Your Account',
    html,
  });
};

/**
 * Send payment confirmation email
 * @param {Object} user - User object
 * @param {Object} transaction - Transaction object
 */
const sendPaymentConfirmationEmail = async (user, transaction) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .transaction-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Payment Confirmed! ✅</h1>
                <p>Your account is now active</p>
            </div>
            <div class="content">
                <h2>Hello ${user.firstName},</h2>
                <p>Great news! Your payment has been successfully processed and your LPN PRO account is now fully active.</p>
                
                <div class="transaction-details">
                    <h3>Transaction Details</h3>
                    <p><strong>Transaction ID:</strong> ${transaction.reference}</p>
                    <p><strong>Amount:</strong> ₦${transaction.amount.toLocaleString()}</p>
                    <p><strong>Type:</strong> ${transaction.type.replace('_', ' ').toUpperCase()}</p>
                    <p><strong>Status:</strong> ${transaction.status.toUpperCase()}</p>
                    <p><strong>Date:</strong> ${new Date(transaction.completedAt).toLocaleDateString()}</p>
                </div>
                
                <p><strong>What's Next?</strong></p>
                <ul>
                    <li>Start building your binary tree network</li>
                    <li>Share your referral link with others</li>
                    <li>Complete monthly verification to earn bonuses</li>
                    <li>Track your progress in the dashboard</li>
                </ul>
                
                <p><strong>Your Referral Link:</strong><br>
                <a href="${user.getReferralLink()}">${user.getReferralLink()}</a></p>
                
                <p>Thank you for choosing LPN PRO. Here's to your success!</p>
                <p><strong>The LPN PRO Team</strong></p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} LPN PRO. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Payment Confirmed - Your LPN PRO Account is Active!',
    html,
  });
};

/**
 * Send stage upgrade notification email
 * @param {Object} user - User object
 * @param {string} newStage - New stage name
 * @param {number} earnings - Earnings amount
 */
const sendStageUpgradeEmail = async (user, newStage, earnings) => {
  const stageDisplayNames = {
    marketer: 'MARKETER',
    manager: 'MANAGER',
    senior_manager: 'SENIOR MANAGER',
    director: 'DIRECTOR',
    ruby_director: 'RUBY DIRECTOR',
    diamond_director: 'DIAMOND DIRECTOR',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .achievement { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; border: 2px solid #FFD700; }
            .earnings { font-size: 24px; color: #4CAF50; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Congratulations!</h1>
                <p>You've been upgraded to a new stage!</p>
            </div>
            <div class="content">
                <h2>Hello ${user.firstName},</h2>
                <p>Fantastic news! You have successfully advanced to the next stage in the LPN PRO compensation plan.</p>
                
                <div class="achievement">
                    <h3>🏆 New Achievement Unlocked</h3>
                    <p><strong>New Stage:</strong> ${stageDisplayNames[newStage] || newStage.toUpperCase()}</p>
                    <p><strong>Earnings from Upgrade:</strong></p>
                    <div class="earnings">₦${earnings.toLocaleString()}</div>
                </div>
                
                <p>This upgrade is a testament to your hard work and dedication in building your network. Your earnings have been added to your account balance.</p>
                
                <p><strong>Keep Growing:</strong></p>
                <ul>
                    <li>Continue expanding your binary tree</li>
                    <li>Help your downline members succeed</li>
                    <li>Aim for the next stage level</li>
                    <li>Maintain monthly verification for bonus earnings</li>
                </ul>
                
                <p>Log in to your dashboard to see your updated status and earnings.</p>
                
                <p>Congratulations once again on this achievement!</p>
                <p><strong>The LPN PRO Team</strong></p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} LPN PRO. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `🎉 Stage Upgrade! Welcome to ${stageDisplayNames[newStage] || newStage.toUpperCase()}`,
    html,
  });
};

/**
 * Send withdrawal approval email
 * @param {Object} user - User object
 * @param {Object} withdrawal - Withdrawal transaction object
 */
const sendWithdrawalApprovalEmail = async (user, withdrawal) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .withdrawal-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Withdrawal Approved! 💰</h1>
                <p>Your funds are being processed</p>
            </div>
            <div class="content">
                <h2>Hello ${user.firstName},</h2>
                <p>Good news! Your withdrawal request has been approved and is being processed.</p>
                
                <div class="withdrawal-details">
                    <h3>Withdrawal Details</h3>
                    <p><strong>Reference:</strong> ${withdrawal.reference}</p>
                    <p><strong>Amount:</strong> ₦${withdrawal.amount.toLocaleString()}</p>
                    <p><strong>Processing Fee:</strong> ₦${withdrawal.withdrawalDetails.processingFee.toLocaleString()}</p>
                    <p><strong>Net Amount:</strong> ₦${withdrawal.withdrawalDetails.netAmount.toLocaleString()}</p>
                    <p><strong>Bank:</strong> ${withdrawal.withdrawalDetails.bankName}</p>
                    <p><strong>Account:</strong> ${withdrawal.withdrawalDetails.accountNumber}</p>
                    <p><strong>Account Name:</strong> ${withdrawal.withdrawalDetails.accountName}</p>
                    <p><strong>Approved Date:</strong> ${new Date(withdrawal.withdrawalDetails.approvedAt).toLocaleDateString()}</p>
                </div>
                
                <p>The funds will be transferred to your bank account within 1-3 business days.</p>
                
                <p>You will receive another notification once the transfer is completed.</p>
                
                <p>Thank you for using LPN PRO!</p>
                <p><strong>The LPN PRO Team</strong></p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} LPN PRO. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Withdrawal Approved - Funds Being Processed',
    html,
  });
};

/**
 * Send monthly verification reminder email
 * @param {Object} user - User object
 */
const sendVerificationReminderEmail = async (user) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .cta-button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⏰ Monthly Verification Due</h1>
                <p>Don't miss out on your monthly earnings!</p>
            </div>
            <div class="content">
                <h2>Hello ${user.firstName},</h2>
                <p>This is a friendly reminder that your monthly verification for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} is due.</p>
                
                <p><strong>Why verify monthly?</strong></p>
                <ul>
                    <li>Maintain your active status</li>
                    <li>Earn monthly verification bonuses</li>
                    <li>Stay eligible for stage earnings</li>
                    <li>Keep your account in good standing</li>
                </ul>
                
                <p><strong>Verification Fee:</strong> ₦1,000<br>
                <strong>Monthly Earnings Potential:</strong> Based on your current stage</p>
                
                <a href="${process.env.FRONTEND_URL}/dashboard/verification" class="cta-button">Verify Now</a>
                
                <p>Complete your verification today to continue earning from your network!</p>
                
                <p>Best regards,</p>
                <p><strong>The LPN PRO Team</strong></p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} LPN PRO. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: '⏰ Monthly Verification Reminder - LPN PRO',
    html,
  });
};

/**
 * Send password reset email
 * @param {Object} user - User object
 * @param {string} resetToken - Password reset token
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔒 Password Reset Request</h1>
                <p>LPN PRO Account Security</p>
            </div>
            <div class="content">
                <h2>Hello ${user.firstName},</h2>
                <p>We received a request to reset the password for your LPN PRO account.</p>
                
                <p>To reset your password, click the button below:</p>
                
                <a href="${resetUrl}" class="button">Reset Password</a>
                
                <div class="warning">
                    <strong>⚠️ Important:</strong>
                    <ul>
                        <li>This link will expire in 1 hour</li>
                        <li>If you didn't request this reset, please ignore this email</li>
                        <li>For security, never share this link with anyone</li>
                    </ul>
                </div>
                
                <p>If you continue to have trouble accessing your account, please contact our support team.</p>
                
                <p>Best regards,</p>
                <p><strong>The LPN PRO Security Team</strong></p>
            </div>
            <div class="footer">
                <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
                <p style="word-break: break-all;">${resetUrl}</p>
                <p>&copy; ${new Date().getFullYear()} LPN PRO. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Reset Your LPN PRO Password',
    html,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPaymentConfirmationEmail,
  sendStageUpgradeEmail,
  sendWithdrawalApprovalEmail,
  sendVerificationReminderEmail,
  sendPasswordResetEmail,
};