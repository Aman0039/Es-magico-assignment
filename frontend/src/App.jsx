import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute, PublicRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ExecutionPlannerPage } from './pages/ExecutionPlannerPage';
import { SimulationPage } from './pages/SimulationPage';
import { InvitePage } from './pages/InvitePage';
import { ActivityPage } from './pages/ActivityPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

import { useApp } from './context/AppContext';

const ThemeInit = ({ children }) => {
  const { theme } = useApp();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <ToastProvider>
            <ThemeInit>
              <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/invite/:token" element={<InvitePage />} />

                {/* Auth routes (redirect if logged in) */}
                <Route element={<PublicRoute />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                </Route>

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/projects" element={<ProjectsPage />} />
                    <Route path="/projects/:id" element={<ProjectDetailPage />} />
                    <Route path="/projects/:id/execution" element={<ExecutionPlannerPage />} />
                    <Route path="/projects/:id/simulate" element={<SimulationPage />} />
                    <Route path="/activity" element={<ActivityPage />} />
                    {/* <Route path="/settings" element={<SettingsPage />} /> */}
                    <Route path="/profile" element={<ProfilePage />} />
                  </Route>
                </Route>

                {/* Fallbacks */}
                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ThemeInit>
          </ToastProvider>
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
