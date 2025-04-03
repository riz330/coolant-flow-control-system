
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export type UserRole = 'admin' | 'manufacturer' | 'manager' | 'distributor' | 'employee' | 'client';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  designation?: string;
  companyName?: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if there's a stored token on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // In a real app, you would validate this token with your server
          // For now, we'll just parse the stored user data
          const userData = localStorage.getItem('user');
          if (userData) {
            setUser(JSON.parse(userData));
          } else {
            // If we have a token but no user data, something's wrong - log out
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Auth error:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // For the demo, we're mocking the API calls
  // In a real application, these would make actual API requests to your Flask backend
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Mock response - in a real app, this would be an API call
      // Simulating different users based on email prefix
      const emailPrefix = email.split('@')[0];
      let role: UserRole = 'employee'; // Default role
      
      if (emailPrefix.includes('admin')) {
        role = 'admin';
      } else if (emailPrefix.includes('manufacturer')) {
        role = 'manufacturer';
      } else if (emailPrefix.includes('manager')) {
        role = 'manager';
      } else if (emailPrefix.includes('distributor')) {
        role = 'distributor';
      } else if (emailPrefix.includes('client')) {
        role = 'client';
      }
      
      const mockUser: User = {
        id: 1,
        fullName: emailPrefix.split('.').map(part => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' '),
        email,
        role,
        designation: 'Sample Designation',
        companyName: 'Coolant Systems Inc.',
      };
      
      // Mock token - in a real app, this would come from your server
      const mockToken = `mock-jwt-token-${Date.now()}`;
      
      // Store the token and user data
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      setUser(mockUser);
      
      // Show welcome toast
      toast.success(`Welcome ${mockUser.fullName}!`, {
        duration: 3000,
        position: 'top-center',
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please check your credentials.', {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    toast.info('You have been logged out.', {
      duration: 3000,
    });
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    try {
      // In a real app, this would make an API call to send a reset email
      // For now, we'll just simulate success
      
      toast.success(`Password reset link sent to ${email}`, {
        duration: 5000,
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Failed to send reset email. Please try again.', {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setLoading(true);
    try {
      // In a real app, this would make an API call to reset the password
      // For now, we'll just simulate success
      
      toast.success('Password has been reset successfully. Please log in.', {
        duration: 5000,
      });
      navigate('/login');
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Failed to reset password. Please try again.', {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, forgotPassword, resetPassword, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
