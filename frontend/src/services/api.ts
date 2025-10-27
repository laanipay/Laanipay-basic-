import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ProfileResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  ApiResponse,
  Transaction,
  BinaryTreeNode,
  WithdrawalRequest,
  VerificationRequest,
  DashboardStats,
} from '../types/auth';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Token expired or invalid
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      toast.error('Access denied. You do not have permission to perform this action.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    } else if (!error.response) {
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// Generic API request function
const apiRequest = async <T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await apiClient.request<T>({
      method,
      url,
      data,
      ...config,
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// Authentication API
export const authAPI = {
  // Login
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const data: LoginRequest = { email, password };
    return apiRequest<LoginResponse>('POST', '/auth/login', data);
  },

  // Register
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    return apiRequest<RegisterResponse>('POST', '/auth/register', userData);
  },

  // Get current user profile
  getProfile: async (): Promise<ProfileResponse> => {
    return apiRequest<ProfileResponse>('GET', '/auth/me');
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const data: RefreshTokenRequest = { refreshToken };
    return apiRequest<RefreshTokenResponse>('POST', '/auth/refresh', data);
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<ApiResponse> => {
    const data: ForgotPasswordRequest = { email };
    return apiRequest<ApiResponse>('POST', '/auth/forgot-password', data);
  },

  // Reset password
  resetPassword: async (token: string, password: string): Promise<ApiResponse> => {
    const data: ResetPasswordRequest = { token, password };
    return apiRequest<ApiResponse>('POST', '/auth/reset-password', data);
  },

  // Verify email
  verifyEmail: async (token: string): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('GET', `/auth/verify-email?token=${token}`);
  },

  // Logout
  logout: async (): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('POST', '/auth/logout');
  },

  // Setup interceptors for token refresh
  setupInterceptors: (refreshTokenFn: () => Promise<void>, logoutFn: () => void) => {
    let isRefreshing = false;
    let failedQueue: Array<{
      resolve: (value?: any) => void;
      reject: (reason?: any) => void;
    }> = [];

    const processQueue = (error: any, token: string | null = null) => {
      failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
          reject(error);
        } else {
          resolve(token);
        }
      });
      
      failedQueue = [];
    };

    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then(() => {
              return apiClient(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            await refreshTokenFn();
            processQueue(null);
            return apiClient(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            logoutFn();
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );

    // Return cleanup function
    return () => {
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  },
};

// User API
export const userAPI = {
  // Update profile
  updateProfile: async (userData: Partial<any>): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('PUT', '/users/profile', userData);
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('POST', '/users/change-password', {
      currentPassword,
      newPassword,
    });
  },

  // Change withdrawal PIN
  changeWithdrawalPin: async (currentPin: string, newPin: string): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('POST', '/users/change-withdrawal-pin', {
      currentPin,
      newPin,
    });
  },

  // Get user statistics
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    return apiRequest<ApiResponse<DashboardStats>>('GET', '/users/stats');
  },
};

// Binary Tree API
export const binaryAPI = {
  // Get binary tree
  getTree: async (depth: number = 5): Promise<ApiResponse<BinaryTreeNode>> => {
    return apiRequest<ApiResponse<BinaryTreeNode>>('GET', `/binary/tree?depth=${depth}`);
  },

  // Get downline users
  getDownline: async (page: number = 1, limit: number = 20): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('GET', `/binary/downline?page=${page}&limit=${limit}`);
  },

  // Get binary tree path
  getPath: async (targetUserId: string): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('GET', `/binary/path/${targetUserId}`);
  },
};

// Transaction API
export const transactionAPI = {
  // Get transactions
  getTransactions: async (page: number = 1, limit: number = 20, type?: string): Promise<ApiResponse<{ transactions: Transaction[]; total: number; page: number; totalPages: number }>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (type) {
      params.append('type', type);
    }
    
    return apiRequest<ApiResponse<{ transactions: Transaction[]; total: number; page: number; totalPages: number }>>('GET', `/transactions?${params}`);
  },

  // Get transaction by ID
  getTransaction: async (transactionId: string): Promise<ApiResponse<Transaction>> => {
    return apiRequest<ApiResponse<Transaction>>('GET', `/transactions/${transactionId}`);
  },
};

// Payment API
export const paymentAPI = {
  // Initialize payment
  initializePayment: async (amount: number, type: string, metadata?: any): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('POST', '/payments/initialize', {
      amount,
      type,
      metadata,
    });
  },

  // Verify payment
  verifyPayment: async (reference: string): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('POST', '/payments/verify', { reference });
  },

  // Get payment methods
  getPaymentMethods: async (): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('GET', '/payments/methods');
  },
};

// Withdrawal API
export const withdrawalAPI = {
  // Request withdrawal
  requestWithdrawal: async (withdrawalData: WithdrawalRequest): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('POST', '/withdrawals/request', withdrawalData);
  },

  // Get withdrawals
  getWithdrawals: async (page: number = 1, limit: number = 20): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('GET', `/withdrawals?page=${page}&limit=${limit}`);
  },

  // Get withdrawal by ID
  getWithdrawal: async (withdrawalId: string): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('GET', `/withdrawals/${withdrawalId}`);
  },

  // Cancel withdrawal
  cancelWithdrawal: async (withdrawalId: string): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('POST', `/withdrawals/${withdrawalId}/cancel`);
  },
};

// Verification API
export const verificationAPI = {
  // Submit monthly verification
  submitVerification: async (verificationData: VerificationRequest): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('POST', '/verification/monthly', verificationData);
  },

  // Get verification status
  getVerificationStatus: async (): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('GET', '/verification/status');
  },

  // Get verification history
  getVerificationHistory: async (page: number = 1, limit: number = 20): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('GET', `/verification/history?page=${page}&limit=${limit}`);
  },
};

// Referral API
export const referralAPI = {
  // Get referrals
  getReferrals: async (page: number = 1, limit: number = 20): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('GET', `/referrals?page=${page}&limit=${limit}`);
  },

  // Get referral statistics
  getReferralStats: async (): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('GET', '/referrals/stats');
  },

  // Generate new referral code
  generateReferralCode: async (): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('POST', '/referrals/generate-code');
  },
};

// Admin API
export const adminAPI = {
  // Get dashboard stats
  getDashboardStats: async (): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('GET', '/admin/stats');
  },

  // Get all users
  getUsers: async (page: number = 1, limit: number = 20, search?: string, role?: string): Promise<ApiResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    
    return apiRequest<ApiResponse>('GET', `/admin/users?${params}`);
  },

  // Get user by ID
  getUser: async (userId: string): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('GET', `/admin/users/${userId}`);
  },

  // Update user
  updateUser: async (userId: string, userData: any): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('PUT', `/admin/users/${userId}`, userData);
  },

  // Block/unblock user
  toggleUserBlock: async (userId: string, reason?: string): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('POST', `/admin/users/${userId}/toggle-block`, { reason });
  },

  // Get all transactions
  getAllTransactions: async (page: number = 1, limit: number = 20, filters?: any): Promise<ApiResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
    }
    
    return apiRequest<ApiResponse>('GET', `/admin/transactions?${params}`);
  },

  // Approve withdrawal
  approveWithdrawal: async (withdrawalId: string, adminNotes?: string): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('POST', `/admin/withdrawals/${withdrawalId}/approve`, { adminNotes });
  },

  // Reject withdrawal
  rejectWithdrawal: async (withdrawalId: string, reason: string): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('POST', `/admin/withdrawals/${withdrawalId}/reject`, { reason });
  },

  // Generate reports
  generateReport: async (reportType: string, dateRange: { startDate: string; endDate: string }): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('POST', '/admin/reports/generate', {
      reportType,
      ...dateRange,
    });
  },
};

// Coordinator API
export const coordinatorAPI = {
  // Get team stats
  getTeamStats: async (): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('GET', '/coordinator/stats');
  },

  // Get team members
  getTeamMembers: async (page: number = 1, limit: number = 20): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('GET', `/coordinator/team?page=${page}&limit=${limit}`);
  },

  // Assist with verification
  assistVerification: async (userId: string, notes?: string): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('POST', `/coordinator/assist-verification/${userId}`, { notes });
  },
};

// Export default API client for custom requests
export default apiClient;