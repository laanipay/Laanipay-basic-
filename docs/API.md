# 🔌 LPN PRO MLM API Documentation

Complete API reference for the LPN PRO MLM platform backend services.

## 📋 Table of Contents

- [Authentication](#authentication)
- [Base URLs](#base-urls)
- [Request/Response Format](#requestresponse-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Authentication Endpoints](#authentication-endpoints)
- [User Management](#user-management)
- [Payment Processing](#payment-processing)
- [Admin Operations](#admin-operations)
- [Stage Management](#stage-management)
- [Webhooks](#webhooks)

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Token Lifecycle
- **Expiration**: 30 days (configurable)
- **Refresh**: Manual re-authentication required
- **Storage**: Store securely on client-side (httpOnly cookies recommended)

## 🌐 Base URLs

| Environment | Base URL |
|-------------|----------|
| Development | `http://localhost:5000/api` |
| Staging | `https://staging-api.lpnpro.com/api` |
| Production | `https://api.lpnpro.com/api` |

## 📨 Request/Response Format

### Content Types
- **Request**: `application/json`
- **Response**: `application/json`

### Standard Response Structure

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data object
  },
  "pagination": {
    // Pagination info (when applicable)
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20
  }
}
```

### Error Response Structure

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "errors": [
    // Validation errors array (when applicable)
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## ⚠️ Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### Common Error Responses

```json
// 401 Unauthorized
{
  "success": false,
  "message": "Not authorized to access this route"
}

// 400 Validation Error
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email"
    }
  ]
}
```

## 🚦 Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 attempts per 15 minutes per IP
- **Payment endpoints**: 10 requests per minute per user

Rate limit headers included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 🔐 Authentication Endpoints

### Register User

Create a new user account.

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "08012345678",
  "password": "securePassword123",
  "withdrawalPin": "1234",
  "referralCode": "LPN123456" // Optional
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for verification and complete payment.",
  "data": {
    "id": "60d5ecb54d3b2c001f647d8a",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "08012345678",
    "referralCode": "LPN789ABC",
    "currentStage": "feeder",
    "registrationTransactionId": "60d5ecb54d3b2c001f647d8b"
  }
}
```

### Login User

Authenticate user and receive JWT token.

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "60d5ecb54d3b2c001f647d8a",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "member",
    "currentStage": "feeder",
    "stageLevel": 1,
    "walletBalance": 0,
    "totalEarnings": 0,
    "referralCode": "LPN789ABC",
    "isEmailVerified": true,
    "verificationStatus": "pending"
  }
}
```

### Get Current User

Get current authenticated user information.

```http
GET /api/auth/me
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "60d5ecb54d3b2c001f647d8a",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "08012345678",
    "role": "member",
    "currentStage": "stage1",
    "stageLevel": 2,
    "stageMembersCount": 5,
    "walletBalance": 2500.00,
    "totalEarnings": 3000.00,
    "totalReferrals": 3,
    "referralCode": "LPN789ABC",
    "sponsorId": {
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "referralCode": "LPN456DEF"
    },
    "directReferrals": [
      {
        "fullName": "Alice Johnson",
        "email": "alice@example.com",
        "currentStage": "feeder",
        "registrationDate": "2023-12-01T10:30:00.000Z"
      }
    ]
  }
}
```

### Verify Email

Verify user email address with token.

```http
POST /api/auth/verify-email
```

**Request Body:**
```json
{
  "token": "verification_token_from_email"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### Forgot Password

Request password reset email.

```http
POST /api/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### Reset Password

Reset password with token from email.

```http
POST /api/auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "newSecurePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful",
  "token": "new_jwt_token",
  "data": {
    // User data
  }
}
```

---

## 👤 User Management

### Get Dashboard Data

Get comprehensive dashboard information for current user.

```http
GET /api/users/dashboard
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "60d5ecb54d3b2c001f647d8a",
      "fullName": "John Doe",
      "email": "john@example.com",
      "currentStage": "stage1",
      "stageLevel": 2,
      "stageMembersCount": 8,
      "walletBalance": 2500.00,
      "totalEarnings": 3000.00,
      "totalReferrals": 5
    },
    "sponsor": {
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "referralCode": "LPN456DEF"
    },
    "referralLink": "https://app.lpnpro.com/register?ref=LPN789ABC",
    "directReferrals": [
      // Array of direct referrals
    ],
    "currentStage": {
      "stageName": "stage1",
      "displayName": "MARKETER",
      "levels": [
        {
          "level": 1,
          "members": 4,
          "earnings": 200
        }
      ]
    },
    "advancement": {
      "canAdvance": false,
      "reason": "Need 8 more members",
      "required": 16,
      "current": 8
    },
    "monthlyVerification": {
      "id": "60d5ecb54d3b2c001f647d8c",
      "month": 12,
      "year": 2023,
      "status": "pending",
      "amount": 1000,
      "dueDate": "2023-12-31T23:59:59.999Z"
    },
    "monthlyEarnings": 500.00,
    "recentTransactions": [
      // Array of recent transactions
    ],
    "stats": {
      "totalMembers": 8,
      "requiredMembers": 16,
      "completionPercentage": 50
    }
  }
}
```

### Get Binary Tree

Get user's binary tree structure.

```http
GET /api/users/tree?depth=3
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `depth` (optional): Tree depth (1-5, default: 3)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tree": {
      "id": "60d5ecb54d3b2c001f647d8a",
      "fullName": "John Doe",
      "email": "john@example.com",
      "currentStage": "stage1",
      "stageLevel": 2,
      "position": null,
      "leftChild": {
        "id": "60d5ecb54d3b2c001f647d8d",
        "fullName": "Alice Johnson",
        "email": "alice@example.com",
        "currentStage": "feeder",
        "position": "left",
        "leftChild": null,
        "rightChild": null
      },
      "rightChild": {
        "id": "60d5ecb54d3b2c001f647d8e",
        "fullName": "Bob Wilson",
        "email": "bob@example.com",
        "currentStage": "stage1",
        "position": "right",
        "leftChild": null,
        "rightChild": null
      }
    },
    "depth": 3
  }
}
```

### Get User Referrals

Get paginated list of user's direct referrals.

```http
GET /api/users/referrals?page=1&limit=10
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "referrals": [
      {
        "id": "60d5ecb54d3b2c001f647d8d",
        "fullName": "Alice Johnson",
        "email": "alice@example.com",
        "phoneNumber": "08012345679",
        "currentStage": "feeder",
        "stageLevel": 1,
        "walletBalance": 0,
        "totalEarnings": 0,
        "registrationDate": "2023-12-01T10:30:00.000Z",
        "isActive": true
      }
    ],
    "stats": [
      {
        "_id": "feeder",
        "count": 2,
        "totalEarnings": 0
      },
      {
        "_id": "stage1",
        "count": 1,
        "totalEarnings": 600
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 3,
      "itemsPerPage": 10
    }
  }
}
```

### Request Withdrawal

Create a withdrawal request.

```http
POST /api/users/withdraw
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 1000.00,
  "withdrawalMethod": "bank_transfer",
  "accountNumber": "1234567890",
  "accountName": "John Doe",
  "bankName": "First Bank",
  "bankCode": "011",
  "withdrawalPin": "1234"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Withdrawal request submitted successfully",
  "data": {
    "transactionId": "60d5ecb54d3b2c001f647d8f",
    "amount": 1000.00,
    "status": "pending"
  }
}
```

---

## 💳 Payment Processing

### Initialize Registration Payment

Initialize payment for user registration.

```http
POST /api/payments/initialize-registration
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "gateway": "paystack"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment initialized successfully",
  "data": {
    "reference": "LPN_REG_60d5ecb54d3b2c001f647d8a_1640995200000",
    "amount": 3500,
    "gateway": "paystack",
    "paymentData": {
      "reference": "LPN_REG_60d5ecb54d3b2c001f647d8a_1640995200000",
      "amount": 350000,
      "email": "john@example.com",
      "currency": "NGN",
      "callback_url": "https://app.lpnpro.com/payment/callback",
      "metadata": {
        "user_id": "60d5ecb54d3b2c001f647d8a",
        "payment_type": "registration"
      }
    },
    "user": {
      "id": "60d5ecb54d3b2c001f647d8a",
      "fullName": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### Initialize Monthly Verification Payment

Initialize payment for monthly verification.

```http
POST /api/payments/initialize-verification
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "gateway": "paystack",
  "month": 12,
  "year": 2023
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Verification payment initialized successfully",
  "data": {
    "reference": "LPN_VER_60d5ecb54d3b2c001f647d8a_12_2023_1640995200000",
    "amount": 1000,
    "gateway": "paystack",
    "paymentData": {
      "reference": "LPN_VER_60d5ecb54d3b2c001f647d8a_12_2023_1640995200000",
      "amount": 100000,
      "email": "john@example.com",
      "currency": "NGN",
      "callback_url": "https://app.lpnpro.com/payment/callback"
    },
    "verification": {
      "id": "60d5ecb54d3b2c001f647d8c",
      "month": 12,
      "year": 2023,
      "status": "pending"
    }
  }
}
```

### Get Payment Status

Check status of a payment by reference.

```http
GET /api/payments/status/{reference}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "type": "transaction",
    "reference": "LPN_REG_60d5ecb54d3b2c001f647d8a_1640995200000",
    "status": "completed",
    "amount": 3500,
    "description": "Registration fee payment",
    "user": {
      "fullName": "John Doe",
      "email": "john@example.com"
    },
    "createdAt": "2023-12-01T10:30:00.000Z"
  }
}
```

---

## 🔧 Admin Operations

### Get Admin Dashboard

Get admin dashboard statistics.

```http
GET /api/admin/dashboard
```

**Headers:**
```http
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalUsers": 1250,
      "activeUsers": 1180,
      "newUsersToday": 15,
      "pendingWithdrawals": 23,
      "pendingVerifications": 45
    },
    "stageDistribution": [
      {
        "_id": "feeder",
        "count": 400,
        "totalEarnings": 0
      },
      {
        "_id": "stage1",
        "count": 350,
        "totalEarnings": 490000
      }
    ],
    "financialStats": [
      {
        "_id": "registration_payment",
        "count": 1250,
        "totalAmount": 4375000
      },
      {
        "_id": "withdrawal",
        "count": 180,
        "totalAmount": 890000
      }
    ],
    "monthlyGrowth": [
      {
        "_id": {
          "year": 2023,
          "month": 12
        },
        "newUsers": 150
      }
    ],
    "recentActivities": {
      "registrations": [
        // Recent user registrations
      ],
      "transactions": [
        // Recent transactions
      ]
    }
  }
}
```

### Get All Users

Get paginated list of all users with filters.

```http
GET /api/admin/users?page=1&limit=20&search=john&stage=stage1&status=active&role=member
```

**Headers:**
```http
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Search term (name, email, phone, referral code)
- `stage` (optional): Filter by stage
- `status` (optional): Filter by status (active/inactive)
- `role` (optional): Filter by role

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "60d5ecb54d3b2c001f647d8a",
        "fullName": "John Doe",
        "email": "john@example.com",
        "phoneNumber": "08012345678",
        "role": "member",
        "currentStage": "stage1",
        "stageLevel": 2,
        "walletBalance": 2500.00,
        "totalEarnings": 3000.00,
        "isActive": true,
        "registrationDate": "2023-11-15T10:30:00.000Z",
        "sponsorId": {
          "fullName": "Jane Smith",
          "email": "jane@example.com",
          "referralCode": "LPN456DEF"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 63,
      "totalItems": 1250,
      "itemsPerPage": 20
    }
  }
}
```

### Process Withdrawal Request

Approve or reject a withdrawal request.

```http
PUT /api/admin/withdrawals/{withdrawalId}
```

**Headers:**
```http
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "action": "approve",
  "adminNotes": "Withdrawal approved after verification"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Withdrawal request approved successfully",
  "data": {
    "id": "60d5ecb54d3b2c001f647d8f",
    "userId": "60d5ecb54d3b2c001f647d8a",
    "amount": 1000.00,
    "status": "completed",
    "processedBy": "60d5ecb54d3b2c001f647d90",
    "processedAt": "2023-12-01T15:30:00.000Z",
    "adminNotes": "Withdrawal approved after verification"
  }
}
```

---

## 🎯 Stage Management

### Get All Stages

Get list of all MLM stages.

```http
GET /api/stages
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "60d5ecb54d3b2c001f647d91",
      "stageName": "feeder",
      "displayName": "Feeder Stage",
      "description": "Entry stage with 2 total members",
      "levels": [
        {
          "levelNumber": 1,
          "membersRequired": 2,
          "earnings": 0
        }
      ],
      "totalMembers": 2,
      "totalEarnings": 0,
      "monthlyEarnings": 0,
      "isActive": true,
      "order": 0,
      "currentUserCount": 400
    },
    {
      "id": "60d5ecb54d3b2c001f647d92",
      "stageName": "stage1",
      "displayName": "MARKETER",
      "description": "MARKETER stage with 28 total members",
      "levels": [
        {
          "levelNumber": 1,
          "membersRequired": 4,
          "earnings": 200
        },
        {
          "levelNumber": 2,
          "membersRequired": 8,
          "earnings": 400
        },
        {
          "levelNumber": 3,
          "membersRequired": 16,
          "earnings": 800
        }
      ],
      "totalMembers": 28,
      "totalEarnings": 1400,
      "monthlyEarnings": 700,
      "isActive": true,
      "order": 1,
      "currentUserCount": 350
    }
  ]
}
```

### Get Stage Statistics

Get detailed statistics for a specific stage.

```http
GET /api/stages/{stageName}/stats
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stage": {
      "stageName": "stage1",
      "displayName": "MARKETER",
      "levels": [
        {
          "levelNumber": 1,
          "membersRequired": 4,
          "earnings": 200
        }
      ]
    },
    "totalUsers": 350,
    "topEarners": [
      {
        "fullName": "John Doe",
        "email": "john@example.com",
        "stageLevel": 3,
        "stageMembersCount": 16,
        "totalEarnings": 1400
      }
    ],
    "progressionStats": [
      {
        "_id": 1,
        "count": 200,
        "averageMembers": 2.5,
        "totalEarnings": 40000,
        "requiredMembers": 4,
        "completionRate": 62.5
      }
    ],
    "recentJoiners": [
      // Array of recent users who joined this stage
    ]
  }
}
```

---

## 🔗 Webhooks

### Payment Verification Webhook

Webhook endpoint for payment gateway notifications.

```http
POST /api/payments/verify/{gateway}
```

**Paystack Webhook Headers:**
```http
X-Paystack-Signature: signature_hash
Content-Type: application/json
```

**Paystack Webhook Body:**
```json
{
  "event": "charge.success",
  "data": {
    "id": 302961,
    "domain": "live",
    "status": "success",
    "reference": "LPN_REG_60d5ecb54d3b2c001f647d8a_1640995200000",
    "amount": 350000,
    "message": null,
    "gateway_response": "Successful",
    "paid_at": "2023-12-01T10:30:00.000Z",
    "created_at": "2023-12-01T10:25:00.000Z",
    "channel": "card",
    "currency": "NGN",
    "ip_address": "197.210.71.227",
    "metadata": {
      "user_id": "60d5ecb54d3b2c001f647d8a",
      "payment_type": "registration"
    },
    "customer": {
      "id": 84312,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "customer_code": "CUS_xwaj0txjryg393b",
      "phone": "08012345678",
      "metadata": null,
      "risk_action": "default"
    },
    "authorization": {
      "authorization_code": "AUTH_72btv547",
      "bin": "408408",
      "last4": "4081",
      "exp_month": "12",
      "exp_year": "2020",
      "channel": "card",
      "card_type": "visa",
      "bank": "TEST BANK",
      "country_code": "NG",
      "brand": "visa",
      "reusable": true,
      "signature": "SIG_uSYN4fv1adlAuoduLzLn"
    }
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment verified successfully"
}
```

---

## 📝 Additional Notes

### Pagination

Most list endpoints support pagination with these query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

### Date Formats

All dates are returned in ISO 8601 format:
```
2023-12-01T10:30:00.000Z
```

### Currency

All monetary values are in Nigerian Naira (₦) represented as decimal numbers:
```json
{
  "amount": 3500.00,
  "walletBalance": 1250.50
}
```

### File Uploads

For endpoints that accept file uploads, use `multipart/form-data` content type.

### Testing

Use the following test credentials for development:

**Test User:**
- Email: `test@lpnpro.com`
- Password: `Test123!`

**Test Admin:**
- Email: `admin@lpnpro.com`
- Password: `Admin123!`

**Test Payment Gateway:**
- Use test API keys provided by Paystack/Flutterwave
- Test card numbers available in their documentation

---

**API Version**: 1.0  
**Last Updated**: December 2024  
**Maintained By**: LPN PRO Development Team