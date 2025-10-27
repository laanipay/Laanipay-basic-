import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { User, AuthTokens } from '../types/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  withdrawalPin: string;
  referralCode?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const response = await authAPI.login(email, password);
      
      if (response.success) {
        const { user: userData, tokens } = response.data;
        
        // Store tokens in localStorage
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        
        // Set user state
        setUser(userData);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<void> => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      
      if (response.success) {
        const { user: newUser, tokens } = response.data;
        
        // Store tokens in localStorage
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        
        // Set user state
        setUser(newUser);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    try {
      // Call logout API (optional, for logging purposes)
      authAPI.logout().catch(console.error);
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Clear user state
      setUser(null);
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<void> => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await authAPI.refreshToken(refreshTokenValue);
      
      if (response.success) {
        const { tokens } = response.data;
        
        // Update tokens in localStorage
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        
        return;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout the user
      logout();
      throw error;
    }
  };

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        
        if (!accessToken) {
          setLoading(false);
          return;
        }

        // Verify token and get user data
        const response = await authAPI.getProfile();
        
        if (response.success) {
          setUser(response.data.user);
        } else {
          // Token is invalid, try to refresh
          await refreshToken();
          
          // Retry getting profile
          const retryResponse = await authAPI.getProfile();
          if (retryResponse.success) {
            setUser(retryResponse.data.user);
          } else {
            throw new Error('Failed to get user profile');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Axios interceptor for automatic token refresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Setup response interceptor for handling token expiration
      const interceptor = authAPI.setupInterceptors(refreshToken, logout);
      
      // Cleanup
      return () => {
        if (interceptor) {
          interceptor();
        }
      };
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};