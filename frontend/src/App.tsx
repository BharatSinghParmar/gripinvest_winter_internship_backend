import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { Layout } from './components/layout/Layout'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProductsPage } from './pages/ProductsPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { InvestmentsPage } from './pages/InvestmentsPage'
import { PortfolioPage } from './pages/PortfolioPage'
import { ProfilePage } from './pages/ProfilePage'
import { TransactionLogsPage } from './pages/admin/TransactionLogsPage'
import { AdminProductsPage } from './pages/admin/AdminProductsPage'
import { PerformanceAnalyticsPage } from './pages/admin/PerformanceAnalyticsPage'
import { AuditTrailPage } from './pages/admin/AuditTrailPage'
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/security/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/security/reset-password" element={<ResetPasswordPage />} />
        
        {/* Protected Routes */}
        <Route path="/app" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="instruments" element={<ProductsPage />} />
          <Route path="instruments/:id" element={<ProductDetailPage />} />
          <Route path="wealth" element={<InvestmentsPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="profile" element={<ProfilePage />} />
          
          {/* Admin Routes */}
          <Route path="admin/logs" element={
            <ProtectedRoute requireAdmin>
              <TransactionLogsPage />
            </ProtectedRoute>
          } />
          <Route path="admin/products" element={
            <ProtectedRoute requireAdmin>
              <AdminProductsPage />
            </ProtectedRoute>
          } />
          <Route path="admin/analytics" element={
            <ProtectedRoute requireAdmin>
              <PerformanceAnalyticsPage />
            </ProtectedRoute>
          } />
          <Route path="admin/audit" element={
            <ProtectedRoute requireAdmin>
              <AuditTrailPage />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
