import React from 'react';
import { Navigate } from 'react-router-dom';
import { getUser, isAuthenticated } from './api/auth';

export default function AdminRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (getUser()?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
