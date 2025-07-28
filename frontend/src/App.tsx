import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/dashboard/Profile';
import BinaryTree from './pages/dashboard/BinaryTree';
import Transactions from './pages/dashboard/Transactions';
import Withdrawals from './pages/dashboard/Withdrawals';
import MonthlyVerification from './pages/dashboard/MonthlyVerification';
import Referrals from './pages/dashboard/Referrals';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import TransactionManagement from './pages/admin/TransactionManagement';
import StageManagement from './pages/admin/StageManagement';
import Reports from './pages/admin/Reports';

// Coordinator Pages
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import TeamManagement from './pages/coordinator/TeamManagement';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import AboutUs from './pages/public/AboutUs';
import Contact from './pages/public/Contact';
import PaymentCallback from './pages/PaymentCallback';

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/contact" element={<Contact />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/payment/callback" element={<PaymentCallback />} />

              {/* Protected Dashboard Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard/profile" element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard/binary-tree" element={
                <ProtectedRoute>
                  <Layout>
                    <BinaryTree />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard/transactions" element={
                <ProtectedRoute>
                  <Layout>
                    <Transactions />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard/withdrawals" element={
                <ProtectedRoute>
                  <Layout>
                    <Withdrawals />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard/verification" element={
                <ProtectedRoute>
                  <Layout>
                    <MonthlyVerification />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard/referrals" element={
                <ProtectedRoute>
                  <Layout>
                    <Referrals />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/users" element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <UserManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/transactions" element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <TransactionManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/stages" element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <StageManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/reports" element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Coordinator Routes */}
              <Route path="/coordinator" element={
                <ProtectedRoute requiredRole="coordinator">
                  <Layout>
                    <CoordinatorDashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/coordinator/teams" element={
                <ProtectedRoute requiredRole="coordinator">
                  <Layout>
                    <TeamManagement />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  style: {
                    background: '#059669',
                  },
                },
                error: {
                  duration: 5000,
                  style: {
                    background: '#DC2626',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
