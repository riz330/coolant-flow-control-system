
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-coolant-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coolant-400 mx-auto"></div>
          <p className="mt-4 text-coolant-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export default Index;
