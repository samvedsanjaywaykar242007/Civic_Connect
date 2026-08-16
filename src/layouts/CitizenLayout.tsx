import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Topbar } from '../components/common/Topbar';
import { EnvironmentBanner } from '../components/common/EnvironmentBanner';

export const CitizenLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} type="citizen" />
      <div className="dashboard-main">
        <EnvironmentBanner />
        <Topbar onToggleSidebar={() => setSidebarOpen(true)} title="Citizen Grievance Portal" />
        <div style={{ flex: 1, padding: 'var(--space-6)', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};
