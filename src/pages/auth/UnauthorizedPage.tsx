import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loginWithDemo } = useAuth();

  const userRole = (location.state as { userRole?: string })?.userRole || user?.role || 'unknown';

  return (
    <div className="auth-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="auth-card" style={{ textAlign: 'center', maxWidth: '520px' }}>
        <div
          style={{
            width: '4rem',
            height: '4rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-danger-50)',
            color: 'var(--color-danger-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
          }}
        >
          <ShieldAlert size={36} />
        </div>

        <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: '0.5rem', color: 'var(--color-danger-700)' }}>
          Access Restricted
        </h1>

        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          You do not have the required administrative or departmental credentials to access this section. Your current active role is: <strong>{userRole.toUpperCase()}</strong>.
        </p>

        <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: 'var(--font-size-xs)', textAlign: 'left' }}>
          <strong>Required permissions:</strong>
          <ul style={{ marginTop: '0.25rem', paddingLeft: '1.25rem', listStyle: 'disc' }}>
            <li>Government Administration Desk requires <code>officer</code> or <code>admin</code> role.</li>
            <li>Citizens can only access the Citizen Grievance Portal.</li>
          </ul>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              if (user?.role === 'citizen') {
                navigate('/citizen/dashboard');
              } else {
                navigate('/admin/dashboard');
              }
            }}
            leftIcon={<ArrowLeft size={16} />}
          >
            Return to My Authorized Dashboard
          </Button>

          <Button
            variant="outline"
            fullWidth
            onClick={async () => {
              await loginWithDemo('admin');
              navigate('/admin/dashboard');
            }}
          >
            Switch to Demo Administrator Account
          </Button>

          <Button variant="ghost" fullWidth onClick={() => navigate('/login')} leftIcon={<LogIn size={16} />}>
            Sign In with Different Account
          </Button>
        </div>
      </div>
    </div>
  );
};
