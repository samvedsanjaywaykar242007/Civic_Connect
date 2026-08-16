import React from 'react';
import { PhoneCall, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card, CardBody } from '../../components/common/Card';
import { EMERGENCY_HELPLINES } from '../../utils/constants';

export const EmergencyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: 'var(--space-8) var(--space-4)' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', color: 'var(--color-danger-700)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={32} />
            National Emergency Services Directory
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Toll-free 24/7 emergency response numbers for immediate rescue, police, medical, and disaster services across India.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} leftIcon={<ArrowLeft size={16} />}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {EMERGENCY_HELPLINES.map((h) => (
          <Card key={h.number} style={{ borderLeft: '4px solid var(--color-danger-600)' }}>
            <CardBody style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
              <div
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-danger-50)',
                  color: 'var(--color-danger-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <PhoneCall size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)' }}>{h.name}</h3>
                  <span
                    style={{
                      fontSize: 'var(--font-size-xl)',
                      fontWeight: 800,
                      color: 'var(--color-danger-600)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {h.number}
                  </span>
                </div>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  {h.description}
                </p>
                <div style={{ marginTop: '0.75rem' }}>
                  <a
                    href={`tel:${h.number.split('/')[0].trim()}`}
                    className="btn btn-danger btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    <PhoneCall size={13} />
                    <span>Call Helpline</span>
                  </a>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};
