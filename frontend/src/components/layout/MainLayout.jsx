
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
  '/dashboard': 'Seller Overview',
  '/business': 'Business Profile',
  '/products': 'Product Catalog Management',
  '/documents': 'Document Center & OCR Extraction',
  '/ai-analysis': 'AI Product Image Analysis',
  '/bulk-catalog': 'Bulk Catalog Upload',
  '/compliance': 'ONDC Compliance Validation',
  '/ondc': 'ONDC Network Readiness & Integration',
  '/reports': 'Audit Logs & Readiness Reports',
  '/settings': 'Account & Gateway Settings',
};

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentTitle =
    pageTitles[location.pathname] || 'ONDC Auto Onboarder';

  return (
    <div className="min-h-screen flex bg-[#F5F6F3]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col lg:pl-72">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={currentTitle}
        />

        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
