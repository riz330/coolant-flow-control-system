
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Briefcase, 
  Settings, 
  FileText, 
  User, 
  LogOut,
  Box
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const menuItems = [
    { 
      name: 'Home', 
      path: '/dashboard', 
      icon: Home, 
      visible: true 
    },
    { 
      name: 'Distributor Management', 
      path: '/distributors', 
      icon: Briefcase,
      visible: ['admin', 'manufacturer'].includes(user?.role || '') 
    },
    { 
      name: 'Employee Management', 
      path: '/employees', 
      icon: Users,
      visible: !['client'].includes(user?.role || '') 
    },
    { 
      name: 'Client Management', 
      path: '/clients', 
      icon: Users,
      visible: true 
    },
    { 
      name: 'Machine Management', 
      path: '/machines', 
      icon: Box,
      visible: !['client'].includes(user?.role || '') 
    },
    { 
      name: 'Reports', 
      path: '/reports', 
      icon: FileText,
      visible: !['client'].includes(user?.role || '') 
    },
    { 
      name: 'User Profile', 
      path: '/profile', 
      icon: User,
      visible: true 
    },
  ];

  const filteredMenuItems = menuItems.filter(item => item.visible);

  return (
    <div className="h-screen w-64 fixed bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-coolant-400">Coolant Manager</h1>
      </div>
      <nav className="p-4 space-y-1">
        {filteredMenuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive 
                ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
        <button 
          onClick={logout} 
          className="flex items-center space-x-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
