# LPN PRO Binary MLM Website

🌐 **A comprehensive Multi-Level Marketing (MLM) platform with binary compensation plan, monthly verification system, and multi-role management.**

## 🚀 Features

### 👥 Multi-Role System
- **Members**: Registration, binary tree participation, earnings tracking, withdrawals
- **Coordinators**: Team management, verification assistance, downline monitoring
- **Admin**: Complete system management, user control, financial oversight

### 💰 Binary MLM Compensation Plan
- **6-Stage Progression**: Feeder → Marketer → Manager → Senior Manager → Director → Ruby Director → Diamond Director
- **Binary Tree Structure**: Left/Right leg placement with spillover logic
- **Automatic Upgrades**: Stage progression based on downline requirements
- **Member Recycling**: Diamond Directors recycle back to Feeder stage

### 📊 Compensation Structure

| Stage | Total Members | Total Earnings | Monthly Verification Earnings |
|-------|---------------|----------------|-------------------------------|
| Feeder | 2 | ₦0 | ₦0 |
| Marketer | 28 | ₦1,400 | ₦700 |
| Manager | 224 | ₦11,200 | ₦5,600 |
| Senior Manager | 1,792 | ₦89,600 | ₦44,800 |
| Director | 14,336 | ₦716,800 | ₦358,800 |
| Ruby Director | 114,688 | ₦5,734,400 | ₦2,867,200 |
| Diamond Director | 917,504 | ₦45,875,200 | ₦22,937,600 |

### 🔐 Security Features
- JWT Authentication with refresh tokens
- Password hashing with bcrypt
- 4-digit withdrawal PIN security
- Rate limiting and account lockout protection
- Email verification and password reset
- Admin access logging

### 💳 Payment Integration
- **Paystack Integration**: Secure payment processing
- **Flutterwave Support**: Alternative payment gateway
- **Registration Fee**: ₦3,500 (includes ₦1,000 calculation fee)
- **Monthly Verification**: ₦1,000 per month

### 📱 Modern UI/UX
- **React.js with TypeScript**: Type-safe frontend development
- **Tailwind CSS**: Modern, responsive design system
- **React Hot Toast**: User-friendly notifications
- **Recharts**: Beautiful data visualization
- **Headless UI**: Accessible component library

## 🏗️ Technical Architecture

### Backend (Node.js + Express + MongoDB)
```
backend/
├── server.js                 # Main server file
├── models/                   # Database models
│   ├── User.js              # User schema with MLM structure
│   ├── Transaction.js       # Financial transactions
│   └── Stage.js             # MLM stage definitions
├── routes/                   # API route handlers
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management
│   ├── binary.js            # Binary tree operations
│   ├── payments.js          # Payment processing
│   ├── withdrawals.js       # Withdrawal management
│   ├── verification.js      # Monthly verification
│   ├── admin.js             # Admin operations
│   └── coordinator.js       # Coordinator functions
├── middleware/               # Custom middleware
│   └── auth.js              # JWT authentication
├── utils/                    # Utility functions
│   ├── binaryTree.js        # Binary tree algorithms
│   └── email.js             # Email services
└── config/                   # Configuration files
```

### Frontend (React.js + TypeScript + Tailwind CSS)
```
frontend/src/
├── components/               # Reusable UI components
├── contexts/                 # React contexts
│   └── AuthContext.tsx      # Authentication state management
├── pages/                    # Page components
│   ├── auth/                # Authentication pages
│   ├── dashboard/           # Member dashboard
│   ├── admin/               # Admin panel
│   ├── coordinator/         # Coordinator interface
│   └── public/              # Public pages
├── services/                 # API services
│   └── api.ts               # HTTP client and API functions
├── types/                    # TypeScript definitions
│   └── auth.ts              # Type definitions
├── utils/                    # Utility functions
└── hooks/                    # Custom React hooks
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/lpn_pro_mlm
   JWT_SECRET=your-super-secret-jwt-key
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   PAYSTACK_SECRET_KEY=your-paystack-secret-key
   FLUTTERWAVE_SECRET_KEY=your-flutterwave-secret-key
   ```

4. **Start the backend server**
   ```bash
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
   ```

4. **Start the frontend development server**
   ```bash
   npm start
   ```

### Database Initialization

The system will automatically:
- Create database collections
- Initialize default MLM stages
- Set up indexes for optimal performance

## 🎯 Key Features Implementation

### 1. Binary Tree Management
- **Automatic Placement**: Smart spillover algorithm
- **Real-time Updates**: Instant tree structure updates
- **Visual Tree Display**: Interactive binary tree visualization
- **Performance Optimized**: Efficient tree traversal algorithms

### 2. MLM Compensation Engine
- **Stage-based Earnings**: Automatic calculation based on downline
- **Level Completion Bonuses**: Earnings for each completed level
- **Monthly Verification Rewards**: Additional income for active members
- **Recycling System**: Continuous earning potential

### 3. Payment Processing
- **Multiple Gateways**: Paystack and Flutterwave integration
- **Secure Transactions**: End-to-end payment security
- **Automated Verification**: Real-time payment confirmation
- **Transaction Logging**: Complete financial audit trail

### 4. User Management
- **Role-based Access**: Member, Coordinator, Admin permissions
- **Account Security**: Multi-factor authentication options
- **Profile Management**: Comprehensive user profiles
- **Activity Monitoring**: Login and transaction tracking

### 5. Dashboard Analytics
- **Real-time Statistics**: Live earnings and member counts
- **Performance Metrics**: Stage progress and achievement tracking
- **Financial Reports**: Detailed earning and withdrawal history
- **Visual Charts**: Graphical representation of data

## 🔒 Security Measures

### Authentication & Authorization
- JWT tokens with automatic refresh
- Role-based access control (RBAC)
- Session management with secure logout
- Password strength requirements

### Data Protection
- bcrypt password hashing (12 rounds)
- Withdrawal PIN encryption
- Input validation and sanitization
- SQL injection prevention

### API Security
- Rate limiting (100 requests/15 minutes)
- CORS configuration
- Helmet.js security headers
- Request/response logging

### Financial Security
- Withdrawal PIN verification
- Admin approval for large withdrawals
- Transaction audit trails
- Fraud detection algorithms

## 📱 Responsive Design

The platform is fully responsive and optimized for:
- **Desktop**: Full dashboard experience
- **Tablet**: Touch-optimized interface
- **Mobile**: Mobile-first design approach
- **PWA Ready**: Installable web application

## 🚀 Deployment

### Production Environment

1. **Environment Variables**
   ```env
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   JWT_SECRET=your-production-jwt-secret
   FRONTEND_URL=https://your-domain.com
   ```

2. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy Backend**
   ```bash
   cd backend
   npm start
   ```

### Recommended Hosting Platforms
- **Backend**: Heroku, DigitalOcean, AWS EC2
- **Frontend**: Netlify, Vercel, AWS S3 + CloudFront
- **Database**: MongoDB Atlas, AWS DocumentDB

## 📈 Performance Optimization

### Backend Optimizations
- Database indexing for fast queries
- Connection pooling for MongoDB
- Response caching for static data
- Compression middleware for responses

### Frontend Optimizations
- Code splitting with React.lazy
- Image optimization and lazy loading
- Bundle size optimization
- Service worker for caching

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### MLM Operations
- `GET /api/binary/tree` - Get binary tree
- `GET /api/stages` - Get MLM stages
- `POST /api/verification/monthly` - Submit verification
- `POST /api/withdrawals/request` - Request withdrawal

### Admin Operations
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `GET /api/admin/transactions` - Get all transactions
- `POST /api/admin/reports/generate` - Generate reports

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and inquiries:
- **Email**: laanipay1@gmail.com
- **Phone**: +229 0155 049165
- **WhatsApp**: https://wa.me/22955049165
- **YouTube**: https://youtube.com/@laanipay?si=bVEYoMf4cy8R9QId
- **Motto**: "Experience More, Experience The Best."

## 🙏 Acknowledgments

- React.js community for the amazing framework
- MongoDB for the flexible database solution
- Tailwind CSS for the utility-first CSS framework
- Paystack & Flutterwave for payment processing

---

**Built with ❤️ for the LPN PRO community**
