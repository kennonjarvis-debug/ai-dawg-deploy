import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './ui/components';
import { LandingPage } from './pages/LandingPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProjectListPage } from './ui/ProjectListPage';
import { DAWDashboard } from './ui/DAWDashboard';
import { BillingPage } from './pages/BillingPage';
import { PricingPage } from './pages/PricingPage';
import { FreestylePage } from './pages/FreestylePage';
import { LiveStudioPage } from './pages/LiveStudioPage';
import { LiveDemoPage } from './pages/LiveDemoPage';
import { AgentDashboard } from './agent-dashboard';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { DashboardOverview } from './pages/dashboard/DashboardOverview';
import { InsightsPage } from './pages/dashboard/InsightsPage';
import { RevenuePage } from './pages/dashboard/RevenuePage';
import { UsagePage } from './pages/dashboard/UsagePage';
import { AnalyticsPage } from './pages/dashboard/AnalyticsPage';
import { IMessageDashboard } from './components/imessage/iMessageDashboard';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/demo" element={<LiveDemoPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <ProjectListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:projectId"
              element={
                <ProtectedRoute>
                  <DAWDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/freestyle/:projectId"
              element={
                <ProtectedRoute>
                  <FreestylePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/studio"
              element={
                <ProtectedRoute>
                  <LiveStudioPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/billing"
              element={
                <ProtectedRoute>
                  <BillingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <BillingPage />
                </ProtectedRoute>
              }
            />

            {/* Agent Terminal Dashboard */}
            <Route
              path="/agents"
              element={
                <ProtectedRoute>
                  <AgentDashboard />
                </ProtectedRoute>
              }
            />

            {/* iMessage Dashboard */}
            <Route path="/imessage" element={<IMessageDashboard />} />

            {/* Business Analytics Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardOverview />} />
              <Route path="insights" element={<InsightsPage />} />
              <Route path="revenue" element={<RevenuePage />} />
              <Route path="usage" element={<UsagePage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
            </Route>

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
