import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Landmark,
  LayoutDashboard,
  PlusCircle,
  FileText,
  Search,
  MapPin,
  Bell,
  AlertCircle,
  PhoneCall,
  User,
  Settings,
  FileCheck,
  Map,
  BarChart3,
  Building2,
  Users,
  Megaphone,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'citizen' | 'government';
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, type }) => {
  const { user, logout } = useAuth();

  const citizenNavItems = [
    { label: 'Dashboard', to: '/citizen/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Report Issue', to: '/citizen/report', icon: <PlusCircle size={18} /> },
    { label: 'My Complaints', to: '/citizen/my-complaints', icon: <FileText size={18} /> },
    { label: 'Track Status', to: '/citizen/track', icon: <Search size={18} /> },
    { label: 'Nearby Map', to: '/citizen/map', icon: <MapPin size={18} /> },
    { label: 'Notifications', to: '/citizen/notifications', icon: <Bell size={18} /> },
    { label: 'Public Notices', to: '/citizen/notices', icon: <AlertCircle size={18} /> },
    { label: 'Emergency (112)', to: '/emergency', icon: <PhoneCall size={18} /> },
    { label: 'My Profile', to: '/citizen/profile', icon: <User size={18} /> },
    { label: 'Settings', to: '/citizen/settings', icon: <Settings size={18} /> },
  ];

  const governmentNavItems = [
    { label: 'Overview & SLA', to: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Complaints Desk', to: '/admin/complaints', icon: <FileCheck size={18} /> },
    { label: 'GIS Command Map', to: '/admin/map', icon: <Map size={18} /> },
    { label: 'Civic Analytics', to: '/admin/analytics', icon: <BarChart3 size={18} /> },
    { label: 'Departments', to: '/admin/departments', icon: <Building2 size={18} /> },
    { label: 'Citizen Directory', to: '/admin/citizens', icon: <Users size={18} /> },
    { label: 'Publish Notices', to: '/admin/notices', icon: <Megaphone size={18} /> },
    { label: 'Settings', to: '/admin/settings', icon: <Settings size={18} /> },
  ];

  const navItems = type === 'citizen' ? citizenNavItems : governmentNavItems;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`} aria-label={`${type} Sidebar Navigation`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="brand-emblem" style={{ width: '2rem', height: '2rem' }}>
              <Landmark size={16} color="#f59e0b" />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                CivicConnect
              </div>
              <span className={`sidebar-role-tag ${type === 'citizen' ? 'sidebar-role-citizen' : 'sidebar-role-gov'}`}>
                {type === 'citizen' ? 'Citizen Portal' : user?.role === 'admin' ? 'Super Administrator' : 'Department Officer'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '0.25rem', color: 'var(--color-primary-200)', display: isOpen ? 'block' : 'none' }}
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer User Info & Logout */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
              <div className="user-avatar" style={{ width: '2rem', height: '2rem', fontSize: '0.75rem' }}>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} />
                ) : (
                  user?.fullName?.charAt(0) || 'U'
                )}
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.fullName || 'Guest User'}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-primary-300)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.ward || user?.departmentName || 'Civic User'}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => logout()}
            className="btn btn-outline btn-sm"
            style={{ width: '100%', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', fontSize: '0.75rem' }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
