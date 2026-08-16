import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  ThumbsUp,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { complaintService } from '../../services/complaintService';
import { Complaint } from '../../types';
import { ISSUE_CATEGORIES } from '../../utils/constants';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { CivicMap } from '../../components/map/CivicMap';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/formatters';

export const NearbyMapPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, info } = useToast();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadMapData() {
      try {
        const data = await complaintService.getComplaints();
        setComplaints(data);
        if (data.length > 0) {
          setSelectedComplaint(data[0]);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadMapData();
  }, []);

  const handleUpvote = async (complaintId: string) => {
    try {
      const updated = await complaintService.upvoteComplaint(complaintId, user?.uid || 'anon');
      setComplaints((prev) => prev.map((c) => (c.id === complaintId ? updated : c)));
      if (selectedComplaint && selectedComplaint.id === complaintId) {
        setSelectedComplaint(updated);
      }
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

  const filteredComplaints = complaints.filter((c) => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (selectedStatus === 'active' && c.status === 'Resolved') return false;
    if (selectedStatus === 'resolved' && c.status !== 'Resolved') return false;
    return true;
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Community &amp; Ward GIS Map"
        subtitle="Explore civic issues reported across your Gram Panchayat and municipal wards"
        actions={
          <Button variant="secondary" onClick={() => navigate('/citizen/report')} leftIcon={<MapPin size={16} />}>
            Report Issue at My Location
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <CardBody style={{ padding: '0.875rem 1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            {/* Category Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>Category:</span>
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ width: 'auto', fontSize: 'var(--font-size-xs)', padding: '0.35rem 0.75rem' }}
              >
                <option value="all">All Categories ({complaints.length})</option>
                {ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {[
                { key: 'all', label: 'All Issues' },
                { key: 'active', label: 'Active / Pending' },
                { key: 'resolved', label: 'Resolved Only' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedStatus(tab.key)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: selectedStatus === tab.key ? 700 : 500,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: selectedStatus === tab.key ? 'var(--color-primary-600)' : 'var(--border-subtle)',
                    backgroundColor: selectedStatus === tab.key ? 'var(--color-primary-50)' : 'transparent',
                    color: selectedStatus === tab.key ? 'var(--color-primary-900)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Radius Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>Radius:</span>
              <select
                className="form-select"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                style={{ width: 'auto', fontSize: 'var(--font-size-xs)', padding: '0.35rem 0.75rem' }}
              >
                <option value={1}>1 km radius</option>
                <option value={3}>3 km radius</option>
                <option value={5}>5 km (Ward Area)</option>
                <option value={20}>20 km (Entire District)</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main Map & Selected Item View */}
      {isLoading ? (
        <LoadingState message="Loading interactive GIS Map..." />
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {/* Left 2 Cols: Interactive Map Canvas */}
          <div style={{ gridColumn: 'span 2' }}>
            <CivicMap
              center={
                selectedComplaint
                  ? [selectedComplaint.location.latitude, selectedComplaint.location.longitude]
                  : [18.7512, 73.8643]
              }
              zoom={13}
              complaints={filteredComplaints}
              onComplaintClick={(c) => setSelectedComplaint(c)}
              height="540px"
            />
          </div>

          {/* Right Col: Selected Complaint Details Card */}
          <div>
            {selectedComplaint ? (
              <Card className="animate-fade-in" style={{ height: '540px', display: 'flex', flexDirection: 'column' }}>
                <CardBody style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
                  {/* Photo thumbnail */}
                  {selectedComplaint.evidenceImages && selectedComplaint.evidenceImages.length > 0 && (
                    <div style={{ height: '160px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1rem', border: '1px solid var(--border-subtle)' }}>
                      <img
                        src={selectedComplaint.evidenceImages[0].url}
                        alt={selectedComplaint.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-primary-800)' }}>
                      {selectedComplaint.ticketNumber}
                    </span>
                    <StatusBadge status={selectedComplaint.status} />
                    <PriorityBadge priority={selectedComplaint.priority} />
                  </div>

                  <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    {selectedComplaint.title}
                  </h3>

                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {selectedComplaint.description}
                  </p>

                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginBottom: '1rem' }}>
                    <div>📍 <strong>Location:</strong> {selectedComplaint.location.address}</div>
                    <div>🏛️ <strong>Department:</strong> {selectedComplaint.departmentName || 'Under Assessment'}</div>
                    <div>📅 <strong>Reported:</strong> {formatDate(selectedComplaint.createdAt)}</div>
                    <div>🔒 <strong>Reported By:</strong> Verified Citizen ({selectedComplaint.location.ward})</div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Button
                      variant={upvotedIds.has(selectedComplaint.id) ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleUpvote(selectedComplaint.id)}
                      leftIcon={<ThumbsUp size={14} />}
                    >
                      Upvote ({selectedComplaint.upvotesCount})
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/citizen/track?ticket=${selectedComplaint.ticketNumber}`)}
                      rightIcon={<ArrowRight size={14} />}
                    >
                      Inspect Status
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <Card style={{ height: '540px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CardBody style={{ textAlign: 'center' }}>
                  <MapPin size={36} color="var(--color-primary-400)" style={{ margin: '0 auto 0.75rem auto' }} />
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                    Click any marker on the map to inspect community grievance details.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
