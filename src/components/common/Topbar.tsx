import React, { useState } from 'react';
import { Menu, Shield, UserCheck, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { UserRole } from '../../types';

export interface TopbarProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar, title }) => {
  const { user, role, loginWithDemo } = useAuth();
  const { info } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSwitchDemoRole = async (targetRole: UserRole, departmentId?: string) => {
    setDropdownOpen(false);
    await loginWithDemo(targetRole, departmentId);
    info(
      `Role Switched to ${targetRole.toUpperCase()}`,
      `Active account: ${targetRole === 'admin' ? 'Dr. Aditi Kulkarni (Commissioner)' : targetRole === 'officer' ? 'Er. Vikram Joshi (PWD)' : 'Ramesh Patil (Citizen)'}`
    );
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: '0.4rem', color: 'var(--text-secondary)' }}
          onClick={onToggleSidebar}
          aria-label="Open sidebar navigation"
        >
          <Menu size={20} />
        </button>

        {title && (
          <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {title}
          </div>
        )}
      </div>

      <div className="topbar-right">
        {/* Demo Fast Role Switcher for presentations */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ fontSize: '0.75rem', gap: '0.35rem', borderColor: 'var(--border-default)' }}
            aria-expanded={dropdownOpen}
          >
            <Shield size={14} color="var(--color-primary-600)" />
            <span>Switch Role: <strong>{role?.toUpperCase() || 'CITIZEN'}</strong></span>
            <ChevronDown size={13} />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                width: '240px',
                zIndex: 100,
                padding: '0.5rem',
              }}
            >
              <div style={{ padding: '0.35rem 0.5rem', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                One-Click Demo Roles
              </div>

              <button
                type="button"
                onClick={() => handleSwitchDemoRole('citizen')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.65rem',
                  fontSize: 'var(--font-size-xs)',
                  borderRadius: 'var(--radius-sm)',
                  background: role === 'citizen' ? 'var(--color-primary-50)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Ramesh Patil</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Citizen (Khed Panchayat)</div>
                </div>
                {role === 'citizen' && <Check size={14} color="var(--color-primary-600)" />}
              </button>

              <button
                type="button"
                onClick={() => handleSwitchDemoRole('officer', 'pwd')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.65rem',
                  fontSize: 'var(--font-size-xs)',
                  borderRadius: 'var(--radius-sm)',
                  background: role === 'officer' ? 'var(--color-primary-50)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Er. Vikram Joshi</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Officer (PWD Roads)</div>
                </div>
                {role === 'officer' && <Check size={14} color="var(--color-primary-600)" />}
              </button>

              <button
                type="button"
                onClick={() => handleSwitchDemoRole('admin')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.65rem',
                  fontSize: 'var(--font-size-xs)',
                  borderRadius: 'var(--radius-sm)',
                  background: role === 'admin' ? 'var(--color-primary-50)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Dr. Aditi Kulkarni</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Super Admin (Commissioner)</div>
                </div>
                {role === 'admin' && <Check size={14} color="var(--color-primary-600)" />}
              </button>
            </div>
          )}
        </div>

        {/* User Identity Chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="user-avatar">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName} /> : <UserCheck size={16} />}
          </div>
          <div style={{ display: 'none' }} className="d-md-block">
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.fullName}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
