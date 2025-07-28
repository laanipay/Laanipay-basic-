# 🌐 LPN PRO MLM Platform

A comprehensive Multi-Level Marketing (MLM) platform with binary compensation plan, built with Node.js, React, and MongoDB.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [MLM Compensation Plan](#mlm-compensation-plan)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### 🔐 Authentication & Security
- User registration with payment verification
- JWT-based authentication
- Role-based access control (Member, Coordinator, Admin)
- Account lockout protection
- Password hashing with bcrypt
- Withdrawal PIN security

### 💰 MLM Business Logic
- **Binary Tree Structure**: Automatic spillover placement
- **6-Stage Compensation Plan**: From Feeder to Diamond Director
- **Monthly Verification System**: ₦1,000 monthly verification
- **Automatic Upgrades**: Stage progression based on member count
- **Member Recycling**: After Stage 6 completion
- **Earnings Distribution**: Real-time commission calculations

### 💳 Payment Integration
- **Paystack Integration**: For Nigerian payments
- **Flutterwave Support**: Alternative payment gateway
- **Webhook Verification**: Secure payment confirmations
- **Manual Payment Verification**: Admin override capability

### 📊 Dashboard Features
- **Member Dashboard**: Personal stats, binary tree, earnings
- **Coordinator Panel**: Team management and monitoring
- **Admin Dashboard**: System overview, user management, reports
- **Real-time Analytics**: Charts and performance metrics

### 💸 Financial Management
- **Wallet System**: Track earnings and balances
- **Withdrawal Requests**: Secure PIN-protected withdrawals
- **Transaction History**: Complete audit trail
- **Multiple Withdrawal Methods**: Bank transfer, mobile money

## 🛠 Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Nodemailer** for email notifications
- **Express Validator** for input validation

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for state management
- **React Hook Form** for forms
- **Headless UI** for components

### Security & DevOps
- **Helmet.js** for security headers
- **Rate Limiting** for API protection
- **CORS** configuration
- **Environment-based configuration**

## 📁 Project Structure

```
lpn-pro-mlm/
├── backend/                    # Node.js API server
│   ├── models/                # Database models
│   │   ├── User.js           # User model with MLM structure
│   │   ├── Transaction.js    # Financial transactions
│   │   ├── Stage.js          # MLM stage configurations
│   │   └── Verification.js   # Monthly verification tracking
│   ├── routes/               # API route handlers
│   │   ├── auth.js          # Authentication routes
│   │   ├── users.js         # User management
│   │   ├── payments.js      # Payment processing
│   │   ├── admin.js         # Admin operations
│   │   └── stages.js        # Stage management
│   ├── middleware/          # Custom middleware
│   │   └── auth.js         # Authentication middleware
│   ├── utils/              # Utility functions
│   │   ├── helpers.js      # General utilities
│   │   └── mlm.js         # MLM business logic
│   ├── config/            # Configuration files
│   ├── .env              # Environment variables
│   ├── server.js         # Main server file
│   └── package.json      # Dependencies
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   ├── services/     # API services
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Frontend utilities
│   ├── public/           # Static assets
│   └── package.json      # Dependencies
├── docs/                 # Documentation
└── README.md            # This file
```

## 🚀 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lpn-pro-mlm/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running
   mongod
   ```

5. **Initialize the system**
   ```bash
   npm run dev
   # The server will start on http://localhost:5000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start development server**
   ```bash
   npm start
   # The app will open at http://localhost:3000
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/lpn-pro-mlm

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=30d

# Payment Gateways
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret_key
FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# MLM Configuration
REGISTRATION_FEE=3500
CALCULATION_FEE=1000
MONTHLY_VERIFICATION_FEE=1000
MONTHLY_CALCULATION_FEE=500
```

## 👥 User Roles

### 🧑‍💼 Members
- Register and verify email
- Make registration payment (₦3,500)
- View personal dashboard
- Track binary tree placement
- Monitor earnings and wallet balance
- Request withdrawals with PIN
- Pay monthly verification (₦1,000)
- View referral statistics

### 👨‍💻 Coordinators
- All member features
- Manage assigned teams
- Monitor downline performance
- Assist with verification process
- View team analytics

### 🔧 Administrators
- Full system access
- User management (activate/deactivate)
- Withdrawal approval/rejection
- Manual payment verification
- System configuration
- Financial reports and analytics
- Stage management

## 💰 MLM Compensation Plan

### Stage Structure

| Stage | Name | Levels | Total Members | Total Earnings | Monthly Earnings |
|-------|------|--------|---------------|----------------|------------------|
| Feeder | Entry Stage | 1 | 2 | ₦0 | ₦0 |
| Stage 1 | MARKETER | 3 | 28 | ₦1,400 | ₦700 |
| Stage 2 | MANAGER | 3 | 224 | ₦11,200 | ₦5,600 |
| Stage 3 | SENIOR MANAGER | 3 | 1,792 | ₦89,600 | ₦44,800 |
| Stage 4 | DIRECTOR | 3 | 14,336 | ₦716,800 | ₦358,800 |
| Stage 5 | RUBY DIRECTOR | 3 | 114,688 | ₦5,734,400 | ₦2,867,200 |
| Stage 6 | DIAMOND DIRECTOR | 3 | 917,504 | ₦45,875,200 | ₦22,937,600 |

### Stage 1 - MARKETER
- **Level 1**: 4 members → ₦200
- **Level 2**: 8 members → ₦400  
- **Level 3**: 16 members → ₦800

### Stage 2 - MANAGER
- **Level 1**: 32 members → ₦1,600
- **Level 2**: 64 members → ₦3,200
- **Level 3**: 128 members → ₦6,400

### Monthly Verification Benefits
- All active members must verify monthly with ₦1,000
- ₦500 goes to calculation and distribution
- Monthly earnings are proportional to stage level
- Verification maintains eligibility for earnings

## 🔌 API Documentation

### Authentication Endpoints

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
POST /api/auth/verify-email
POST /api/auth/forgot-password
POST /api/auth/reset-password
PUT /api/auth/change-password
```

### User Management

```http
GET /api/users/dashboard
GET /api/users/tree
GET /api/users/referrals
GET /api/users/transactions
PUT /api/users/profile
PUT /api/users/change-pin
POST /api/users/withdraw
GET /api/users/verification
GET /api/users/stats
```

### Payment Processing

```http
POST /api/payments/initialize-registration
POST /api/payments/initialize-verification
POST /api/payments/verify/:gateway
GET /api/payments/status/:reference
GET /api/payments/history
POST /api/payments/manual-verify
```

### Admin Operations

```http
GET /api/admin/dashboard
GET /api/admin/users
GET /api/admin/users/:id
PUT /api/admin/users/:id/status
PUT /api/admin/users/:id/role
GET /api/admin/withdrawals
PUT /api/admin/withdrawals/:id
GET /api/admin/verifications
PUT /api/admin/verifications/:id/verify
GET /api/admin/reports
POST /api/admin/initialize
GET /api/admin/logs
```

## 🚀 Deployment

### Backend Deployment

1. **Environment Setup**
   ```bash
   # Set production environment variables
   NODE_ENV=production
   PORT=80
   MONGODB_URI=mongodb://your-production-db
   ```

2. **Build and Start**
   ```bash
   npm start
   ```

### Frontend Deployment

1. **Build for production**
   ```bash
   npm run build
   ```

2. **Deploy to hosting service**
   - Netlify, Vercel, or similar
   - Configure environment variables
   - Set API base URL

### Database Setup

1. **MongoDB Atlas (Recommended)**
   - Create cluster on MongoDB Atlas
   - Configure network access
   - Get connection string

2. **Local MongoDB**
   ```bash
   # Install MongoDB
   # Start service
   sudo systemctl start mongod
   ```

### Payment Gateway Setup

1. **Paystack Configuration**
   - Create Paystack account
   - Get API keys from dashboard
   - Configure webhook URLs

2. **Flutterwave Configuration**
   - Create Flutterwave account
   - Get API credentials
   - Set up webhook endpoints

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Sanitizes all user inputs
- **Password Hashing**: bcrypt with configurable rounds
- **JWT Security**: Secure token management
- **Account Lockout**: Protection against brute force
- **PIN Protection**: Secure withdrawal process
- **Email Verification**: Confirms user identity
- **CORS Configuration**: Controlled cross-origin access

## 📊 Monitoring & Analytics

- **Real-time Dashboard**: Live system statistics
- **Financial Reports**: Detailed earning reports
- **User Analytics**: Registration and activity trends
- **Transaction Logging**: Complete audit trail
- **Error Monitoring**: System health checks

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Email: support@lpnpro.com
- Documentation: [Project Wiki](link-to-wiki)
- Issues: [GitHub Issues](link-to-issues)

## 🙏 Acknowledgments

- MongoDB for database technology
- Express.js for backend framework
- React for frontend framework
- Paystack & Flutterwave for payment processing
- All contributors and testers

---

**Built with ❤️ by the LPN PRO Team**
