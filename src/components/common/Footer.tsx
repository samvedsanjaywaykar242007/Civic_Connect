import React from 'react';
import { Landmark, Shield } from 'lucide-react';
import { EMERGENCY_HELPLINES } from '../../utils/constants';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container footer-top">
        <div className="grid grid-cols-4 gap-8">
          {/* Column 1: Identity & Mission */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div className="brand-emblem" style={{ width: '2rem', height: '2rem' }}>
                <Landmark size={16} color="#f59e0b" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem', color: '#ffffff' }}>
                CivicConnect
              </span>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-200)', lineHeight: 1.6 }}>
              A transparent citizen-government civic problem reporting and resolution platform for India. Empowering rural gram panchayats, urban wards, and communities with accountable public governance.
            </p>
          </div>

          {/* Column 2: Public Services */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: 'var(--font-size-sm)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Public Services
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: 'var(--font-size-xs)' }}>
              <li><a href="#report-section" style={{ color: 'var(--color-primary-200)' }}>Report Pothole / Road Damage</a></li>
              <li><a href="#report-section" style={{ color: 'var(--color-primary-200)' }}>Water Supply &amp; Leakage Grievance</a></li>
              <li><a href="#report-section" style={{ color: 'var(--color-primary-200)' }}>Garbage &amp; Waste Management</a></li>
              <li><a href="#report-section" style={{ color: 'var(--color-primary-200)' }}>Street Light Failure</a></li>
              <li><a href="#tracking-section" style={{ color: 'var(--color-primary-200)' }}>Check Live Resolution Status</a></li>
            </ul>
          </div>

          {/* Column 3: Emergency Helplines */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: 'var(--font-size-sm)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Emergency Helplines
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: 'var(--font-size-xs)' }}>
              {EMERGENCY_HELPLINES.slice(0, 4).map((h) => (
                <li key={h.number} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-primary-200)' }}>
                  <span>{h.name}</span>
                  <strong style={{ color: 'var(--color-accent-400)' }}>{h.number}</strong>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Governance & Transparency */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: 'var(--font-size-sm)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Transparency
            </h4>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-200)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
              All complaints are logged with GPS coordinates and time-stamped proof. Government officers upload verifiable before/after photos upon resolution.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.65rem', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius-sm)', fontSize: '0.6875rem' }}>
              <Shield size={13} color="#10b981" />
              <span>Verified Public Record</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            &copy; {new Date().getFullYear()} CivicConnect Platform. Designed for Indian Citizen Empowerment &amp; Digital Governance.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span>Privacy Policy</span>
            <span>Citizen Charter</span>
            <span>Accessibility (WCAG 2.1)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
