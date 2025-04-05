
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const AuthLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coolant-400"></div>
      </div>
    );
  }

  // If user is already authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  // Display the auth pages
  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <Outlet />
        </div>
      </div>
      <div className="hidden lg:flex lg:w-1/2 bg-coolant-500">
        <div className="flex flex-col justify-center items-center w-full p-12 text-white">
          <h1 className="text-4xl font-bold mb-6">Coolant Management System</h1>
          <p className="text-xl text-center">
            Manage your manufacturing coolant systems efficiently
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
