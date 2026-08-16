import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="auth-card" style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div
          style={{
            width: '4rem',
            height: '4rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-primary-50)',
            color: 'var(--color-primary-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
          }}
        >
          <FileQuestion size={36} />
        </div>

        <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: '0.5rem' }}>404</h1>
        <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          Civic Page Not Found
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          The municipal service or page you requested does not exist or has been relocated.
        </p>

        <Button variant="primary" fullWidth onClick={() => navigate('/')} leftIcon={<Home size={16} />}>
          Back to CivicConnect Portal
        </Button>
      </div>
    </div>
  );
};
