import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/common/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { complaintService } from '../../services/complaintService';
import { departmentService } from '../../services/departmentService';
import { noticeService } from '../../services/noticeService';
import { mockDataService } from '../../services/mockDataService';
import { Complaint, Department, GovernmentNotice, UserProfile } from '../../types';
import {
  FileCheck,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  BarChart3,
  Megaphone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminDashboardFoundation: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    complaintService.getComplaints().then(setComplaints);
    departmentService.getDepartments().then(setDepartments);
  }, []);

  const total = complaints.length;
  const submitted = complaints.filter((c) => c.status === 'Submitted').length;
  const inProgress = complaints.filter((c) => c.status === 'In Progress' || c.status === 'Assigned').length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Municipal Governance &amp; SLA Control Center"
        subtitle={`Welcome, ${user?.fullName} • ${user?.role === 'admin' ? 'District Municipal Headquarters' : user?.departmentName || 'Departmental Office'}`}
        actions={
          <Button variant="primary" onClick={() => navigate('/admin/complaints')} leftIcon={<FileCheck size={16} />}>
            Manage Active Grievances ({total})
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '2rem' }}>
        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-800)' }}>
              <FileCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>{total}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Total Complaints</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'hsl(45, 100%, 93%)', color: 'hsl(35, 95%, 35%)' }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>{submitted}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Pending Verification</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'hsl(200, 95%, 94%)', color: 'hsl(200, 85%, 32%)' }}>
              <Building2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>{inProgress}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Under Repair</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'hsl(150, 80%, 93%)', color: 'hsl(155, 85%, 26%)' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>{resolved}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Resolved with Proof</div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Department SLA Matrix */}
      <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '1rem' }}>Departmental Performance &amp; Active SLA</h3>
      <div className="grid grid-cols-3 gap-4" style={{ marginBottom: '2rem' }}>
        {departments.map((d) => (
          <Card key={d.id}>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--color-primary-800)', fontSize: 'var(--font-size-sm)' }}>{d.code}</strong>
                <span className="badge badge-priority-low">{d.slaTargetHours}h SLA</span>
              </div>
              <h4 style={{ fontSize: 'var(--font-size-sm)', marginBottom: '0.75rem' }}>{d.name}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                <span>Active: <strong>{d.activeTicketsCount}</strong></span>
                <span>Resolved: <strong>{d.resolvedTicketsCount}</strong></span>
                <span>Avg: <strong>{d.averageResolutionHours}h</strong></span>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const AdminComplaintsFoundation: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    complaintService.getComplaints().then(setComplaints);
  }, []);

  return (
    <div>
      <PageHeader title="Master Grievance Registry" subtitle="Review, assign departments, generate AI briefs, and verify resolution evidence" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {complaints.map((c) => (
          <Card key={c.id}>
            <CardBody style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{c.ticketNumber}</span>
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                  <CategoryBadge category={c.category} />
                </div>
                <h4>{c.title}</h4>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                  <span>Citizen: <strong>{c.citizenName}</strong></span>
                  <span>Ward: <strong>{c.location.ward}</strong></span>
                  <span>Dept: <strong>{c.departmentName || 'Unassigned'}</strong></span>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const AdminMapFoundation: React.FC = () => {
  return (
    <div>
      <PageHeader title="GIS Command Center Map" subtitle="Geographic heat-density and clustered grievance distribution" />
      <Card>
        <CardBody style={{ textAlign: 'center', padding: '3rem' }}>
          <MapPin size={48} color="#2563EB" style={{ margin: '0 auto 1rem auto' }} />
          <h3>Full-Screen Municipal GIS Command Map</h3>
          <p style={{ maxWidth: '520px', margin: '0 auto 1rem auto', fontSize: 'var(--font-size-sm)' }}>
            Google Maps Platform advanced marker clustering and inspection workbench will be fully rendered in Phase 5.
          </p>
        </CardBody>
      </Card>
    </div>
  );
};

export const AdminAnalyticsFoundation: React.FC = () => {
  return (
    <div>
      <PageHeader title="Civic Analytics &amp; SLA Compliance" subtitle="Resolution velocity, category breakdown, and ward grievance density" />
      <Card>
        <CardBody style={{ textAlign: 'center', padding: '3rem' }}>
          <BarChart3 size={48} color="#F59E0B" style={{ margin: '0 auto 1rem auto' }} />
          <h3>Interactive Municipal KPI &amp; Analytics Dashboard</h3>
          <p style={{ maxWidth: '520px', margin: '0 auto 1rem auto', fontSize: 'var(--font-size-sm)' }}>
            Resolution velocity charts, ward density heatmaps, and category breakdowns will be implemented in Phase 5.
          </p>
        </CardBody>
      </Card>
    </div>
  );
};

export const DepartmentManagementFoundation: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  useEffect(() => {
    departmentService.getDepartments().then(setDepartments);
  }, []);

  return (
    <div>
      <PageHeader title="Department Management" subtitle="Designate municipal departments, nodal officers, and SLA response targets" />
      <div className="grid grid-cols-2 gap-4">
        {departments.map((d) => (
          <Card key={d.id}>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="badge badge-priority-low">{d.code}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>SLA: {d.slaTargetHours} Hours</span>
              </div>
              <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: '0.25rem' }}>{d.name}</h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Head Officer: <strong>{d.headOfficerName}</strong> ({d.contactEmail})
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {(d.categoriesHandled || []).map((c) => (
                  <CategoryBadge key={c} category={c} />
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const CitizenDirectoryFoundation: React.FC = () => {
  const [citizens, setCitizens] = useState<UserProfile[]>([]);
  useEffect(() => {
    mockDataService.getUsers().then((users) => {
      setCitizens(users.filter((u) => u.role === 'citizen'));
    });
  }, []);

  return (
    <div>
      <PageHeader title="Citizen Registry (Read-Only)" subtitle="Registered citizens across rural Gram Panchayats and municipal wards" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {citizens.map((c) => (
          <Card key={c.uid}>
            <CardBody style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4>{c.fullName}</h4>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                  <span>Email: {c.email}</span>
                  <span>Mobile: {c.phoneNumber}</span>
                  <span>Ward: {c.ward}</span>
                  <span>District: {c.district}, {c.state}</span>
                </div>
              </div>
              <span className="badge badge-category">Verified Citizen</span>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const AdminNoticesFoundation: React.FC = () => {
  const [notices, setNotices] = useState<GovernmentNotice[]>([]);
  useEffect(() => {
    noticeService.getNotices().then(setNotices);
  }, []);

  return (
    <div>
      <PageHeader
        title="Public Civic Notice Publisher"
        subtitle="Broadcast urgent disaster warnings and scheduled municipal advisories"
        actions={<Button variant="primary" leftIcon={<Megaphone size={16} />}>Publish New Notice</Button>}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {notices.map((n) => (
          <Card key={n.id}>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--color-primary-800)' }}>{n.departmentName}</strong>
                <span className={`badge ${n.priority === 'Urgent' ? 'badge-priority-high' : 'badge-priority-low'}`}>{n.priority}</span>
              </div>
              <h4>{n.title}</h4>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>{n.content}</p>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Target: {n.targetArea} • Issued by: {n.issuedBy}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};
