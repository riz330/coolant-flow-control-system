
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, 
  User, 
  Users, 
  Store, 
  LogOut, 
  Settings,
  UserCircle 
} from 'lucide-react';

const SideNavigation = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // Determine if a link is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="h-full w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <h1 className="text-xl font-bold">Coolant Management</h1>
      </div>
      
      <div className="px-4 py-6 flex-1">
        <nav className="space-y-1">
          <Link
            to="/dashboard"
            className={`flex items-center px-4 py-3 text-sm rounded-md ${
              isActive('/dashboard')
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Home className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          
          <Link
            to="/profile"
            className={`flex items-center px-4 py-3 text-sm rounded-md ${
              isActive('/profile')
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <UserCircle className="mr-3 h-5 w-5" />
            My Profile
          </Link>
          
          {/* Only show Clients management to specific roles */}
          {user?.role && ['admin', 'distributor', 'manager'].includes(user.role) && (
            <Link
              to="/clients"
              className={`flex items-center px-4 py-3 text-sm rounded-md ${
                isActive('/clients')
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <User className="mr-3 h-5 w-5" />
              Client Management
            </Link>
          )}
          
          {/* Only show Distributors management to specific roles */}
          {user?.role && ['admin', 'manager', 'manufacturer'].includes(user.role) && (
            <Link
              to="/distributors"
              className={`flex items-center px-4 py-3 text-sm rounded-md ${
                isActive('/distributors')
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Store className="mr-3 h-5 w-5" />
              Distributor Management
            </Link>
          )}
          
          {/* Add Employee Management link */}
          <Link
            to="/employees"
            className={`flex items-center px-4 py-3 text-sm rounded-md ${
              isActive('/employees')
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Users className="mr-3 h-5 w-5" />
            Employee Management
          </Link>
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center px-4 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-800 hover:text-white w-full"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default SideNavigation;
