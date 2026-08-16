import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/common/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { complaintService } from '../../services/complaintService';
import { noticeService } from '../../services/noticeService';
import { notificationService } from '../../services/notificationService';
import { Complaint, GovernmentNotice, CivicNotification } from '../../types';
import { MapPin, User, Bell, PlusCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ReportIssueFoundation: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader title="Report a Civic Problem" subtitle="Geotag the location, upload photos, and submit for municipal resolution" />
      <Card>
        <CardBody style={{ textAlign: 'center', padding: '3rem' }}>
          <PlusCircle size={48} color="var(--color-primary-600)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Issue Reporting Engine Ready</h3>
          <p style={{ maxWidth: '520px', margin: '0 auto 1.5rem auto' }}>
            Phase 3 routing &amp; foundation established. The full multi-step GPS locator, live Gemini AI categorization, and image upload wizard will be wired up in Phase 4.
          </p>
          <Button variant="primary" onClick={() => navigate('/citizen/dashboard')}>
            Back to Dashboard
          </Button>
        </CardBody>
      </Card>
    </div>
  );
};

export const MyComplaintsFoundation: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    complaintService.getComplaints().then((data) => {
      setComplaints(data.filter((c) => c.citizenId === user?.uid));
    });
  }, [user]);

  return (
    <div>
      <PageHeader title="My Reported Grievances" subtitle="Track real-time status and view official resolution evidence" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {complaints.map((c) => (
          <Card key={c.id}>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-primary-700)' }}>{c.ticketNumber}</span>
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                    <CategoryBadge category={c.category} />
                  </div>
                  <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: '0.5rem' }}>{c.title}</h3>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{c.description}</p>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={12} /> {c.location.address}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const TrackComplaintFoundation: React.FC = () => {
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<Complaint | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    const res = await complaintService.getComplaintById(query);
    setFound(res);
  };

  return (
    <div>
      <PageHeader title="Live Grievance Tracker" subtitle="Enter your unique ticket code to check municipal resolution progress" />
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardBody>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. CC-2026-MH-4821 or CC-2026-MH-3912"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" leftIcon={<Search size={16} />}>
              Search Ticket
            </Button>
          </form>
        </CardBody>
      </Card>

      {found && (
        <Card>
          <CardBody>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{found.ticketNumber}</span>
              <StatusBadge status={found.status} />
              <PriorityBadge priority={found.priority} />
            </div>
            <h4>{found.title}</h4>
            <p style={{ fontSize: 'var(--font-size-sm)', marginTop: '0.5rem' }}>{found.description}</p>
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
              <strong>Current Department:</strong> {found.departmentName || 'Under Verification'}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export const NearbyMapFoundation: React.FC = () => {
  return (
    <div>
      <PageHeader title="Community &amp; Nearby Issues Map" subtitle="Discover and upvote civic issues reported in your Gram Panchayat or Ward" />
      <Card>
        <CardBody style={{ textAlign: 'center', padding: '3rem' }}>
          <MapPin size={48} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
          <h3>Interactive Community GIS Map</h3>
          <p style={{ maxWidth: '500px', margin: '0 auto 1rem auto', fontSize: 'var(--font-size-sm)' }}>
            Google Maps Platform integration with Advanced Markers and Radius search will be rendered in Phase 4.
          </p>
        </CardBody>
      </Card>
    </div>
  );
};

export const CitizenNoticesFoundation: React.FC = () => {
  const [notices, setNotices] = useState<GovernmentNotice[]>([]);
  useEffect(() => {
    noticeService.getNotices().then(setNotices);
  }, []);

  return (
    <div>
      <PageHeader title="Government Civic Notices" subtitle="Public alerts, scheduled maintenance, and disaster warnings" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {notices.map((n) => (
          <Card key={n.id} style={{ borderLeft: `4px solid ${n.priority === 'Urgent' ? '#EA580C' : '#1E3A8A'}` }}>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-800)' }}>{n.departmentName}</span>
                <span className={`badge ${n.priority === 'Urgent' ? 'badge-priority-high' : 'badge-priority-low'}`}>{n.priority}</span>
              </div>
              <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: '0.35rem' }}>{n.title}</h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>{n.content}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const CitizenProfileFoundation: React.FC = () => {
  const { user } = useAuth();
  return (
    <div>
      <PageHeader title="Citizen Profile &amp; Ward Settings" subtitle="Your official citizen identification and ward jurisdiction" />
      <Card style={{ maxWidth: '640px' }}>
        <CardBody>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="user-avatar" style={{ width: '4rem', height: '4rem', fontSize: '1.5rem' }}>
              {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName} /> : <User size={28} />}
            </div>
            <div>
              <h2>{user?.fullName}</h2>
              <div style={{ color: 'var(--color-primary-600)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                Citizen Account • {user?.ward}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: 'var(--font-size-sm)' }}>
            <div><strong>Email:</strong> {user?.email}</div>
            <div><strong>Mobile:</strong> {user?.phoneNumber}</div>
            <div><strong>District:</strong> {user?.district}</div>
            <div><strong>State:</strong> {user?.state}</div>
            <div><strong>PIN Code:</strong> {user?.pincode}</div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export const CitizenNotificationsFoundation: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<CivicNotification[]>([]);

  useEffect(() => {
    if (user) {
      notificationService.getNotifications(user.uid).then(setNotifications);
    }
  }, [user]);

  return (
    <div>
      <PageHeader title="Grievance Notifications" subtitle="Real-time status updates and departmental notices" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {notifications.map((n) => (
          <Card key={n.id}>
            <CardBody style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-700)' }}>
                <Bell size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: 'var(--font-size-sm)' }}>{n.title}</h4>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{n.message}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};
