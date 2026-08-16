import React, { useEffect, useState } from 'react';
import {
  Megaphone,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { noticeService } from '../../services/noticeService';
import { departmentService } from '../../services/departmentService';
import { GovernmentNotice, Department, NoticePriority } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';

export const NoticePublisherPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [notices, setNotices] = useState<GovernmentNotice[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [priority, setPriority] = useState<NoticePriority>('Normal');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [targetArea, setTargetArea] = useState<string>('All Wards (Municipal Jurisdiction)');
  const [validUntil, setValidUntil] = useState<string>('2026-08-31');

  const loadNotices = async () => {
    try {
      const [noticesData, deptsData] = await Promise.all([
        noticeService.getNotices(),
        departmentService.getDepartments(),
      ]);
      setNotices(noticesData);
      setDepartments(deptsData);
      if (deptsData.length > 0) {
        setDepartmentId(deptsData[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toastError('Validation Error', 'Title and content are required.');
      return;
    }

    const dept = departments.find((d) => d.id === departmentId);

    setIsPublishing(true);
    try {
      const newNotice = await noticeService.createNotice({
        title: title.trim(),
        content: content.trim(),
        departmentId: dept?.id || 'admin',
        departmentName: dept?.name || 'Municipal Control Desk',
        targetArea: targetArea.trim() || 'All Wards',
        priority,
        issuedBy: user?.fullName || 'Municipal Commissioner',
        active: true,
        validUntil,
      });

      setNotices((prev) => [newNotice, ...prev]);
      setShowCreateModal(false);
      setTitle('');
      setContent('');
      success('Notice Published Successfully!', 'Advisory is now live across the Citizen Portal.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Publishing failed';
      toastError('Error', msg);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleToggleActive = (noticeId: string) => {
    setNotices((prev) =>
      prev.map((n) => {
        if (n.id === noticeId) {
          const nextActive = !n.active;
          if (nextActive) {
            info('Notice Activated', `"${n.title}" is now visible to citizens.`);
          } else {
            info('Notice Un-published', `"${n.title}" has been withdrawn from citizen view.`);
          }
          return { ...n, active: nextActive };
        }
        return n;
      })
    );
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1160px', margin: '0 auto' }}>
      <PageHeader
        title="Municipal Public Notice Publisher"
        subtitle="Broadcast urgent safety advisories, water supply disruptions, and disaster alerts directly to citizens"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            leftIcon={<PlusCircle size={16} />}
          >
            Draft New Advisory
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading municipal notice archives..." />
      ) : notices.length === 0 ? (
        <EmptyState
          title="No Published Notices"
          description="There are currently no active public alerts. Draft an advisory to inform citizens of utility works."
          actionText="Create Notice"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {notices.map((n) => {
            const isUrgent = n.priority === 'Emergency Alert' || n.priority === 'Urgent';

            return (
              <Card
                key={n.id}
                style={{
                  borderLeft: isUrgent ? '4px solid var(--color-danger-600)' : '4px solid var(--color-primary-600)',
                  opacity: n.active ? 1 : 0.65,
                }}
              >
                <CardBody style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            color: isUrgent ? 'var(--color-danger-700)' : 'var(--color-primary-700)',
                            backgroundColor: isUrgent ? 'var(--color-danger-50)' : 'var(--color-gray-100)',
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          {n.priority}
                        </span>
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-primary-800)' }}>
                          {n.departmentName}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          Published: {formatDate(n.createdAt)}
                        </span>
                      </div>

                      <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        {n.title}
                      </h3>

                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem', maxWidth: '820px' }}>
                        {n.content}
                      </p>

                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        <span>📍 Target Area: <strong>{n.targetArea}</strong></span>
                        <span>🏛️ Issued By: <strong>{n.issuedBy}</strong></span>
                        <span>⏳ Valid Until: <strong>{formatDate(n.validUntil)}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${n.active ? 'badge-success' : 'badge-priority-low'}`} style={{ fontSize: '10px' }}>
                        {n.active ? 'Live to Citizens' : 'Unpublished / Draft'}
                      </span>
                      <Button
                        variant={n.active ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleActive(n.id)}
                      >
                        {n.active ? 'Withdraw' : 'Re-Publish'}
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          CREATE ADVISORY MODAL
          ===================================================================== */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Publish Official Municipal Public Notice"
          size="lg"
        >
          <form onSubmit={handleCreateNotice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: 'var(--font-size-sm)' }}>
            <div>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                Notice Headline / Subject <span style={{ color: 'var(--color-danger-600)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 24-Hour Drinking Water Pipeline Overhaul &amp; Shutdown"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                  Urgency / Priority
                </label>
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as NoticePriority)}
                >
                  <option value="Normal">Normal Announcement</option>
                  <option value="Urgent">Urgent Public Advisory</option>
                  <option value="Emergency Alert">Emergency / Disaster Alert</option>
                </select>
              </div>

              <div>
                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                  Issuing Department
                </label>
                <select
                  className="form-select"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.shortCode || d.code || d.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                  Target Jurisdiction / Wards
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ward 3, Ward 4 &amp; Station Road"
                  value={targetArea}
                  onChange={(e) => setTargetArea(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                  Valid Until Date
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                Full Advisory Announcement <span style={{ color: 'var(--color-danger-600)' }}>*</span>
              </label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Detail the timing, affected lanes, alternative routes, emergency contacts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isPublishing}
                leftIcon={<Megaphone size={16} />}
              >
                Publish Live to Citizen Portal
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
