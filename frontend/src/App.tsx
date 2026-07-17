import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ApprovalCenter } from './pages/ApprovalCenter';
import { TrustHistory } from './pages/TrustHistory';
import { AuditLog } from './pages/AuditLog';
import { AttackSimulator } from './pages/AttackSimulator';
import { AdminConsole } from './pages/AdminConsole';
import { Profile } from './pages/Profile';
import { Navbar } from './components/Navbar';
import { LoadingSpinner } from './components/LoadingSpinner';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner />;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/approvals"    element={<ProtectedRoute><ApprovalCenter /></ProtectedRoute>} />
      <Route path="/trust-history" element={<ProtectedRoute><TrustHistory /></ProtectedRoute>} />
      <Route path="/audit"        element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
      <Route path="/simulator"    element={<ProtectedRoute><AttackSimulator /></ProtectedRoute>} />
      <Route path="/admin"        element={<ProtectedRoute><AdminConsole /></ProtectedRoute>} />
      <Route path="/profile"      element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && <Navbar />}
      <AppRoutes />
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <Router>
      <AppContent />
    </Router>
  </AuthProvider>
);

export default App;
