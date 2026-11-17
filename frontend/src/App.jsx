
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute';
import MainLayout from './components/layout/MainLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BusinessProfilePage from './pages/BusinessProfilePage';
import ProductCatalogPage from './pages/ProductCatalogPage';
import DocumentUploadPage from './pages/DocumentUploadPage';
import AIAnalysisPage from './pages/AIAnalysisPage';
import BulkCatalogPage from './pages/BulkCatalogPage';
import CompliancePage from './pages/CompliancePage';
import OndcPage from './pages/OndcPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentication Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/business" element={<BusinessProfilePage />} />
              <Route path="/products" element={<ProductCatalogPage />} />
              <Route path="/documents" element={<DocumentUploadPage />} />
              <Route path="/ai-analysis" element={<AIAnalysisPage />} />
              <Route path="/bulk-catalog" element={<BulkCatalogPage />} />
              <Route path="/compliance" element={<CompliancePage />} />
              <Route path="/ondc" element={<OndcPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
