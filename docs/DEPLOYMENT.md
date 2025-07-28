# 🚀 LPN PRO MLM Deployment Guide

This guide covers deploying the LPN PRO MLM platform to various hosting platforms and environments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Deployment](#database-deployment)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Payment Gateway Configuration](#payment-gateway-configuration)
- [Production Checklist](#production-checklist)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements
- **Node.js**: v16.0 or higher
- **MongoDB**: v4.4 or higher
- **Memory**: Minimum 1GB RAM (2GB+ recommended)
- **Storage**: Minimum 10GB free space
- **SSL Certificate**: Required for production

### Required Accounts
- MongoDB Atlas account (for cloud database)
- Paystack account (Nigerian payments)
- Flutterwave account (alternative payments)
- Email service account (Gmail/SendGrid)
- Hosting provider account

## 🌍 Environment Setup

### Production Environment Variables

Create a `.env` file for production:

```env
# ===========================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# ===========================================

# Server Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com

# Database (MongoDB Atlas recommended)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lpn-pro-mlm?retryWrites=true&w=majority

# JWT Configuration (Use strong secret)
JWT_SECRET=your_super_secure_jwt_secret_min_32_characters_long
JWT_EXPIRE=30d

# Security
BCRYPT_ROUNDS=12
PIN_BCRYPT_ROUNDS=10

# Payment Gateways (LIVE KEYS)
PAYSTACK_SECRET_KEY=sk_live_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your_flutterwave_secret
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your_flutterwave_public

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_business_email@domain.com
EMAIL_PASS=your_app_specific_password

# MLM Configuration
REGISTRATION_FEE=3500
CALCULATION_FEE=1000
MONTHLY_VERIFICATION_FEE=1000
MONTHLY_CALCULATION_FEE=500

# Admin Configuration
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=secure_admin_password_change_immediately
```

## 🗄️ Database Deployment

### Option 1: MongoDB Atlas (Recommended)

1. **Create MongoDB Atlas Account**
   - Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create account and new project

2. **Create Cluster**
   ```bash
   # Choose cluster tier (M0 free tier for testing)
   # Select region closest to your users
   # Configure cluster name: lpn-pro-mlm
   ```

3. **Configure Database Access**
   ```bash
   # Create database user
   Username: lpn-admin
   Password: [Generate strong password]
   Built-in Role: Read and write to any database
   ```

4. **Configure Network Access**
   ```bash
   # Add IP addresses that can access cluster
   # For production: Add specific server IPs
   # For development: 0.0.0.0/0 (not recommended for production)
   ```

5. **Get Connection String**
   ```bash
   # Click "Connect" > "Connect your application"
   # Copy connection string
   # Replace <password> with your actual password
   ```

### Option 2: Self-Hosted MongoDB

1. **Install MongoDB**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install -y mongodb

   # CentOS/RHEL
   sudo yum install -y mongodb-server

   # Start MongoDB
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

2. **Configure MongoDB**
   ```bash
   # Edit configuration
   sudo nano /etc/mongod.conf

   # Enable authentication
   security:
     authorization: enabled

   # Create admin user
   mongo
   use admin
   db.createUser({
     user: "admin",
     pwd: "secure_password",
     roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase"]
   })
   ```

## 🖥️ Backend Deployment

### Option 1: Railway Deployment

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Initialize**
   ```bash
   railway login
   railway init
   ```

3. **Configure Environment Variables**
   ```bash
   # Set all production environment variables
   railway variables set NODE_ENV=production
   railway variables set MONGODB_URI="your_mongodb_uri"
   railway variables set JWT_SECRET="your_jwt_secret"
   # ... set all other variables
   ```

4. **Deploy**
   ```bash
   railway up
   ```

### Option 2: Heroku Deployment

1. **Install Heroku CLI**
   ```bash
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Create Heroku App**
   ```bash
   heroku create lpn-pro-mlm-backend
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI="your_mongodb_uri"
   heroku config:set JWT_SECRET="your_jwt_secret"
   # ... set all variables
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 3: VPS Deployment (Ubuntu)

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Deploy Application**
   ```bash
   # Clone repository
   git clone <your-repo-url>
   cd lpn-pro-mlm/backend

   # Install dependencies
   npm install --production

   # Create production environment file
   nano .env
   # Add all production environment variables

   # Start with PM2
   pm2 start server.js --name "lpn-backend"
   pm2 startup
   pm2 save
   ```

3. **Configure Nginx (Optional)**
   ```bash
   # Install Nginx
   sudo apt install nginx

   # Create configuration
   sudo nano /etc/nginx/sites-available/lpn-backend

   # Add configuration:
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }

   # Enable site
   sudo ln -s /etc/nginx/sites-available/lpn-backend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 🌐 Frontend Deployment

### Option 1: Netlify Deployment

1. **Build Application**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Netlify**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli

   # Deploy
   netlify deploy --prod --dir=build

   # Or use drag & drop on netlify.com
   ```

3. **Configure Environment Variables**
   ```bash
   # In Netlify dashboard > Site settings > Environment variables
   REACT_APP_API_URL=https://your-backend-url.com/api
   REACT_APP_PAYSTACK_PUBLIC_KEY=pk_live_your_public_key
   REACT_APP_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your_public_key
   ```

### Option 2: Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Configure Environment Variables**
   ```bash
   # Use Vercel dashboard or CLI
   vercel env add REACT_APP_API_URL
   vercel env add REACT_APP_PAYSTACK_PUBLIC_KEY
   vercel env add REACT_APP_FLUTTERWAVE_PUBLIC_KEY
   ```

### Option 3: VPS Deployment with Nginx

1. **Build and Transfer**
   ```bash
   # Build locally
   npm run build

   # Transfer to server
   scp -r build/ user@your-server:/var/www/lpn-frontend/
   ```

2. **Configure Nginx**
   ```bash
   # Create Nginx configuration
   sudo nano /etc/nginx/sites-available/lpn-frontend

   server {
       listen 80;
       server_name your-frontend-domain.com;
       root /var/www/lpn-frontend;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://localhost:5000/api;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }

   # Enable site
   sudo ln -s /etc/nginx/sites-available/lpn-frontend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 💳 Payment Gateway Configuration

### Paystack Setup

1. **Live Mode Configuration**
   ```bash
   # In Paystack Dashboard:
   # 1. Complete KYC verification
   # 2. Switch to Live Mode
   # 3. Get Live API keys
   # 4. Configure webhooks
   ```

2. **Webhook Configuration**
   ```bash
   # Webhook URL: https://your-backend.com/api/payments/verify/paystack
   # Events to subscribe to:
   # - charge.success
   # - transfer.success
   # - transfer.failed
   ```

### Flutterwave Setup

1. **Go Live Process**
   ```bash
   # 1. Complete business verification
   # 2. Submit required documents
   # 3. Get live API credentials
   # 4. Configure webhook endpoints
   ```

2. **Webhook Configuration**
   ```bash
   # Webhook URL: https://your-backend.com/api/payments/verify/flutterwave
   # Hash: Set a secure hash value
   ```

## ✅ Production Checklist

### Security Checklist

- [ ] **Environment Variables**
  - [ ] All sensitive data in environment variables
  - [ ] Strong JWT secret (minimum 32 characters)
  - [ ] Secure database credentials
  - [ ] Production API keys only

- [ ] **Database Security**
  - [ ] Database authentication enabled
  - [ ] Network access restrictions configured
  - [ ] Regular backups scheduled
  - [ ] Connection string secured

- [ ] **Application Security**
  - [ ] HTTPS enabled with valid SSL certificate
  - [ ] CORS configured for production domains only
  - [ ] Rate limiting enabled
  - [ ] Input validation implemented
  - [ ] Error messages don't expose sensitive info

- [ ] **Payment Security**
  - [ ] Live payment gateway keys configured
  - [ ] Webhook endpoints secured
  - [ ] Transaction logging enabled
  - [ ] Proper error handling

### Performance Checklist

- [ ] **Backend Optimization**
  - [ ] Database queries optimized
  - [ ] Indexes created for frequent queries
  - [ ] Response compression enabled
  - [ ] Caching implemented where appropriate

- [ ] **Frontend Optimization**
  - [ ] Assets minified and compressed
  - [ ] Images optimized
  - [ ] Lazy loading implemented
  - [ ] Bundle size optimized

### Monitoring Checklist

- [ ] **Health Monitoring**
  - [ ] Health check endpoints implemented
  - [ ] Uptime monitoring configured
  - [ ] Error tracking set up
  - [ ] Performance monitoring enabled

- [ ] **Business Monitoring**
  - [ ] Transaction monitoring
  - [ ] User activity tracking
  - [ ] Financial reconciliation process
  - [ ] Automated alerts configured

## 📊 Monitoring & Maintenance

### Application Monitoring

1. **Health Checks**
   ```bash
   # Implement health check endpoint
   GET /api/health
   
   # Response should include:
   # - Database connectivity
   # - Payment gateway status
   # - System resources
   ```

2. **Logging**
   ```bash
   # Configure structured logging
   # Use tools like Winston for Node.js
   # Log levels: error, warn, info, debug
   ```

### Database Maintenance

1. **Regular Backups**
   ```bash
   # MongoDB Atlas: Automatic backups enabled
   # Self-hosted: Schedule regular dumps
   mongodump --uri="mongodb://localhost:27017/lpn-pro-mlm" --out="/backups/$(date +%Y%m%d)"
   ```

2. **Performance Monitoring**
   ```bash
   # Monitor database performance
   # Check slow queries
   # Optimize indexes as needed
   ```

### Security Updates

1. **Regular Updates**
   ```bash
   # Update dependencies monthly
   npm audit
   npm update

   # Update system packages
   sudo apt update && sudo apt upgrade
   ```

2. **Security Scanning**
   ```bash
   # Run security scans
   npm audit fix
   ```

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check connection string format
   # Verify network access (MongoDB Atlas)
   # Check database credentials
   # Ensure MongoDB service is running
   ```

2. **Payment Gateway Issues**
   ```bash
   # Verify API keys are correct
   # Check webhook URL accessibility
   # Ensure webhook signature verification
   # Test with small amounts first
   ```

3. **Frontend Build Issues**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install

   # Check for TypeScript errors
   npm run build
   ```

### Debugging Steps

1. **Backend Issues**
   ```bash
   # Check server logs
   pm2 logs lpn-backend

   # Test API endpoints
   curl -X GET https://your-backend.com/api/health

   # Check database connectivity
   mongo "your-mongodb-uri"
   ```

2. **Frontend Issues**
   ```bash
   # Check browser console for errors
   # Verify API endpoint URLs
   # Test with different browsers
   # Check network connectivity
   ```

### Emergency Procedures

1. **System Down**
   ```bash
   # Check server status
   # Restart application server
   pm2 restart lpn-backend

   # Check database connectivity
   # Review recent changes
   # Roll back if necessary
   ```

2. **Payment Issues**
   ```bash
   # Disable payment processing temporarily
   # Contact payment gateway support
   # Manual verification for urgent transactions
   # Communicate with users about issues
   ```

## 📞 Support Contacts

- **Technical Support**: tech@lpnpro.com
- **Payment Issues**: payments@lpnpro.com
- **Emergency**: +234-XXX-XXX-XXXX

---

**Last Updated**: December 2024
**Version**: 1.0
**Maintained By**: LPN PRO Development Team