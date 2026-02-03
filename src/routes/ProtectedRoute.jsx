import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const auth = localStorage.getItem('isLoggedIn') === 'true';

  return auth ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;