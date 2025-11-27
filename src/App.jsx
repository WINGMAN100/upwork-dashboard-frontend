import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GenerateProposal from './pages/GenerateProposal';
import JobSearch from './pages/JobSearch';
import Config from './pages/Config'; // <--- 1. Import Config Page
import { apiService } from './services/api';

const ProtectedRoute = ({ children }) => {
  // Check authentication status
  if (!apiService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};
const AdminRoute = ({ children }) => {
  if (!apiService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  const role = apiService.getRole();
  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Protected Generator Page */}
        <Route 
          path="/generate" 
          element={
            <ProtectedRoute>
              <GenerateProposal />
            </ProtectedRoute>
          } 
        />

        {/* Protected Job Search Page */}
        <Route 
          path="/search" 
          element={
            <ProtectedRoute>
              <JobSearch />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/config" 
          element={
            <AdminRoute>
              <Config />
            </AdminRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;