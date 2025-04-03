
import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-coolant-50 p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="flex justify-center">
            <AlertCircle className="h-24 w-24 text-coolant-400" />
          </div>
          <h1 className="text-6xl font-bold text-coolant-800 mt-4">404</h1>
          <p className="text-xl text-coolant-600 mt-2">Page Not Found</p>
          <p className="text-coolant-500 mt-4">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <Button asChild className="bg-coolant-400 hover:bg-coolant-500">
          <Link to="/" className="inline-flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
