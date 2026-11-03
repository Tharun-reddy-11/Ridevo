import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth';

import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OwnerRegisterPage from './pages/auth/OwnerRegisterPage';
import OwnerLoginPage from './pages/auth/OwnerLoginPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';

import CustomerDashboard from './pages/customer/CustomerDashboard';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Auth Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Partner & Admin Routes (Accessed from Footer) */}
          <Route path="/owner/register" element={<OwnerRegisterPage />} />
          <Route path="/owner/login" element={<OwnerLoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Dashboards */}
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/dashboard" element={<CustomerDashboard />} />

          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner" element={<OwnerDashboard />} />

          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
