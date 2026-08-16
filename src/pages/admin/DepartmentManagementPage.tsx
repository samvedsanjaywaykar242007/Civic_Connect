import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Mail,
  Phone,
  FileCheck,
  Search,
  Activity,
} from 'lucide-react';
import { departmentService } from '../../services/departmentService';
import { complaintService } from '../../services/complaintService';
import { mockDataService } from '../../services/mockDataService';
import { Department, UserProfile, Complaint } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { BarChart } from '../../components/analytics/BarChart';
import { LoadingState } from '../../components/common/LoadingState';

export const DepartmentManagementPage: React.FC = () => {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [officers, setOfficers] = useState<UserProfile[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'departments' | 'officers'>('departments');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        const [depts, allUsers, allComplaints] = await Promise.all([
          departmentService.getDepartments(),
          mockDataService.getUsers(),
          complaintService.getComplaints(),
        ]);
        setDepartments(depts);
        setOfficers(allUsers.filter((u) => u.role === 'officer' || u.role === 'admin'));
        setComplaints(allComplaints);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredDepartments = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.shortCode && d.shortCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.code && d.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.headOfficer && d.headOfficer.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.headOfficerName && d.headOfficerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredOfficers = officers.filter(
    (o) =>
      o.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.departmentName && o.departmentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      o.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const workloadChartData = departments.map((d) => {
    const deptComplaints = complaints.filter((c) => c.departmentId === d.id);
    const openCount = deptComplaints.filter((c) => c.status !== 'Resolved').length;
    return {
      label: d.shortCode || d.code || d.name,
      value: openCount,
      subLabel: `${deptComplaints.length} Total`,
      color: openCount > 4 ? 'var(--color-danger-600)' : 'var(--color-primary-700)',
    };
  });

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1240px', margin: '0 auto' }}>
      <PageHeader
        title="Department &amp; Nodal Officer Roster"
        subtitle="Municipal administrative hierarchy, nodal assignments, and operational workload balancing"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/complaints')}
            leftIcon={<FileCheck size={15} />}
          >
            View Department Grievances
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading department directories and officer profiles..." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Top KPI & Workload Summary Row */}
          <div className="grid grid-cols-3 gap-6">
            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-800)' }}>
                  <Building2 size={26} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>{departments.length}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Registered Civic Departments</div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'hsl(150, 80%, 93%)', color: 'hsl(155, 85%, 26%)' }}>
                  <Users size={26} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>{officers.length}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Nodal Officers &amp; Admins</div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'hsl(200, 95%, 94%)', color: 'hsl(200, 85%, 32%)' }}>
                  <Activity size={26} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>
                    {complaints.filter((c) => c.status !== 'Resolved').length}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Total Active Caseload</div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Department Workload Balance Bar Chart */}
          <Card>
            <CardHeader>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>
                Department Active Workload Distribution (Open Grievances)
              </h4>
            </CardHeader>
            <CardBody style={{ padding: '1.25rem' }}>
              <BarChart data={workloadChartData} horizontal valueSuffix="open tickets" />
            </CardBody>
          </Card>

          {/* Tabs & Search Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setActiveTab('departments')}
                className={`btn btn-sm ${activeTab === 'departments' ? 'btn-primary' : 'btn-outline'}`}
              >
                Civic Departments ({departments.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('officers')}
                className={`btn btn-sm ${activeTab === 'officers' ? 'btn-primary' : 'btn-outline'}`}
              >
                Nodal Officers ({officers.length})
              </button>
            </div>

            <div style={{ position: 'relative', width: '280px' }}>
              <input
                type="text"
                className="form-input"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: 'var(--font-size-xs)' }}
              />
              <Search
                size={14}
                color="var(--text-muted)"
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* =================================================================
              TAB 1: DEPARTMENTS DIRECTORY
              ================================================================= */}
          {activeTab === 'departments' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {filteredDepartments.map((dept) => {
                const deptComplaints = complaints.filter((c) => c.departmentId === dept.id);
                const openCount = deptComplaints.filter((c) => c.status !== 'Resolved').length;
                const resolvedCount = deptComplaints.filter((c) => c.status === 'Resolved').length;

                return (
                  <Card key={dept.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-primary-800)', backgroundColor: 'var(--color-primary-50)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                          {dept.shortCode || dept.code || dept.name}
                        </span>
                        <h3 style={{ fontSize: 'var(--font-size-base)', marginTop: '0.5rem' }}>{dept.name}</h3>
                      </div>
                      <span className="badge badge-success" style={{ fontSize: '10px' }}>Active</span>
                    </CardHeader>
                    <CardBody style={{ flex: 1, display: 'flex', flexDirection: 'column', fontSize: 'var(--font-size-xs)' }}>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem', flex: 1 }}>
                        {dept.description || `${dept.name} handles civic operational tasks across wards.`}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginBottom: '1rem' }}>
                        <div>
                          <strong>Nodal Head Officer:</strong> {dept.headOfficer || dept.headOfficerName || 'Lead Nodal Officer'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                          <Mail size={13} /> {dept.contactEmail}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                          <Phone size={13} /> {dept.contactPhone}
                        </div>
                      </div>

                      {/* Workload Stats Strip */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '0.5rem',
                          padding: '0.75rem',
                          backgroundColor: 'var(--bg-surface-subtle)',
                          borderRadius: 'var(--radius-md)',
                          textAlign: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 800, color: openCount > 0 ? 'var(--color-danger-700)' : 'var(--text-primary)' }}>
                            {openCount}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Active Tickets</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 800, color: 'var(--color-success-700)' }}>
                            {resolvedCount}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Resolved Tickets</div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}

          {/* =================================================================
              TAB 2: NODAL OFFICERS DIRECTORY
              ================================================================= */}
          {activeTab === 'officers' && (
            <Card>
              <CardBody style={{ padding: 0 }}>
                <div className="table-responsive">
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-surface-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-default)' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Officer Name</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Role Authority</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Jurisdiction Ward</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Contact Info</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Active Load</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Security Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOfficers.map((off) => {
                        const assignedComplaints = complaints.filter(
                          (c) => c.assignedOfficerName === off.fullName || (off.departmentId && c.departmentId === off.departmentId)
                        );
                        const openCount = assignedComplaints.filter((c) => c.status !== 'Resolved').length;

                        return (
                          <tr key={off.uid} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {off.fullName}
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span
                                className={`badge ${off.role === 'admin' ? 'badge-priority-critical' : 'badge-priority-high'}`}
                                style={{ fontSize: '10px' }}
                              >
                                {off.role === 'admin' ? 'Super Administrator' : 'Nodal Officer'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                              {off.departmentName || 'Central Administration'}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                              {off.ward}, {off.district}
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ color: 'var(--text-primary)' }}>{off.email}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{off.phoneNumber}</div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{ fontWeight: 700, color: openCount > 3 ? 'var(--color-danger-700)' : 'var(--color-primary-800)' }}>
                                {openCount} open
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                              <span className="badge badge-success" style={{ fontSize: '10px' }}>
                                ✓ Verified Gov ID
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
