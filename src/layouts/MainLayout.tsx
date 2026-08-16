import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { EnvironmentBanner } from '../components/common/EnvironmentBanner';

export interface MainLayoutProps {
  children: React.ReactNode;
  currentRole?: 'citizen' | 'admin' | 'guest';
  onRoleSwitch?: (role: 'citizen' | 'admin') => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentRole = 'citizen',
  onRoleSwitch,
}) => {
  return (
    <div className="app-root">
      <EnvironmentBanner />
      <Navbar currentRole={currentRole} onRoleSwitch={onRoleSwitch} />
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  );
};
