'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          title={title}
          onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
}