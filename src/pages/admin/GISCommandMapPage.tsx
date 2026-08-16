import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { complaintService } from '../../services/complaintService';
import { departmentService } from '../../services/departmentService';
import { Complaint, Department } from '../../types';
import { ISSUE_CATEGORIES, ISSUE_PRIORITIES, COMPLAINT_STATUSES } from '../../utils/constants';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/common/Badge';
import { SLABadge } from '../../components/common/SLABadge';
import { CivicMap } from '../../components/map/CivicMap';
import { LoadingState } from '../../components/common/LoadingState';

export const GISCommandMapPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Map Filter State
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>(
    user?.role === 'officer' && user?.departmentId ? user.departmentId : 'All'
  );
  const [selectedWard, setSelectedWard] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected complaint on map click
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    async function loadMapData() {
      try {
        const [allComplaints, allDepts] = await Promise.all([
          complaintService.getComplaints(),
          departmentService.getDepartments(),
        ]);
        setComplaints(allComplaints);
        setDepartments(allDepts);
        if (allComplaints.length > 0) {
          setSelectedComplaint(allComplaints[0]);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadMapData();
  }, []);

  const uniqueWards = useMemo(() => {
    const wards = new Set<string>();
    complaints.forEach((c) => {
      if (c.location.ward) wards.add(c.location.ward);
    });
    return Array.from(wards).sort();
  }, [complaints]);

  // Officer department scoping
  const isOfficer = user?.role === 'officer';

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (isOfficer && user?.departmentId && c.departmentId && c.departmentId !== user.departmentId) {
        return false;
      }
      if (selectedStatus !== 'All' && c.status !== selectedStatus) return false;
      if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
      if (selectedPriority !== 'All' && c.priority !== selectedPriority) return false;
      if (selectedDepartment !== 'All' && c.departmentId !== selectedDepartment) return false;
      if (selectedWard !== 'All' && c.location.ward !== selectedWard) return false;

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        return (
          c.ticketNumber.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.location.address.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [
    complaints,
    isOfficer,
    user?.departmentId,
    selectedStatus,
    selectedCategory,
    selectedPriority,
    selectedDepartment,
    selectedWard,
    searchQuery,
  ]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <PageHeader
        title="Municipal GIS Command Center Map"
        subtitle="Geographic incident distribution, ward clusters, and spatial grievance tracking"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/complaints')}
            leftIcon={<Building2 size={15} />}
          >
            Master Registry ({filteredComplaints.length})
          </Button>
        }
      />

      {/* =====================================================================
          MAP FILTER TOOLBAR
          ===================================================================== */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <CardBody style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
            {/* Search */}
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                SEARCH GIS PINS
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ticket # or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: 'var(--font-size-xs)' }}
              />
            </div>

            {/* Status */}
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                STATUS
              </label>
              <select
                className="form-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ fontSize: 'var(--font-size-xs)' }}
              >
                <option value="All">All Statuses</option>
                {COMPLAINT_STATUSES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                CATEGORY
              </label>
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ fontSize: 'var(--font-size-xs)' }}
              >
                <option value="All">All Categories</option>
                {ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                PRIORITY
              </label>
              <select
                className="form-select"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                style={{ fontSize: 'var(--font-size-xs)' }}
              >
                <option value="All">All Priorities</option>
                {ISSUE_PRIORITIES.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                DEPARTMENT
              </label>
              <select
                className="form-select"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                disabled={isOfficer}
                style={{ fontSize: 'var(--font-size-xs)' }}
              >
                <option value="All">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.shortCode || d.code || d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Ward */}
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                WARD
              </label>
              <select
                className="form-select"
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                style={{ fontSize: 'var(--font-size-xs)' }}
              >
                <option value="All">All Wards</option>
                {uniqueWards.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* =====================================================================
          2-COLUMN MAP & INSPECTION DRAWER
          ===================================================================== */}
      {isLoading ? (
        <LoadingState message="Initializing municipal GIS coordinate engine..." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.25rem', height: '620px' }}>
          {/* Main Map Box */}
          <Card style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <CardBody style={{ padding: 0, flex: 1, position: 'relative' }}>
              <CivicMap
                complaints={filteredComplaints}
                height="100%"
                onMarkerClick={(c) => setSelectedComplaint(c)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  zIndex: 1000,
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(4px)',
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                📍 Showing {filteredComplaints.length} Geotagged Grievance Pins
              </div>
            </CardBody>
          </Card>

          {/* Right Inspection Drawer */}
          <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 800 }}>
                Incident Inspection Dossier
              </h4>
            </CardHeader>
            <CardBody style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
              {selectedComplaint ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                  {/* Photo thumbnail */}
                  {selectedComplaint.evidenceImages && selectedComplaint.evidenceImages.length > 0 && (
                    <div style={{ height: '140px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                      <img
                        src={selectedComplaint.evidenceImages[0].url}
                        alt={selectedComplaint.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-primary-800)' }}>
                        {selectedComplaint.ticketNumber}
                      </span>
                      <StatusBadge status={selectedComplaint.status} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem' }}>
                      <CategoryBadge category={selectedComplaint.category} />
                      <PriorityBadge priority={selectedComplaint.priority} />
                    </div>
                    <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedComplaint.title}
                    </h3>
                  </div>

                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selectedComplaint.description}
                  </p>

                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div>
                      <strong>Location:</strong> {selectedComplaint.location.address}
                    </div>
                    <div>
                      <strong>Ward / District:</strong> {selectedComplaint.location.ward}, {selectedComplaint.location.district}
                    </div>
                    <div>
                      <strong>Department:</strong> {selectedComplaint.departmentName || 'Unassigned'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary-700)', marginTop: '2px' }}>
                      GPS: {selectedComplaint.location.latitude.toFixed(5)}° N, {selectedComplaint.location.longitude.toFixed(5)}° E
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>SLA Urgency</div>
                      <SLABadge
                        createdAt={selectedComplaint.createdAt}
                        priority={selectedComplaint.priority}
                        status={selectedComplaint.status}
                        resolvedAt={selectedComplaint.resolutionDetails?.resolvedAt}
                      />
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/admin/complaints/${selectedComplaint.id}`)}
                      rightIcon={<ArrowRight size={14} />}
                    >
                      Open Workflow
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <MapPin size={32} style={{ margin: '0 auto 0.75rem auto' }} />
                  <p style={{ fontSize: 'var(--font-size-xs)' }}>
                    Click any pin on the map to inspect incident details and SLA timers.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};
