
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useIsMobile } from '@/hooks/use-mobile';

type LayoutProps = {
  children: React.ReactNode;
  openAddReadingModal?: () => void;
};

const Layout = ({ children, openAddReadingModal }: LayoutProps) => {
  const isMobile = useIsMobile();
  const [sidebarVisible, setSidebarVisible] = useState(!isMobile);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="flex h-screen bg-background">
      {sidebarVisible && <Sidebar />}
      
      <div className="flex-1 flex flex-col min-h-screen ml-0 md:ml-64">
        <Header 
          toggleSidebar={toggleSidebar} 
          openAddReadingModal={openAddReadingModal} 
        />
        <main className="flex-1 p-4 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
