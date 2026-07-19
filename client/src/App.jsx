import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Unauthorized from './pages/Unauthorized';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import Stock from './pages/Stock';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Users from './pages/Users';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <ToastProvider>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected dashboard layout wrapper */}
            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              
              {/* Restricted access paths */}
              <Route path="suppliers" element={
                <PrivateRoute allowedRoles={['Admin', 'Manager']}>
                  <Suppliers />
                </PrivateRoute>
              } />
              
              <Route path="stock" element={<Stock />} />
              <Route path="reports" element={<Reports />} />
              <Route path="profile" element={<Profile />} />
              
              <Route path="settings" element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <Settings />
                </PrivateRoute>
              } />
              
              <Route path="users" element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <Users />
                </PrivateRoute>
              } />
            </Route>

            {/* Catch-all 404 page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ToastProvider>
  );
}

export default App;
