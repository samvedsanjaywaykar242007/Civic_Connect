import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, FileText, CheckCircle2, Clock, MapPin, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { complaintService } from '../../services/complaintService';
import { Complaint } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';

export const CitizenDashboardFoundation: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await complaintService.getComplaints();
        setComplaints(data);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const myComplaints = complaints.filter((c) => c.citizenId === user?.uid);
  const activeCount = myComplaints.filter((c) => c.status !== 'Resolved').length;
  const resolvedCount = myComplaints.filter((c) => c.status === 'Resolved').length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Namaste, ${user?.fullName || 'Citizen'}!`}
        subtitle={`${user?.ward || 'Ward Area'} • Gram Panchayat & Municipal Portal`}
        actions={
          <Button variant="secondary" onClick={() => navigate('/citizen/report')} leftIcon={<PlusCircle size={16} />}>
            Report New Grievance
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4" style={{ marginBottom: '2rem' }}>
        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={22} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>{myComplaints.length}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>My Total Reports</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'hsl(45, 100%, 93%)', color: 'hsl(35, 95%, 35%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>{activeCount}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>In Progress / Pending</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'hsl(150, 80%, 93%)', color: 'hsl(155, 85%, 26%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>{resolvedCount}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Resolved &amp; Verified</div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent My Complaints */}
      <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '1rem' }}>My Reported Issues</h3>
      {isLoading ? (
        <LoadingState message="Loading your civic complaints..." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {myComplaints.length === 0 ? (
            <Card>
              <CardBody style={{ textAlign: 'center', padding: '2rem' }}>
                <p>You have not reported any civic issues yet.</p>
                <Button variant="primary" size="sm" onClick={() => navigate('/citizen/report')} style={{ marginTop: '1rem' }}>
                  Report Your First Issue
                </Button>
              </CardBody>
            </Card>
          ) : (
            myComplaints.map((c) => (
              <Card key={c.id} interactive onClick={() => navigate('/citizen/my-complaints')}>
                <CardBody style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-primary-700)' }}>
                        {c.ticketNumber}
                      </span>
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <h4 style={{ fontSize: 'var(--font-size-sm)', marginBottom: '0.25rem' }}>{c.title}</h4>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={12} />
                      <span>{c.location.address}</span>
                    </div>
                  </div>
                  <ArrowRight size={16} color="var(--color-gray-400)" />
                </CardBody>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};
