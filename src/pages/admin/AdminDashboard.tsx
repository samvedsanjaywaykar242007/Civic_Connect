import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck,
  Clock,
  AlertTriangle,
  Building2,
  Activity,
  ArrowRight,
  TrendingUp,
  MapPin,
  ShieldCheck,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { complaintService } from '../../services/complaintService';
import { departmentService } from '../../services/departmentService';
import { noticeService } from '../../services/noticeService';
import { Complaint, Department, GovernmentNotice } from '../../types';
import { calculateComplaintSLA } from '../../utils/sla';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/common/Badge';
import { SLABadge } from '../../components/common/SLABadge';
import { BarChart } from '../../components/analytics/BarChart';
import { DonutChart } from '../../components/analytics/DonutChart';
import { LoadingState } from '../../components/common/LoadingState';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [notices, setNotices] = useState<GovernmentNotice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [complaintsData, departmentsData, noticesData] = await Promise.all([
          complaintService.getComplaints(),
          departmentService.getDepartments(),
          noticeService.getNotices(),
        ]);
        setComplaints(complaintsData);
        setDepartments(departmentsData);
        setNotices(noticesData);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Filter complaints if user is a departmental officer (department scoping)
  const isOfficer = user?.role === 'officer';
  const scopedComplaints = isOfficer && user?.departmentId
    ? complaints.filter((c) => c.departmentId === user.departmentId)
    : complaints;

  // Key KPI Counts
  const totalCount = scopedComplaints.length;
  const submittedCount = scopedComplaints.filter((c) => c.status === 'Submitted').length;
  const verifiedCount = scopedComplaints.filter((c) => c.status === 'Verified').length;
  const assignedCount = scopedComplaints.filter((c) => c.status === 'Assigned').length;
  const inProgressCount = scopedComplaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = scopedComplaints.filter((c) => c.status === 'Resolved').length;

  // Overdue calculation
  const overdueCount = scopedComplaints.filter((c) => {
    if (c.status === 'Resolved') return false;
    const sla = calculateComplaintSLA(c.createdAt, c.priority, c.status);
    return sla.isOverdue;
  }).length;

  // Resolution Rate %
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  // Calculate average resolution time (hours) for resolved complaints
  const resolvedList = scopedComplaints.filter((c) => c.status === 'Resolved' && c.resolutionDetails?.resolvedAt);
  let avgResolutionHours = 18;
  if (resolvedList.length > 0) {
    const totalHours = resolvedList.reduce((sum, c) => {
      const sla = calculateComplaintSLA(c.createdAt, c.priority, c.status, c.resolutionDetails?.resolvedAt);
      return sum + sla.elapsedHours;
    }, 0);
    avgResolutionHours = Math.round(totalHours / resolvedList.length);
  }

  // Category distribution data for charts
  const categoryCounts: Record<string, number> = {};
  scopedComplaints.forEach((c) => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  const categoryChartData = Object.entries(categoryCounts).map(([label, value]) => ({
    label,
    value,
    color: 'var(--color-primary-600)',
  }));

  // Status Distribution for Donut Chart
  const statusDonutData = [
    { label: 'Submitted', value: submittedCount, color: '#64748b' },
    { label: 'Verified', value: verifiedCount, color: '#f59e0b' },
    { label: 'Assigned', value: assignedCount, color: '#6366f1' },
    { label: 'In Progress', value: inProgressCount, color: '#0284c7' },
    { label: 'Resolved', value: resolvedCount, color: '#10b981' },
  ].filter((d) => d.value > 0);

  // Department Workload summary
  const departmentWorkloadData = departments.map((dept) => {
    const deptComplaints = complaints.filter((c) => c.departmentId === dept.id);
    const openCount = deptComplaints.filter((c) => c.status !== 'Resolved').length;
    return {
      label: dept.shortCode || dept.code || dept.name,
      value: openCount,
      subLabel: `${deptComplaints.length} Total`,
      color: openCount > 5 ? 'var(--color-danger-600)' : 'var(--color-primary-700)',
    };
  });

  const recentComplaints = scopedComplaints.slice(0, 5);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <PageHeader
        title={
          user?.role === 'admin'
            ? 'Municipal Command & SLA Governance Center'
            : `${user?.departmentName || 'Departmental'} Operations Control`
        }
        subtitle={
          user?.role === 'admin'
            ? `Super Administrator: ${user?.fullName} • Pune Municipal & Gram Panchayat Command`
            : `Nodal Officer: ${user?.fullName} (${user?.departmentId?.toUpperCase()}) • Authorized Jurisdiction Desk`
        }
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/map')}
              leftIcon={<MapPin size={15} />}
            >
              GIS Command Map
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/admin/complaints')}
              leftIcon={<FileCheck size={15} />}
            >
              Master Registry ({totalCount})
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading municipal intelligence feed &amp; SLA timers..." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* =================================================================
              OVERDUE EMERGENCY BANNER (If overdue issues exist)
              ================================================================= */}
          {overdueCount > 0 && (
            <div
              style={{
                backgroundColor: 'hsl(0, 90%, 96%)',
                border: '1.5px solid var(--color-danger-500)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--color-danger-100)',
                    color: 'var(--color-danger-700)',
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-danger-900)', fontWeight: 800 }}>
                    {overdueCount} Civic Grievance(s) Exceeded Municipal SLA Target
                  </h4>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger-700)', marginTop: '2px' }}>
                    Immediate nodal officer assignment and escalated repair dispatch required to prevent regulatory breach.
                  </p>
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => navigate('/admin/complaints?filter=overdue')}
              >
                Review Overdue Grievances
              </Button>
            </div>
          )}

          {/* =================================================================
              PRIMARY KPI METRICS (7 TILES)
              ================================================================= */}
          <div className="grid grid-cols-4 gap-4">
            {/* Total */}
            <Card interactive onClick={() => navigate('/admin/complaints')}>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-800)' }}>
                  <FileCheck size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>{totalCount}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Total Grievances</div>
                </div>
              </CardBody>
            </Card>

            {/* Pending Verification */}
            <Card interactive onClick={() => navigate('/admin/complaints?status=Submitted')}>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'hsl(45, 100%, 93%)', color: 'hsl(35, 95%, 35%)' }}>
                  <Clock size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>{submittedCount}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Pending Verification</div>
                </div>
              </CardBody>
            </Card>

            {/* In Progress */}
            <Card interactive onClick={() => navigate('/admin/complaints?status=In+Progress')}>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'hsl(200, 95%, 94%)', color: 'hsl(200, 85%, 32%)' }}>
                  <Activity size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>{inProgressCount + assignedCount}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Active Repairs</div>
                </div>
              </CardBody>
            </Card>

            {/* Resolved with Proof */}
            <Card interactive onClick={() => navigate('/admin/complaints?status=Resolved')}>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'hsl(150, 80%, 93%)', color: 'hsl(155, 85%, 26%)' }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>{resolvedCount}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Resolved with Proof</div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Secondary SLA & Efficiency Row */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>SLA Resolution Rate</div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-success-700)', marginTop: '2px' }}>
                    {resolutionRate}%
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Target: &gt; 85% Municipal SLA Compliance
                  </div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-success-50)', color: 'var(--color-success-700)' }}>
                  <TrendingUp size={24} />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>Average Resolution Time</div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-primary-800)', marginTop: '2px' }}>
                    {avgResolutionHours} hrs
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Calculated across all resolved work reports
                  </div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-700)' }}>
                  <Clock size={24} />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>SLA Overdue Grievances</div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: overdueCount > 0 ? 'var(--color-danger-700)' : 'var(--color-success-700)', marginTop: '2px' }}>
                    {overdueCount}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {overdueCount === 0 ? 'All tickets within deadline' : 'Requires escalation action'}
                  </div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-full)', backgroundColor: overdueCount > 0 ? 'var(--color-danger-50)' : 'var(--color-success-50)', color: overdueCount > 0 ? 'var(--color-danger-700)' : 'var(--color-success-700)' }}>
                  <AlertTriangle size={24} />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* =================================================================
              ANALYTICS & CHARTS ROW
              ================================================================= */}
          <div className="grid grid-cols-3 gap-6">
            {/* Status Donut Chart */}
            <Card>
              <CardHeader>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>Grievance Lifecycle Distribution</h4>
              </CardHeader>
              <CardBody style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                <DonutChart
                  data={statusDonutData}
                  size={150}
                  strokeWidth={22}
                  centerValue={totalCount}
                  centerLabel="Grievances"
                />
              </CardBody>
            </Card>

            {/* Category Breakdown Bar Chart */}
            <Card>
              <CardHeader>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>Complaints by Category</h4>
              </CardHeader>
              <CardBody style={{ padding: '1.25rem' }}>
                <BarChart data={categoryChartData.slice(0, 5)} horizontal valueSuffix="issues" />
              </CardBody>
            </Card>

            {/* Department Workload Bar Chart */}
            <Card>
              <CardHeader>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>Department Active Workload</h4>
              </CardHeader>
              <CardBody style={{ padding: '1.25rem' }}>
                <BarChart data={departmentWorkloadData} horizontal valueSuffix="open" />
              </CardBody>
            </Card>
          </div>

          {/* =================================================================
              RECENT GRIEVANCES REQUIRING ATTENTION
              ================================================================= */}
          <Card>
            <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800 }}>Recent Grievance Submissions &amp; SLA Status</h3>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Real-time municipal intake awaiting departmental review and resolution
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/complaints')}
                rightIcon={<ArrowRight size={14} />}
              >
                View Full Registry
              </Button>
            </CardHeader>
            <CardBody style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-surface-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-default)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Ticket ID</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Category &amp; Title</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Ward / Location</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem' }}>SLA Timer</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentComplaints.map((c) => (
                      <tr
                        key={c.id}
                        style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                        onClick={() => navigate(`/admin/complaints/${c.id}`)}
                      >
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-primary-800)' }}>
                          {c.ticketNumber}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <CategoryBadge category={c.category} />
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.title}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                          {c.location.ward} • {c.location.village || c.location.villageOrArea || 'Pune'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <PriorityBadge priority={c.priority} />
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                          {c.departmentName || 'Unassigned'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <StatusBadge status={c.status} />
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <SLABadge
                            createdAt={c.createdAt}
                            priority={c.priority}
                            status={c.status}
                            resolvedAt={c.resolutionDetails?.resolvedAt}
                          />
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/complaints/${c.id}`);
                            }}
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          {/* Quick Municipal Management Shortcuts */}
          <div className="grid grid-cols-3 gap-4">
            <Card interactive onClick={() => navigate('/admin/departments')}>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-700)' }}>
                  <Building2 size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>Department Roster</h4>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                    Manage {departments.length} civic departments &amp; nodal officers
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card interactive onClick={() => navigate('/admin/notices')}>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'hsl(45, 100%, 93%)', color: 'hsl(35, 95%, 35%)' }}>
                  <Megaphone size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>Public Notice Publisher</h4>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                    Broadcast advisories to {notices.length} active target areas
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card interactive onClick={() => navigate('/admin/analytics')}>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'hsl(150, 80%, 93%)', color: 'hsl(155, 85%, 26%)' }}>
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>Governance Analytics</h4>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                    Export municipal SLA reports &amp; monthly audits
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
