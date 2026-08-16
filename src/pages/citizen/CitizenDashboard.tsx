import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  ThumbsUp,
  MapPin,
  Sparkles,
  PhoneCall,
  Search,
  Bell,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { complaintService } from '../../services/complaintService';
import { noticeService } from '../../services/noticeService';
import { notificationService } from '../../services/notificationService';
import { Complaint, GovernmentNotice, CivicNotification } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { formatDate } from '../../utils/formatters';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success, info } = useToast();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notices, setNotices] = useState<GovernmentNotice[]>([]);
  const [notifications, setNotifications] = useState<CivicNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [allComplaints, allNotices, allNotifications] = await Promise.all([
          complaintService.getComplaints(),
          noticeService.getNotices(),
          user ? notificationService.getNotifications(user.uid) : Promise.resolve([]),
        ]);
        setComplaints(allComplaints);
        setNotices(allNotices);
        setNotifications(allNotifications);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, [user]);

  const myComplaints = complaints.filter((c) => c.citizenId === user?.uid);
  const myTotalCount = myComplaints.length;
  const myInProgressCount = myComplaints.filter((c) => c.status !== 'Resolved').length;
  const myResolvedCount = myComplaints.filter((c) => c.status === 'Resolved').length;
  const communityRecent = complaints.slice(0, 4);

  const handleToggleUpvote = async (complaintId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await complaintService.upvoteComplaint(complaintId, user?.uid || 'anon');
      setComplaints((prev) => prev.map((c) => (c.id === complaintId ? updated : c)));

      setUpvotedIds((prev) => {
        const next = new Set(prev);
        if (next.has(complaintId)) {
          next.delete(complaintId);
          info('Upvote Removed', 'Your vote for this community issue was withdrawn.');
        } else {
          next.add(complaintId);
          success('Issue Upvoted!', 'Higher community priority helps expedite municipal action.');
        }
        return next;
      });
    } catch {
      // Handled
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading your Citizen Grievance Dashboard..." />;
  }

  return (
    <div className="animate-fade-in">
      {/* Welcome Header */}
      <PageHeader
        title={`Namaste, ${user?.fullName || 'Citizen'}!`}
        subtitle={`Jurisdiction: ${user?.ward || 'Gram Panchayat'} • ${user?.district || 'District'}, ${user?.state || 'Maharashtra'}`}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Search size={15} />}
              onClick={() => navigate('/citizen/track')}
            >
              Track Ticket
            </Button>
            <Button
              variant="secondary"
              leftIcon={<PlusCircle size={16} />}
              onClick={() => navigate('/citizen/report')}
            >
              Report Grievance
            </Button>
          </div>
        }
      />

      {/* Urgent Notices Banner if any */}
      {notices.filter((n) => n.priority === 'Urgent').length > 0 && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'hsl(24, 100%, 97%)',
            border: '1px solid hsl(24, 95%, 85%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.4rem', borderRadius: '50%', backgroundColor: 'var(--color-danger-50)', color: 'var(--color-danger-600)' }}>
              <Megaphone size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-danger-700)' }}>
                {notices[0].title}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                {notices[0].content}
              </div>
            </div>
          </div>
          <Link to="/citizen/notices" className="btn btn-outline btn-sm" style={{ textDecoration: 'none', borderColor: 'hsl(24, 95%, 75%)', color: 'var(--color-danger-700)' }}>
            View Notices
          </Link>
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '2rem' }}>
        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-800)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--text-primary)' }}>{myTotalCount}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>My Total Grievances</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'hsl(45, 100%, 93%)', color: 'hsl(35, 95%, 35%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'hsl(35, 95%, 35%)' }}>{myInProgressCount}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Active / In Progress</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'hsl(150, 80%, 93%)', color: 'hsl(155, 85%, 26%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'hsl(155, 85%, 26%)' }}>{myResolvedCount}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Resolved with Proof</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'hsl(215, 100%, 95%)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-primary-700)' }}>AI Active</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Smart Classifier</div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main Grid: My Complaints & Community Feed */}
      <div className="grid grid-cols-3 gap-6" style={{ marginBottom: '2rem' }}>
        {/* Left 2 Cols: My Active Complaints */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>My Recent Grievances</h3>
            <Link to="/citizen/my-complaints" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-700)', fontWeight: 600 }}>
              View All ({myTotalCount}) &rarr;
            </Link>
          </div>

          {myComplaints.length === 0 ? (
            <Card>
              <CardBody style={{ textAlign: 'center', padding: '3rem' }}>
                <FileText size={40} color="var(--color-gray-400)" style={{ margin: '0 auto 1rem auto' }} />
                <h4 style={{ marginBottom: '0.5rem' }}>No grievances reported yet</h4>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Spot a pothole, broken street light, or garbage pile? Report it directly to your Gram Panchayat or Ward Officer.
                </p>
                <Button variant="primary" size="sm" onClick={() => navigate('/citizen/report')} leftIcon={<PlusCircle size={15} />}>
                  Report Your First Issue
                </Button>
              </CardBody>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {myComplaints.slice(0, 3).map((c) => (
                <Card
                  key={c.id}
                  interactive
                  onClick={() => navigate(`/citizen/track?ticket=${c.ticketNumber}`)}
                >
                  <CardBody>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-primary-800)' }}>
                            {c.ticketNumber}
                          </span>
                          <StatusBadge status={c.status} />
                          <PriorityBadge priority={c.priority} />
                          <CategoryBadge category={c.category} />
                        </div>
                        <h4 style={{ fontSize: 'var(--font-size-base)', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                          {c.title}
                        </h4>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <MapPin size={12} />
                          <span>{c.location.address}</span>
                          <span>•</span>
                          <span>{formatDate(c.createdAt)}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-600)', fontWeight: 600 }}>Track &rarr;</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Quick Actions & Notifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <h4 style={{ fontSize: 'var(--font-size-sm)' }}>Quick Civic Actions</h4>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Button variant="primary" fullWidth size="sm" onClick={() => navigate('/citizen/report')} leftIcon={<PlusCircle size={15} />}>
                Report New Problem
              </Button>
              <Button variant="outline" fullWidth size="sm" onClick={() => navigate('/citizen/map')} leftIcon={<MapPin size={15} />}>
                Explore GIS Ward Map
              </Button>
              <Button variant="outline" fullWidth size="sm" onClick={() => navigate('/citizen/track')} leftIcon={<Search size={15} />}>
                Track Any Ticket
              </Button>
            </CardBody>
          </Card>

          {/* Notifications summary */}
          <Card>
            <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: 'var(--font-size-sm)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Bell size={15} /> Updates ({notifications.length})
              </h4>
              <Link to="/citizen/notifications" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-700)' }}>
                View All
              </Link>
            </CardHeader>
            <CardBody style={{ padding: '0.75rem 1rem' }}>
              {notifications.length === 0 ? (
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>No unread updates.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {notifications.slice(0, 2).map((n) => (
                    <div key={n.id} style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>{n.title}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{n.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Emergency 24/7 Helpline Quick Strip */}
          <Card style={{ backgroundColor: 'var(--color-danger-50)', border: '1px solid var(--color-danger-200)' }}>
            <CardBody style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)', color: 'var(--color-danger-800)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <PhoneCall size={14} /> National Emergency
                </span>
                <span style={{ fontWeight: 800, fontSize: 'var(--font-size-sm)', color: 'var(--color-danger-700)', fontFamily: 'var(--font-mono)' }}>112</span>
              </div>
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-danger-800)', marginBottom: '0.75rem' }}>
                For immediate life-threatening incidents, fire, or disaster evacuation.
              </p>
              <Link to="/emergency" className="btn btn-danger btn-sm" style={{ width: '100%', textDecoration: 'none', fontSize: '0.75rem' }}>
                Open Emergency Directory
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Community Issues Feed */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>Nearby Community Issues in Your Ward</h3>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              Upvote reported issues to raise municipal priority for your neighborhood.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/citizen/map')} leftIcon={<MapPin size={15} />}>
            View on Interactive Map
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {communityRecent.map((c) => {
            const hasUpvoted = upvotedIds.has(c.id);
            return (
              <Card key={c.id}>
                <CardBody>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <CategoryBadge category={c.category} />
                      <StatusBadge status={c.status} />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleToggleUpvote(c.id, e)}
                      className={`btn btn-sm ${hasUpvoted ? 'btn-primary' : 'btn-outline'}`}
                      style={{ fontSize: '0.75rem', gap: '0.35rem', padding: '0.25rem 0.5rem' }}
                      title="Upvote this issue"
                    >
                      <ThumbsUp size={13} />
                      <span>{c.upvotesCount}</span>
                    </button>
                  </div>

                  <h4 style={{ fontSize: 'var(--font-size-sm)', marginBottom: '0.25rem' }}>{c.title}</h4>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {c.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={12} /> {c.location.ward || c.location.address}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/citizen/track?ticket=${c.ticketNumber}`)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary-700)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                    >
                      Inspect &rarr;
                    </button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
