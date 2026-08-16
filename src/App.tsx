import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { MainLayout } from './layouts/MainLayout';
import { CitizenLayout } from './layouts/CitizenLayout';
import { GovernmentLayout } from './layouts/GovernmentLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { UnauthorizedPage } from './pages/auth/UnauthorizedPage';
import { NotFoundPage } from './pages/common/NotFoundPage';
import { EmergencyPage } from './pages/common/EmergencyPage';

// Complete Phase 4 Citizen Pages
import { CitizenDashboard } from './pages/citizen/CitizenDashboard';
import { ReportIssueWizard } from './pages/citizen/ReportIssueWizard';
import { MyComplaintsPage } from './pages/citizen/MyComplaintsPage';
import { TrackComplaintPage } from './pages/citizen/TrackComplaintPage';
import { NearbyMapPage } from './pages/citizen/NearbyMapPage';
import { CitizenNotificationsPage } from './pages/citizen/CitizenNotificationsPage';
import { CitizenNoticesPage } from './pages/citizen/CitizenNoticesPage';
import { CitizenProfilePage } from './pages/citizen/CitizenProfilePage';
import { CitizenSettingsPage } from './pages/citizen/CitizenSettingsPage';

// Complete Phase 5 Government Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { MasterGrievanceRegistry } from './pages/admin/MasterGrievanceRegistry';
import { GrievanceDetailsWorkflowPage } from './pages/admin/GrievanceDetailsWorkflowPage';
import { DepartmentManagementPage } from './pages/admin/DepartmentManagementPage';
import { GISCommandMapPage } from './pages/admin/GISCommandMapPage';
import { NoticePublisherPage } from './pages/admin/NoticePublisherPage';
import { CivicAnalyticsPage } from './pages/admin/CivicAnalyticsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <MainLayout>
                  <LandingPage />
                </MainLayout>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />

            {/* Citizen Protected Routes */}
            <Route
              path="/citizen"
              element={
                <ProtectedRoute allowedRoles={['citizen']}>
                  <CitizenLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/citizen/dashboard" replace />} />
              <Route path="dashboard" element={<CitizenDashboard />} />
              <Route path="report" element={<ReportIssueWizard />} />
              <Route path="my-complaints" element={<MyComplaintsPage />} />
              <Route path="track" element={<TrackComplaintPage />} />
              <Route path="map" element={<NearbyMapPage />} />
              <Route path="notifications" element={<CitizenNotificationsPage />} />
              <Route path="notices" element={<CitizenNoticesPage />} />
              <Route path="profile" element={<CitizenProfilePage />} />
              <Route path="settings" element={<CitizenSettingsPage />} />
            </Route>

            {/* Government Protected Routes (Admin & Officer) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer']}>
                  <GovernmentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="complaints" element={<MasterGrievanceRegistry />} />
              <Route path="complaints/:id" element={<GrievanceDetailsWorkflowPage />} />
              <Route path="map" element={<GISCommandMapPage />} />
              <Route path="analytics" element={<CivicAnalyticsPage />} />
              <Route path="departments" element={<DepartmentManagementPage />} />
              <Route path="notices" element={<NoticePublisherPage />} />
              <Route path="settings" element={<CivicAnalyticsPage />} />
            </Route>

            {/* Officer Alias Route */}
            <Route
              path="/officer"
              element={
                <ProtectedRoute allowedRoles={['officer', 'admin']}>
                  <GovernmentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
