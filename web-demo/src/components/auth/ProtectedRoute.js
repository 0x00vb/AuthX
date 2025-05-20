import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { Spinner } from 'react-bootstrap';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, loading, hasRole } = useContext(AuthContext);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If role is required but user doesn't have it, show access denied
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <h4>Access Denied</h4>
          <p>You don't have the necessary permissions to access this page.</p>
          <p>Required role: <strong>{requiredRole}</strong></p>
        </div>
      </div>
    );
  }

  // If authenticated and has required role (or no role required), render children
  return children;
};

export default ProtectedRoute; 