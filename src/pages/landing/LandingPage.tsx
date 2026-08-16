import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Camera,
  Search,
  PhoneCall,
  Users,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { StatusBadge, CategoryBadge } from '../../components/common/Badge';
import { ISSUE_CATEGORIES, COMPLAINT_STATUSES, EMERGENCY_HELPLINES } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';

export interface LandingPageProps {
  onSelectRole?: (role: 'citizen' | 'admin') => void;
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  const navigate = useNavigate();
  const { loginWithDemo } = useAuth();
  const [searchTicket, setSearchTicket] = useState('');
  const [trackResult, setTrackResult] = useState<string | null>(null);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTicket.trim()) return;
    setTrackResult(`Ticket #${searchTicket.trim().toUpperCase()} is currently [IN PROGRESS] with PWD (Roads). Inspection completed at 10:30 AM.`);
  };

  return (
    <div className="landing-page animate-fade-in">
      {/* =====================================================================
          Hero Section
          ===================================================================== */}
      <section className="section-lg" style={{ background: 'linear-gradient(180deg, hsl(224, 64%, 18%) 0%, hsl(222, 47%, 14%) 100%)', color: '#ffffff' }}>
        <div className="container">
          <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: 'var(--color-accent-400)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                marginBottom: '1.5rem',
              }}
            >
              <ShieldCheck size={14} />
              <span>Digital Civic Infrastructure for Indian Rural &amp; Municipal Governance</span>
            </div>

            <h1 style={{ color: '#ffffff', marginBottom: '1.25rem', lineHeight: 1.15 }}>
              Connecting Citizens with Local Governance for Rapid Issue Resolution
            </h1>

            <p style={{ color: 'var(--color-primary-100)', fontSize: 'var(--font-size-lg)', marginBottom: '2rem', lineHeight: 1.6 }}>
              From remote Gram Panchayats and rural roads to dense urban wards — report potholes, water leaks, garbage piles, and flood blockages with GPS accuracy and photographic evidence.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
              <Button
                variant="secondary"
                size="lg"
                leftIcon={<Camera size={18} />}
                onClick={async () => {
                  await loginWithDemo('citizen');
                  navigate('/citizen/report');
                }}
              >
                Report Civic Problem
              </Button>
              <Button
                variant="outline"
                size="lg"
                style={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                leftIcon={<Search size={18} />}
                onClick={async () => {
                  await loginWithDemo('citizen');
                  navigate('/citizen/track');
                }}
              >
                Track Grievance Status
              </Button>
            </div>

            {/* Verification Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1.5rem', fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-200)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={15} color="#10b981" /> GPS Geotagged
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={15} color="#10b981" /> Before &amp; After Photo Proof
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={15} color="#10b981" /> Real-Time SLA Tracking
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          Impact Statistics Banner
          ===================================================================== */}
      <section style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', transform: 'translateY(-24px)' }}>
        <div className="container">
          <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="grid grid-cols-4">
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-primary-900)' }}>
                  1,480+
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.25rem' }}>
                  Issues Reported
                </div>
              </div>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-success-600)' }}>
                  1,290+
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.25rem' }}>
                  Verified Resolved
                </div>
              </div>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-accent-600)' }}>
                  28.4 Hrs
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.25rem' }}>
                  Average SLA Turnaround
                </div>
              </div>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-primary-600)' }}>
                  48
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.25rem' }}>
                  Gram Panchayats &amp; Wards
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5-Stage Complaint Lifecycle Section
          ===================================================================== */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem auto' }}>
            <h2 style={{ marginBottom: '0.75rem' }}>The Closed-Loop Civic Resolution Process</h2>
            <p>Every grievance progresses through a transparent, 5-stage lifecycle with accountable time stamps and photographic proof.</p>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {COMPLAINT_STATUSES.map((status) => (
              <Card key={status.key} style={{ borderTop: `4px solid ${status.key === 'Resolved' ? '#10B981' : status.key === 'In Progress' ? '#0284C7' : '#1E3A8A'}` }}>
                <CardBody>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 'var(--font-size-xs)' }}>
                      {status.stepNumber}
                    </span>
                    <StatusBadge status={status.key} />
                  </div>
                  <h4 style={{ fontSize: 'var(--font-size-base)', marginBottom: '0.5rem' }}>{status.label}</h4>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>{status.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          Role Portals Selection
          ===================================================================== */}
      <section className="section" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem auto' }}>
            <h2 style={{ marginBottom: '0.75rem' }}>Choose Your Civic Portal</h2>
            <p>Select your role to access dedicated tools for citizen reporting or official municipal administration.</p>
          </div>

          <div className="grid grid-cols-2 gap-6" style={{ maxWidth: '880px', margin: '0 auto' }}>
            {/* Citizen Portal Card */}
            <Card
              interactive
              className="card-glass"
              onClick={async () => {
                await loginWithDemo('citizen');
                navigate('/citizen/dashboard');
              }}
            >
              <CardBody style={{ padding: '2rem' }}>
                <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <Users size={32} />
                </div>
                <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '0.5rem' }}>Citizen Portal</h3>
                <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: '1.5rem' }}>
                  Submit complaints with GPS coordinates, upload photo evidence, receive automatic AI categorization, track resolution progress, and verify completed repairs.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary-700)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                  <span>Enter Citizen Workspace</span>
                  <ChevronRight size={16} />
                </div>
              </CardBody>
            </Card>

            {/* Government / Admin Portal Card */}
            <Card
              interactive
              className="card-glass"
              onClick={async () => {
                await loginWithDemo('admin');
                navigate('/admin/dashboard');
              }}
            >
              <CardBody style={{ padding: '2rem' }}>
                <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'hsl(38, 92%, 94%)', color: 'var(--color-accent-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <Building2 size={32} />
                </div>
                <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '0.5rem' }}>Government &amp; Admin Desk</h3>
                <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: '1.5rem' }}>
                  Dedicated portal for Ward Officers, PWD Engineers, and Municipal Staff to review complaints, generate AI action briefs, assign field crews, and upload resolution proof photos.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent-700)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                  <span>Access Administration Console</span>
                  <ChevronRight size={16} />
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* =====================================================================
          10 Core Issue Categories
          ===================================================================== */}
      <section className="section" id="categories-section">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem auto' }}>
            <h2 style={{ marginBottom: '0.75rem' }}>10 Core Civic Grievance Categories</h2>
            <p>Comprehensive coverage of everyday village, rural, and municipal infrastructure challenges.</p>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {ISSUE_CATEGORIES.map((cat) => (
              <Card key={cat.key} interactive>
                <CardBody style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <CategoryBadge category={cat.key} />
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>{cat.defaultDepartmentCode}</span>
                  </div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', marginBottom: '0.35rem' }}>{cat.label}</h4>
                  <p style={{ fontSize: 'var(--font-size-xs)' }}>{cat.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          Instant Grievance Tracking Preview
          ===================================================================== */}
      <section className="section" id="tracking-section" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
        <div className="container">
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <Card>
              <CardHeader>
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-lg)' }}>Quick Grievance Tracker</h3>
                  <p style={{ fontSize: 'var(--font-size-xs)' }}>Track your complaint status using your unique ticket ID (e.g., CC-2026-MH-4821)</p>
                </div>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleTrackSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter Ticket ID (e.g. CC-2026-MH-4821)"
                      value={searchTicket}
                      onChange={(e) => setSearchTicket(e.target.value)}
                      required
                    />
                  </div>
                  <Button variant="primary" type="submit" leftIcon={<Search size={16} />}>
                    Check Status
                  </Button>
                </form>

                {trackResult && (
                  <div
                    style={{
                      marginTop: '1.25rem',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'hsl(200, 95%, 94%)',
                      border: '1px solid hsl(200, 80%, 80%)',
                      color: 'hsl(200, 85%, 25%)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      <Clock size={16} />
                      <span>Live Status Update</span>
                    </div>
                    {trackResult}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* =====================================================================
          Emergency Directory Quick Access
          ===================================================================== */}
      <section className="section" id="emergency-section">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 2.5rem auto' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>National Emergency Helplines</h2>
            <p>Immediate 24/7 assistance directory for disaster, medical, and security emergencies.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {EMERGENCY_HELPLINES.map((h) => (
              <Card key={h.number} style={{ backgroundColor: 'var(--bg-surface)' }}>
                <CardBody style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-50)', color: 'var(--color-danger-600)' }}>
                    <PhoneCall size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-danger-600)' }}>
                      {h.number}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {h.name}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                      {h.description}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
