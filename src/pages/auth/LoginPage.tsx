import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Landmark, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithDemo, error, clearError } = useAuth();
  const { success } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '';

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();
    try {
      const user = await login(email, password);
      success(`Welcome back, ${user.fullName}!`, `Logged in as ${user.role.toUpperCase()}`);
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
      } else if (user.role === 'citizen') {
        navigate('/citizen/dashboard', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (role: UserRole, departmentId?: string) => {
    setIsSubmitting(true);
    clearError();
    try {
      const user = await loginWithDemo(role, departmentId);
      success(`Demo Login Successful: ${user.fullName}`, `Role: ${user.role.toUpperCase()}`);
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
      } else if (user.role === 'citizen') {
        navigate('/citizen/dashboard', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="brand-emblem" style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem auto' }}>
            <Landmark size={24} color="#f59e0b" />
          </div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            CivicConnect
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Sign in to your Citizen or Municipal Account
          </p>
        </div>

        {/* Standard Login Form */}
        <form onSubmit={handleStandardLogin}>
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. citizen@example.com or officer@civicconnect.gov.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            helperText="For demo accounts, any password is valid."
          />

          {error && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--color-danger-50)',
                color: 'var(--color-danger-700)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
                marginBottom: '1rem',
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting} leftIcon={<LogIn size={16} />}>
            Sign In to Portal
          </Button>
        </form>

        {/* Demo Fast Login Section */}
        <div style={{ margin: '1.75rem 0 1.25rem 0', textAlign: 'center', position: 'relative' }}>
          <div style={{ borderTop: '1px solid var(--border-subtle)' }} />
          <span
            style={{
              position: 'relative',
              top: '-10px',
              backgroundColor: 'var(--bg-surface)',
              padding: '0 0.75rem',
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Or Instant Presentation Demo Login
          </span>
        </div>

        <div className="demo-account-grid">
          <div className="demo-account-card" onClick={() => handleQuickDemoLogin('citizen')}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                Ramesh Patil
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-primary-600)' }}>
                Citizen (Khed Gram Panchayat, Ward 4)
              </div>
            </div>
            <ArrowRight size={15} color="var(--color-primary-600)" />
          </div>

          <div className="demo-account-card" onClick={() => handleQuickDemoLogin('officer', 'pwd')}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                Er. Vikram Joshi
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-accent-600)' }}>
                PWD Roads Executive Officer
              </div>
            </div>
            <ArrowRight size={15} color="var(--color-accent-600)" />
          </div>

          <div className="demo-account-card" onClick={() => handleQuickDemoLogin('admin')}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                Dr. Aditi Kulkarni (IAS)
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-primary-800)' }}>
                Municipal Commissioner &amp; Super Admin
              </div>
            </div>
            <ArrowRight size={15} color="var(--color-primary-800)" />
          </div>
        </div>

        {/* Footer Link to Register */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          Don't have a citizen account?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary-700)', fontWeight: 600 }}>
            Register as Citizen
          </Link>
        </div>
      </div>
    </div>
  );
};
