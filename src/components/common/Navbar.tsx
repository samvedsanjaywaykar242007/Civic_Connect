import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Landmark, PlusCircle, LogIn, LayoutDashboard, PhoneCall } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../../contexts/AuthContext';

export interface NavbarProps {
  currentRole?: 'citizen' | 'admin' | 'guest';
  onRoleSwitch?: (role: 'citizen' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-inner">
          {/* Brand Identity */}
          <Link to="/" className="brand-logo" aria-label="CivicConnect Home">
            <div className="brand-emblem" aria-hidden="true">
              <Landmark size={20} color="#f59e0b" />
            </div>
            <div>
              <div className="brand-title">CivicConnect</div>
              <div className="brand-subtitle">Public Grievance &amp; Resolution Portal</div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="nav-links" aria-label="Main Navigation">
            <Link to="/#categories-section" className="nav-link">
              Civic Categories
            </Link>
            <Link to="/emergency" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <PhoneCall size={14} color="var(--color-accent-400)" />
              <span>Emergency (112)</span>
            </Link>
            {isAuthenticated && user?.role === 'citizen' && (
              <Link to="/citizen/dashboard" className="nav-link">
                Citizen Portal
              </Link>
            )}
            {isAuthenticated && (user?.role === 'admin' || user?.role === 'officer') && (
              <Link to="/admin/dashboard" className="nav-link">
                Admin Control Desk
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="nav-actions">
            {isAuthenticated ? (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<LayoutDashboard size={15} />}
                onClick={() => {
                  if (user?.role === 'citizen') {
                    navigate('/citizen/dashboard');
                  } else {
                    navigate('/admin/dashboard');
                  }
                }}
              >
                Go to Workspace ({user?.role.toUpperCase()})
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                style={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                leftIcon={<LogIn size={15} />}
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<PlusCircle size={15} />}
              onClick={() => {
                if (isAuthenticated && user?.role === 'citizen') {
                  navigate('/citizen/report');
                } else {
                  navigate('/login?redirect=/citizen/report');
                }
              }}
            >
              Report Grievance
            </Button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '0.5rem', display: 'flex', color: 'var(--color-white)' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav
            style={{
              padding: '1rem 0',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
            aria-label="Mobile Navigation"
          >
            <Link
              to="/emergency"
              className="nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Emergency Helplines (112)
            </Link>
            {isAuthenticated ? (
              <Link
                to={user?.role === 'citizen' ? '/citizen/dashboard' : '/admin/dashboard'}
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Go to {user?.role === 'citizen' ? 'Citizen' : 'Admin'} Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In / Register
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
