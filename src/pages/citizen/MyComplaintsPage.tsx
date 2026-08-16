import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  MapPin,
  Calendar,
  Building2,
  ArrowRight,
  LayoutGrid,
  List,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { complaintService } from '../../services/complaintService';
import { Complaint } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';

const STATUS_FILTERS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'All Statuses' },
  { key: 'Submitted', label: 'Submitted' },
  { key: 'Verified', label: 'Verified' },
  { key: 'Assigned', label: 'Assigned' },
  { key: 'In Progress', label: 'In Progress' },
  { key: 'Resolved', label: 'Resolved' },
];

export const MyComplaintsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    async function fetchComplaints() {
      try {
        const data = await complaintService.getComplaints();
        // Filter for active citizen or show all in demo if no citizen ID matches
        const myData = data.filter((c) => c.citizenId === user?.uid);
        setComplaints(myData.length > 0 ? myData : data);
      } finally {
        setIsLoading(false);
      }
    }
    fetchComplaints();
  }, [user]);

  // Apply filters, search, and sorting
  const filteredComplaints = complaints
    .filter((c) => {
      if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.ticketNumber.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.location.address.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'priority') {
        const order = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return (order[b.priority] || 0) - (order[a.priority] || 0);
      }
      return 0;
    });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Reported Grievances"
        subtitle="Complete record of all civic issues submitted by your account"
        actions={
          <Button
            variant="secondary"
            leftIcon={<PlusCircle size={16} />}
            onClick={() => navigate('/citizen/report')}
          >
            Report New Grievance
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardBody style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search ticket, title, category, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>

            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
              {STATUS_FILTERS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedStatus(tab.key)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: selectedStatus === tab.key ? 700 : 500,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: selectedStatus === tab.key ? 'var(--color-primary-600)' : 'var(--border-subtle)',
                    backgroundColor: selectedStatus === tab.key ? 'var(--color-primary-50)' : 'transparent',
                    color: selectedStatus === tab.key ? 'var(--color-primary-900)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort and View Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'priority')}
                style={{ width: 'auto', fontSize: 'var(--font-size-xs)' }}
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="priority">Sort: Highest Priority</option>
              </select>

              <div style={{ display: 'flex', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  style={{
                    padding: '0.35rem 0.5rem',
                    background: viewMode === 'cards' ? 'var(--color-primary-50)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
                  }}
                  aria-label="Cards view"
                >
                  <LayoutGrid size={15} color={viewMode === 'cards' ? 'var(--color-primary-700)' : 'var(--text-muted)'} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  style={{
                    padding: '0.35rem 0.5rem',
                    background: viewMode === 'table' ? 'var(--color-primary-50)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  }}
                  aria-label="Table view"
                >
                  <List size={15} color={viewMode === 'table' ? 'var(--color-primary-700)' : 'var(--text-muted)'} />
                </button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Content Rendering */}
      {isLoading ? (
        <LoadingState message="Loading your reported grievances..." />
      ) : filteredComplaints.length === 0 ? (
        <EmptyState
          title="No grievances found"
          description={
            searchQuery || selectedStatus !== 'all'
              ? 'Try changing your search keywords or clearing the status filter.'
              : 'You have not submitted any complaints yet.'
          }
          actionText="Report Grievance"
          onAction={() => navigate('/citizen/report')}
        />
      ) : viewMode === 'cards' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {filteredComplaints.map((c) => (
            <Card
              key={c.id}
              interactive
              onClick={() => navigate(`/citizen/track?ticket=${c.ticketNumber}`)}
            >
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
                  {/* Left info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-primary-800)' }}>
                        {c.ticketNumber}
                      </span>
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                      <CategoryBadge category={c.category} />
                    </div>

                    <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                      {c.title}
                    </h3>

                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {c.description}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={13} /> {c.location.address}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Building2 size={13} /> {c.departmentName || 'Under Verification'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={13} /> Reported on {formatDate(c.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Resolution Status & Action */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    {c.status === 'Resolved' && (
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-success-600)',
                          backgroundColor: 'hsl(150, 80%, 95%)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <CheckCircle2 size={13} /> Proof Attached
                      </span>
                    )}

                    <Button variant="outline" size="sm" rightIcon={<ArrowRight size={14} />}>
                      Track Lifecycle
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Title &amp; Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Department</th>
                <th>Reported Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-primary-800)' }}>
                    {c.ticketNumber}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>{c.title}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{c.location.address}</div>
                  </td>
                  <td><PriorityBadge priority={c.priority} /></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td style={{ fontSize: 'var(--font-size-xs)' }}>{c.departmentName || '—'}</td>
                  <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{formatDate(c.createdAt)}</td>
                  <td>
                    <Link to={`/citizen/track?ticket=${c.ticketNumber}`} className="btn btn-outline btn-sm">
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
