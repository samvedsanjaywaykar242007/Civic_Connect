import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  LayoutGrid,
  List,
  AlertTriangle,
  MapPin,
  Download,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { complaintService } from '../../services/complaintService';
import { departmentService } from '../../services/departmentService';
import { Complaint, Department } from '../../types';
import { calculateComplaintSLA } from '../../utils/sla';
import { ISSUE_CATEGORIES, ISSUE_PRIORITIES, COMPLAINT_STATUSES } from '../../utils/constants';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/common/Badge';
import { SLABadge } from '../../components/common/SLABadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export const MasterGrievanceRegistry: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const statusParam = searchParams.get('status') || 'All';
  const filterParam = searchParams.get('filter') || '';

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>(statusParam);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>(
    user?.role === 'officer' && user?.departmentId ? user.departmentId : 'All'
  );
  const [selectedWard, setSelectedWard] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority' | 'sla'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showOverdueOnly, setShowOverdueOnly] = useState<boolean>(filterParam === 'overdue');

  useEffect(() => {
    async function loadRegistryData() {
      try {
        const [complaintsData, departmentsData] = await Promise.all([
          complaintService.getComplaints(),
          departmentService.getDepartments(),
        ]);
        setComplaints(complaintsData);
        setDepartments(departmentsData);
      } finally {
        setIsLoading(false);
      }
    }
    loadRegistryData();
  }, []);

  // Sync with URL query parameter
  useEffect(() => {
    if (statusParam && statusParam !== 'All') {
      setSelectedStatus(statusParam);
    }
    if (filterParam === 'overdue') {
      setShowOverdueOnly(true);
    }
  }, [statusParam, filterParam]);

  // Extract unique wards for dropdown
  const uniqueWards = useMemo(() => {
    const wards = new Set<string>();
    complaints.forEach((c) => {
      if (c.location.ward) wards.add(c.location.ward);
    });
    return Array.from(wards).sort();
  }, [complaints]);

  // Department Scoping for Officers
  const isOfficer = user?.role === 'officer';

  // Filter & Sort Logic
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Officer role isolation
      if (isOfficer && user?.departmentId && c.departmentId && c.departmentId !== user.departmentId) {
        return false;
      }

      // Overdue toggle
      if (showOverdueOnly) {
        if (c.status === 'Resolved') return false;
        const sla = calculateComplaintSLA(c.createdAt, c.priority, c.status);
        if (!sla.isOverdue) return false;
      }

      // Status
      if (selectedStatus !== 'All' && c.status !== selectedStatus) {
        return false;
      }

      // Category
      if (selectedCategory !== 'All' && c.category !== selectedCategory) {
        return false;
      }

      // Priority
      if (selectedPriority !== 'All' && c.priority !== selectedPriority) {
        return false;
      }

      // Department
      if (selectedDepartment !== 'All' && c.departmentId !== selectedDepartment) {
        return false;
      }

      // Ward
      if (selectedWard !== 'All' && c.location.ward !== selectedWard) {
        return false;
      }

      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchesTicket = c.ticketNumber.toLowerCase().includes(q);
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesDesc = c.description.toLowerCase().includes(q);
        const matchesCitizen = c.citizenName.toLowerCase().includes(q);
        const matchesAddress = c.location.address.toLowerCase().includes(q);
        const matchesWard = c.location.ward.toLowerCase().includes(q);
        if (!matchesTicket && !matchesTitle && !matchesDesc && !matchesCitizen && !matchesAddress && !matchesWard) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'priority') {
        const priorityOrder: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      }
      if (sortBy === 'sla') {
        const slaA = calculateComplaintSLA(a.createdAt, a.priority, a.status);
        const slaB = calculateComplaintSLA(b.createdAt, b.priority, b.status);
        return slaB.percentElapsed - slaA.percentElapsed;
      }
      return 0;
    });
  }, [
    complaints,
    isOfficer,
    user?.departmentId,
    showOverdueOnly,
    selectedStatus,
    selectedCategory,
    selectedPriority,
    selectedDepartment,
    selectedWard,
    searchQuery,
    sortBy,
  ]);

  const handleExportCSV = () => {
    const headers = [
      'Ticket Number',
      'Citizen Name',
      'Citizen Phone',
      'Category',
      'Title',
      'Priority',
      'Status',
      'Department',
      'Assigned Officer',
      'Ward',
      'Address',
      'Latitude',
      'Longitude',
      'Created At',
    ];

    const rows = filteredComplaints.map((c) => [
      c.ticketNumber,
      `"${c.citizenName}"`,
      `"${c.citizenPhone}"`,
      c.category,
      `"${c.title.replace(/"/g, '""')}"`,
      c.priority,
      c.status,
      `"${c.departmentName || 'Unassigned'}"`,
      `"${c.assignedOfficerName || 'Unassigned'}"`,
      `"${c.location.ward}"`,
      `"${c.location.address.replace(/"/g, '""')}"`,
      c.location.latitude,
      c.location.longitude,
      c.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CivicConnect_Grievance_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1360px', margin: '0 auto' }}>
      <PageHeader
        title="Master Civic Grievance Registry"
        subtitle={`Centralized repository of all ${complaints.length} registered public complaints across municipal wards`}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download size={15} />}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/admin/map')}
              leftIcon={<MapPin size={15} />}
            >
              GIS Map View
            </Button>
          </div>
        }
      />

      {/* =====================================================================
          MULTI-FILTER & SEARCH TOOLBAR
          ===================================================================== */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardBody style={{ padding: '1.25rem' }}>
          {/* Top Search & Toggles Row */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ position: 'relative', flex: '1 1 320px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by ticket #, citizen, title, ward, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>

            {/* Overdue Urgent Filter Toggle */}
            <button
              type="button"
              onClick={() => setShowOverdueOnly(!showOverdueOnly)}
              className={`btn btn-sm ${showOverdueOnly ? 'btn-danger' : 'btn-outline'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <AlertTriangle size={14} />
              {showOverdueOnly ? 'Showing Overdue Only' : 'Filter Overdue SLA'}
            </button>

            {/* View Mode Switcher */}
            <div style={{ display: 'flex', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  padding: '0.4rem 0.65rem',
                  border: 'none',
                  backgroundColor: viewMode === 'table' ? 'var(--color-primary-800)' : 'var(--bg-surface)',
                  color: viewMode === 'table' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
                title="Data Table View"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                style={{
                  padding: '0.4rem 0.65rem',
                  border: 'none',
                  backgroundColor: viewMode === 'cards' ? 'var(--color-primary-800)' : 'var(--bg-surface)',
                  color: viewMode === 'cards' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
                title="Cards Grid View"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>

          {/* Bottom Dropdowns Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {/* Status Dropdown */}
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
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

            {/* Category Dropdown */}
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
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

            {/* Priority Dropdown */}
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
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

            {/* Department Dropdown */}
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
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
                    {d.name} ({d.shortCode || d.code || d.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Ward Dropdown */}
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
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

            {/* Sort By Dropdown */}
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                SORT BY
              </label>
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{ fontSize: 'var(--font-size-xs)' }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">Priority (Critical First)</option>
                <option value="sla">SLA Urgency</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Results Header Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
          Showing <strong>{filteredComplaints.length}</strong> of {complaints.length} grievances
          {showOverdueOnly && <span style={{ color: 'var(--color-danger-700)', fontWeight: 700 }}> (Overdue SLA Only)</span>}
        </div>
      </div>

      {/* =====================================================================
          RESULTS VIEW: TABLE OR CARDS
          ===================================================================== */}
      {isLoading ? (
        <LoadingState message="Loading master grievance registry..." />
      ) : filteredComplaints.length === 0 ? (
        <EmptyState
          title="No Grievances Match Filters"
          description="Try broadening your search term or clearing one of the active dropdown filters."
          actionText="Reset All Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedStatus('All');
            setSelectedCategory('All');
            setSelectedPriority('All');
            setSelectedDepartment('All');
            setSelectedWard('All');
            setShowOverdueOnly(false);
          }}
        />
      ) : viewMode === 'table' ? (
        <Card>
          <CardBody style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-surface-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-default)' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Ticket ID</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Category &amp; Title</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Citizen Info</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Ward / Location</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Priority</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Department &amp; Officer</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1rem' }}>SLA Target</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Workflow</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.map((c) => (
                    <tr
                      key={c.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                      onClick={() => navigate(`/admin/complaints/${c.id}`)}
                    >
                      {/* Ticket */}
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-primary-800)' }}>
                        {c.ticketNumber}
                      </td>

                      {/* Title & Category */}
                      <td style={{ padding: '0.85rem 1rem', maxWidth: '240px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <CategoryBadge category={c.category} />
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.title}
                          </span>
                        </div>
                      </td>

                      {/* Citizen */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.citizenName}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{c.citizenPhone}</div>
                      </td>

                      {/* Location */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.location.ward}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.6875rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.location.address}
                        </div>
                      </td>

                      {/* Priority */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <PriorityBadge priority={c.priority} />
                      </td>

                      {/* Department */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {c.departmentName || 'Unassigned'}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                          {c.assignedOfficerName ? `Officer: ${c.assignedOfficerName}` : 'Pending Officer'}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <StatusBadge status={c.status} />
                      </td>

                      {/* SLA */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <SLABadge
                          createdAt={c.createdAt}
                          priority={c.priority}
                          status={c.status}
                          resolvedAt={c.resolutionDetails?.resolvedAt}
                        />
                      </td>

                      {/* Action */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/complaints/${c.id}`);
                          }}
                        >
                          Resolve / Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      ) : (
        /* Cards Grid View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filteredComplaints.map((c) => (
            <Card
              key={c.id}
              interactive
              onClick={() => navigate(`/admin/complaints/${c.id}`)}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <CardBody style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-800)' }}>
                    {c.ticketNumber}
                  </span>
                  <StatusBadge status={c.status} />
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <CategoryBadge category={c.category} />
                  <PriorityBadge priority={c.priority} />
                </div>

                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {c.title}
                </h4>

                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem', flex: 1 }}>
                  {c.description.length > 100 ? `${c.description.slice(0, 100)}...` : c.description}
                </p>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', fontSize: 'var(--font-size-xs)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Location:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.location.ward}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Department:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.departmentName || 'Unassigned'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>SLA Status:</span>
                    <SLABadge
                      createdAt={c.createdAt}
                      priority={c.priority}
                      status={c.status}
                      resolvedAt={c.resolutionDetails?.resolvedAt}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
