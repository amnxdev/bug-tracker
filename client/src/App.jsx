import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import OAuthCallback from './pages/OAuthCallback';
import Admin from './pages/Admin';
import ErrorBanner from './components/ErrorBanner';
import { AuthProvider, useAuth } from './context/AuthContext';

// Security Guard: Checks if user has a valid token and user session
const ProtectedRoute = ({ children }) => {
  const { token, user } = useAuth();
  if (!token || !user) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin Guard: Non-admin visiting /admin is redirected to /
const AdminRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <>
      <ErrorBanner />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* OAuth callback — reads token from URL hash */}
        <Route path="/oauth-callback" element={<OAuthCallback />} />

        {/* Protected Routes */}
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <ProjectDetails />
            </ProtectedRoute>
          }
        />

        {/* Admin Route — non-admin redirected to / */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <Admin />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        {/* Root and Default Redirect */}
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
