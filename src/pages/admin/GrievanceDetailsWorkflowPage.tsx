import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Star,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { complaintService } from '../../services/complaintService';
import { departmentService } from '../../services/departmentService';
import { geminiService } from '../../services/geminiService';
import {
  Complaint,
  Department,
  ComplaintUpdate,
  ResolutionEvidence,
} from '../../types';
import { COMPLAINT_STATUSES } from '../../utils/constants';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/common/Badge';
import { SLABadge } from '../../components/common/SLABadge';
import { CivicMap } from '../../components/map/CivicMap';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { formatDate, formatDateTime } from '../../utils/formatters';

// High-fidelity sample after-repair evidence images for demonstration
const SAMPLE_AFTER_REPAIRS = {
  pothole: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80',
  water: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop&q=80',
  garbage: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800&auto=format&fit=crop&q=80',
  street_light: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80',
  drainage: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80',
};

export const GrievanceDetailsWorkflowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [timeline, setTimeline] = useState<ComplaintUpdate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Workflow Action States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionNotes, setActionNotes] = useState<string>('');

  // Department & Officer Assignment State
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedOfficerName, setSelectedOfficerName] = useState<string>('');

  // Resolution Modal State
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);
  const [resolutionDescription, setResolutionDescription] = useState<string>('');
  const [afterRepairPhotos, setAfterRepairPhotos] = useState<string[]>([]);

  // AI Executive Brief State
  const [isGeneratingAiBrief, setIsGeneratingAiBrief] = useState<boolean>(false);
  const [aiBrief, setAiBrief] = useState<{
    executiveSummary: string;
    recommendedAction: string;
    equipmentRequired: string[];
    estimatedCrewSize: number;
  } | null>(null);

  const loadComplaintData = async () => {
    if (!id) return;
    try {
      const [comp, depts] = await Promise.all([
        complaintService.getComplaintById(id),
        departmentService.getDepartments(),
      ]);

      if (comp) {
        setComplaint(comp);
        setSelectedDeptId(comp.departmentId || depts[0]?.id || '');
        setSelectedOfficerName(comp.assignedOfficerName || '');
        const updates = await complaintService.getComplaintUpdates(comp.id);
        setTimeline(updates);
      }
      setDepartments(depts);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComplaintData();
  }, [id]);

  if (isLoading) {
    return <LoadingState message="Loading grievance dossier and audit history..." />;
  }

  if (!complaint) {
    return (
      <Card>
        <CardBody style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertTriangle size={40} color="var(--color-danger-600)" style={{ margin: '0 auto 1rem auto' }} />
          <h3>Grievance Record Not Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            The requested grievance with ID "{id}" does not exist in the municipal registry.
          </p>
          <Button variant="primary" onClick={() => navigate('/admin/complaints')}>
            Return to Master Registry
          </Button>
        </CardBody>
      </Card>
    );
  }

  const currentStepIndex = COMPLAINT_STATUSES.findIndex((s) => s.key === complaint.status);

  // ---------------------------------------------------------------------------
  // Lifecycle Actions
  // ---------------------------------------------------------------------------

  // Action 1: Verify Grievance
  const handleVerifyComplaint = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const updated = await complaintService.transitionStatus(
        complaint.id,
        'Verified',
        user,
        actionNotes.trim() || 'Verified complaint details against municipal GIS registry.'
      );
      setComplaint(updated);
      setActionNotes('');
      const updates = await complaintService.getComplaintUpdates(updated.id);
      setTimeline(updates);
      success('Grievance Verified', 'Complaint status advanced to Verified.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      toastError('Action Failed', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action 2: Assign Department & Nodal Officer
  const handleAssignDepartment = async () => {
    if (!user) return;
    if (!selectedDeptId) {
      toastError('Selection Required', 'Please select a responsible department.');
      return;
    }
    const dept = departments.find((d) => d.id === selectedDeptId);
    if (!dept) return;

    setIsProcessing(true);
    try {
      const updated = await complaintService.transitionStatus(
        complaint.id,
        'Assigned',
        user,
        actionNotes.trim() || `Assigned to ${dept.name}. Nodal Officer: ${selectedOfficerName || dept.headOfficerName || dept.headOfficer || 'Lead Officer'}`,
        {
          departmentId: dept.id,
          departmentName: dept.name,
          assignedOfficerId: (dept.shortCode || dept.code || dept.id).toLowerCase() + '_lead',
          assignedOfficerName: selectedOfficerName || dept.headOfficerName || dept.headOfficer || 'Lead Officer',
        }
      );
      setComplaint(updated);
      setActionNotes('');
      const updates = await complaintService.getComplaintUpdates(updated.id);
      setTimeline(updates);
      success('Department Assigned', `Complaint routed to ${dept.shortCode || dept.code || dept.name}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Assignment failed';
      toastError('Action Failed', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action 3: Start Work / Mark In Progress
  const handleStartWork = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const updated = await complaintService.transitionStatus(
        complaint.id,
        'In Progress',
        user,
        actionNotes.trim() || 'Field crew deployed on site. Heavy repair operations commenced.'
      );
      setComplaint(updated);
      setActionNotes('');
      const updates = await complaintService.getComplaintUpdates(updated.id);
      setTimeline(updates);
      success('Work Commenced', 'Field operations marked as In Progress.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      toastError('Action Failed', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action 4: Resolve Grievance with STRICT Mandatory Evidence
  const handleResolveGrievance = async () => {
    if (!user) return;

    if (!resolutionDescription.trim()) {
      toastError('Validation Failed', 'Work report / resolution description cannot be empty.');
      return;
    }

    if (afterRepairPhotos.length === 0) {
      toastError('Resolution Blocked', 'At least one after-repair photographic proof is strictly mandatory.');
      return;
    }

    setIsProcessing(true);
    try {
      const resolutionEvidence: ResolutionEvidence = {
        resolvedAt: new Date().toISOString(),
        resolvedByUid: user.uid,
        resolvedByName: user.fullName,
        resolvedByRole: user.role as 'admin' | 'officer',
        departmentId: complaint.departmentId || user.departmentId || 'admin',
        departmentName: complaint.departmentName || user.departmentName || 'Municipal Administration',
        resolutionDescription: resolutionDescription.trim(),
        evidenceImages: afterRepairPhotos.map((url, idx) => ({
          id: `ev_res_${Date.now()}_${idx}`,
          url,
          uploadedAt: new Date().toISOString(),
        })),
      };

      const updated = await complaintService.transitionStatus(
        complaint.id,
        'Resolved',
        user,
        'Issue completely resolved on site. Photographic evidence and work report verified.',
        {
          resolutionEvidence,
        }
      );

      setComplaint(updated);
      setShowResolveModal(false);
      const updates = await complaintService.getComplaintUpdates(updated.id);
      setTimeline(updates);
      success('Grievance Resolved!', 'Official resolution proof recorded & citizen notified.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Resolution failed';
      toastError('Resolution Blocked', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // AI Executive Brief Generator
  const handleGenerateAiBrief = async () => {
    setIsGeneratingAiBrief(true);
    try {
      const brief = await geminiService.generateExecutiveBrief(complaint);
      setAiBrief(brief);
      info('AI Operational Brief Ready', 'Generated dispatch plan and equipment requirements.');
    } catch {
      toastError('AI Briefing failed.');
    } finally {
      setIsGeneratingAiBrief(false);
    }
  };

  const resDetails = complaint.resolutionDetails || complaint.resolutionEvidence;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1240px', margin: '0 auto' }}>
      <PageHeader
        title={`Grievance Dossier: #${complaint.ticketNumber}`}
        subtitle={`Reported by ${complaint.citizenName} • ${formatDate(complaint.createdAt)}`}
        breadcrumbs={[
          { label: 'Master Registry', href: '/admin/complaints' },
          { label: complaint.ticketNumber },
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/complaints')}
              leftIcon={<ArrowLeft size={15} />}
            >
              Back to Registry
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerateAiBrief}
              isLoading={isGeneratingAiBrief}
              leftIcon={<Sparkles size={15} />}
            >
              AI Action Brief
            </Button>
          </div>
        }
      />

      {/* =====================================================================
          5-STAGE SEQUENTIAL LIFECYCLE STEPPER
          ===================================================================== */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardBody style={{ padding: '1.5rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Complaint Lifecycle Stage
              </div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', marginTop: '2px' }}>
                Status: <span style={{ color: 'var(--color-primary-700)' }}>{complaint.status}</span>
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
              <SLABadge
                createdAt={complaint.createdAt}
                priority={complaint.priority}
                status={complaint.status}
                resolvedAt={complaint.resolutionDetails?.resolvedAt}
              />
            </div>
          </div>

          {/* Stepper Line */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${COMPLAINT_STATUSES.length}, 1fr)`,
              position: 'relative',
              marginTop: '1.25rem',
            }}
          >
            {COMPLAINT_STATUSES.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                  {idx > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '50%',
                        width: '100%',
                        height: '3px',
                        backgroundColor: idx <= currentStepIndex ? 'var(--color-success-600)' : 'var(--border-subtle)',
                        zIndex: 1,
                      }}
                    />
                  )}
                  <div
                    style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '50%',
                      backgroundColor: isCompleted ? 'var(--color-success-600)' : 'var(--bg-surface)',
                      border: `2.5px solid ${isCompleted ? 'var(--color-success-600)' : 'var(--border-strong)'}`,
                      color: isCompleted ? '#ffffff' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 'var(--font-size-xs)',
                      zIndex: 2,
                      boxShadow: isCurrent ? '0 0 0 4px rgba(16, 185, 129, 0.2)' : 'none',
                    }}
                  >
                    {isCompleted ? <CheckCircle2 size={14} /> : idx + 1}
                  </div>
                  <div style={{ marginTop: '0.4rem', zIndex: 2 }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: isCurrent ? 700 : 600, color: isCurrent ? 'var(--color-primary-900)' : 'var(--text-secondary)' }}>
                      {step.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* =====================================================================
          AI EXECUTIVE BRIEF (If triggered)
          ===================================================================== */}
      {aiBrief && (
        <Card style={{ marginBottom: '1.5rem', border: '1.5px solid var(--color-primary-400)', backgroundColor: 'hsl(215, 80%, 98%)' }}>
          <CardHeader style={{ backgroundColor: 'hsl(215, 80%, 93%)', borderBottom: '1px solid hsl(215, 60%, 85%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary-900)' }}>
              <Sparkles size={18} />
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 800 }}>
                Gemini AI Municipal Action Briefing
              </h4>
            </div>
          </CardHeader>
          <CardBody style={{ padding: '1.25rem', fontSize: 'var(--font-size-xs)' }}>
            <p style={{ color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              <strong>Executive Summary:</strong> {aiBrief.executiveSummary}
            </p>
            <p style={{ color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              <strong>Recommended Action:</strong> {aiBrief.recommendedAction}
            </p>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <div>
                <strong>Recommended Crew Size:</strong> {aiBrief.estimatedCrewSize} technicians
              </div>
              <div>
                <strong>Equipment Required:</strong> {aiBrief.equipmentRequired.join(', ')}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* =====================================================================
          MAIN 2-COLUMN DOSSIER GRID
          ===================================================================== */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left 2 Cols: Details, Location, Citizen Evidence, Before/After Proof */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Complaint Details */}
          <Card>
            <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
                  ISSUE DETAILS
                </span>
                <h3 style={{ fontSize: 'var(--font-size-lg)', marginTop: '2px' }}>{complaint.title}</h3>
              </div>
              <CategoryBadge category={complaint.category} />
            </CardHeader>
            <CardBody>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                {complaint.description}
              </p>

              {/* Citizen & Location Metadata Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-xs)',
                  marginBottom: '1.5rem',
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Citizen Reporter</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {complaint.citizenName}
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>Phone: {complaint.citizenPhone}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Ward &amp; Jurisdiction</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {complaint.location.ward}
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {complaint.location.district}, {complaint.location.state} - {complaint.location.pincode}
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Incident Address &amp; GPS Coordinates</div>
                  <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>{complaint.location.address}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary-700)', marginTop: '2px' }}>
                    GPS: {complaint.location.latitude.toFixed(6)}° N, {complaint.location.longitude.toFixed(6)}° E
                  </div>
                </div>
              </div>

              {/* Map Preview */}
              <div style={{ height: '220px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.5rem', border: '1px solid var(--border-default)' }}>
                <CivicMap
                  complaints={[complaint]}
                  center={[complaint.location.latitude, complaint.location.longitude]}
                  zoom={15}
                  height="220px"
                />
              </div>

              {/* Citizen Photo Evidence */}
              <div>
                <h4 style={{ fontSize: 'var(--font-size-sm)', marginBottom: '0.75rem' }}>
                  Citizen Photo Evidence (Initial Report)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {complaint.evidenceImages && complaint.evidenceImages.map((img, idx) => (
                    <a
                      key={idx}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        height: '130px',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-subtle)',
                        position: 'relative',
                      }}
                    >
                      <img src={img.url} alt={`Citizen photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '4px',
                          right: '4px',
                          backgroundColor: 'rgba(0,0,0,0.65)',
                          color: '#fff',
                          fontSize: '10px',
                          padding: '2px 5px',
                          borderRadius: '4px',
                        }}
                      >
                        <ExternalLink size={10} /> View
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* =================================================================
              OFFICIAL RESOLUTION PROOF (If Resolved)
              ================================================================= */}
          {complaint.status === 'Resolved' && resDetails && (
            <Card style={{ border: '2px solid var(--color-success-500)', backgroundColor: 'hsl(150, 60%, 99%)' }}>
              <CardHeader style={{ backgroundColor: 'hsl(150, 80%, 94%)', borderBottom: '1px solid hsl(150, 70%, 85%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(155, 85%, 22%)' }}>
                  <ShieldCheck size={20} />
                  <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800 }}>Official Resolution Proof &amp; Work Report</h3>
                </div>
              </CardHeader>
              <CardBody style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Officer Work Summary
                  </div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', marginTop: '0.25rem', lineHeight: 1.6 }}>
                    {resDetails.resolutionDescription}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '1.5rem', backgroundColor: '#fff', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid hsl(150, 40%, 88%)' }}>
                  <div>
                    <strong>Resolved By:</strong> {resDetails.resolvedByName} ({resDetails.resolvedByRole})
                  </div>
                  <div>
                    <strong>Resolution Timestamp:</strong> {formatDateTime(resDetails.resolvedAt)}
                  </div>
                </div>

                {/* Side-by-Side Before & After Gallery */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', marginBottom: '0.75rem' }}>
                    Before vs. After Repair Photographic Evidence
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-danger-700)', marginBottom: '0.35rem' }}>
                        🔴 Before (Citizen Report)
                      </div>
                      <div style={{ height: '150px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1.5px solid var(--color-danger-300)' }}>
                        <img
                          src={complaint.evidenceImages[0]?.url || ''}
                          alt="Before repair"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-success-700)', marginBottom: '0.35rem' }}>
                        🟢 After Repair (Officer Proof)
                      </div>
                      <div style={{ height: '150px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1.5px solid var(--color-success-400)' }}>
                        <img
                          src={resDetails.evidenceImages[0]?.url || ''}
                          alt="After repair proof"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Citizen Rating Display */}
                {resDetails.citizenRating && (
                  <div style={{ borderTop: '1px solid hsl(150, 40%, 88%)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={16} fill={s <= (resDetails.citizenRating || 5) ? '#f59e0b' : 'none'} />
                      ))}
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-primary)', marginLeft: '0.25rem' }}>
                        Citizen Rating: {resDetails.citizenRating}/5
                      </span>
                    </div>
                    {resDetails.citizenFeedback && (
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                        "{resDetails.citizenFeedback}"
                      </span>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right Col: Lifecycle Workflow Actions & Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* =================================================================
              OFFICER WORKFLOW CONTROLS
              ================================================================= */}
          <Card>
            <CardHeader>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 800 }}>
                Municipal Workflow Actions
              </h4>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Step 1 Action: Verify Complaint */}
              {complaint.status === 'Submitted' && (
                <div style={{ padding: '1rem', backgroundColor: 'hsl(45, 100%, 96%)', borderRadius: 'var(--radius-md)', border: '1px solid hsl(45, 100%, 85%)' }}>
                  <h5 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'hsl(35, 95%, 35%)', marginBottom: '0.5rem' }}>
                    Action 1: Verify Grievance Authenticity
                  </h5>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Confirm that the complaint is genuine and located within municipal jurisdiction.
                  </p>
                  <textarea
                    className="form-textarea"
                    placeholder="Optional verification remarks..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={2}
                    style={{ marginBottom: '0.75rem', fontSize: 'var(--font-size-xs)' }}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    isLoading={isProcessing}
                    onClick={handleVerifyComplaint}
                    leftIcon={<CheckCircle2 size={15} />}
                  >
                    Verify &amp; Advance Grievance
                  </Button>
                </div>
              )}

              {/* Step 2 Action: Assign Department & Nodal Officer */}
              {complaint.status === 'Verified' && (
                <div style={{ padding: '1rem', backgroundColor: 'hsl(215, 100%, 96%)', borderRadius: 'var(--radius-md)', border: '1px solid hsl(215, 80%, 85%)' }}>
                  <h5 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-primary-900)', marginBottom: '0.5rem' }}>
                    Action 2: Route to Department &amp; Officer
                  </h5>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.6875rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      Target Department
                    </label>
                    <select
                      className="form-select"
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      style={{ fontSize: 'var(--font-size-xs)' }}
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.shortCode || d.code || d.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.6875rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      Designate Nodal Officer
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Er. Vikram Joshi"
                      value={selectedOfficerName}
                      onChange={(e) => setSelectedOfficerName(e.target.value)}
                      style={{ fontSize: 'var(--font-size-xs)' }}
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    isLoading={isProcessing}
                    onClick={handleAssignDepartment}
                    leftIcon={<Building2 size={15} />}
                  >
                    Assign Department &amp; Officer
                  </Button>
                </div>
              )}

              {/* Step 3 Action: Start Work / Mark In Progress */}
              {complaint.status === 'Assigned' && (
                <div style={{ padding: '1rem', backgroundColor: 'hsl(200, 95%, 96%)', borderRadius: 'var(--radius-md)', border: '1px solid hsl(200, 80%, 85%)' }}>
                  <h5 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'hsl(200, 85%, 32%)', marginBottom: '0.5rem' }}>
                    Action 3: Deploy Field Operations
                  </h5>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Assigned Department: <strong>{complaint.departmentName}</strong>
                  </p>
                  <textarea
                    className="form-textarea"
                    placeholder="Field crew deployment notes..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={2}
                    style={{ marginBottom: '0.75rem', fontSize: 'var(--font-size-xs)' }}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    isLoading={isProcessing}
                    onClick={handleStartWork}
                    leftIcon={<Clock size={15} />}
                  >
                    Start Repair (In Progress)
                  </Button>
                </div>
              )}

              {/* Step 4 Action: Resolve Grievance with Strict Evidence */}
              {complaint.status === 'In Progress' && (
                <div style={{ padding: '1rem', backgroundColor: 'hsl(150, 80%, 96%)', borderRadius: 'var(--radius-md)', border: '1px solid hsl(150, 70%, 85%)' }}>
                  <h5 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'hsl(155, 85%, 26%)', marginBottom: '0.5rem' }}>
                    Action 4: Complete &amp; Resolve Grievance
                  </h5>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Resolution strictly requires official work summary and after-repair photo evidence.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      setResolutionDescription('');
                      setAfterRepairPhotos([]);
                      setShowResolveModal(true);
                    }}
                    leftIcon={<ShieldCheck size={16} />}
                  >
                    Upload Proof &amp; Resolve Grievance
                  </Button>
                </div>
              )}

              {/* Resolved State Notice */}
              {complaint.status === 'Resolved' && (
                <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'hsl(150, 60%, 96%)', borderRadius: 'var(--radius-md)' }}>
                  <CheckCircle2 size={24} color="var(--color-success-600)" style={{ margin: '0 auto 0.5rem auto' }} />
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)', color: 'hsl(155, 85%, 26%)' }}>
                    Grievance Resolved Successfully
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Lifecycle completed with official before/after photographic proof.
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* =================================================================
              IMMUTABLE AUDIT TIMELINE
              ================================================================= */}
          <Card>
            <CardHeader>
              <h4 style={{ fontSize: 'var(--font-size-sm)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} /> Audit Trail History ({timeline.length})
              </h4>
            </CardHeader>
            <CardBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {timeline.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', position: 'relative' }}>
                    <div
                      style={{
                        width: '0.75rem',
                        height: '0.75rem',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary-600)',
                        marginTop: '4px',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, fontSize: 'var(--font-size-xs)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{item.newStatus}</strong>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {item.notes}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-primary-700)', marginTop: '2px' }}>
                        By: {item.actorName} ({item.actorRole})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* =====================================================================
          MANDATORY RESOLUTION EVIDENCE MODAL
          ===================================================================== */}
      {showResolveModal && (
        <Modal
          isOpen={showResolveModal}
          onClose={() => setShowResolveModal(false)}
          title="Upload Official Resolution Evidence &amp; Work Report"
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: 'var(--font-size-sm)' }}>
            <div style={{ backgroundColor: 'hsl(150, 80%, 96%)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid hsl(150, 70%, 85%)' }}>
              <div style={{ fontWeight: 700, color: 'hsl(155, 85%, 26%)', fontSize: 'var(--font-size-xs)' }}>
                🔒 Municipal Audit Enforcement
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Per government accountability standards, an officer cannot mark a grievance resolved without photographic after-repair proof and a complete work report.
              </div>
            </div>

            {/* Work Report Textarea */}
            <div>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                Resolution Work Report / Description <span style={{ color: 'var(--color-danger-600)' }}>*</span>
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Describe specific repair operations conducted on site, materials used, and final safety check..."
                value={resolutionDescription}
                onChange={(e) => setResolutionDescription(e.target.value)}
              />
            </div>

            {/* After-Repair Photo Upload & Presets */}
            <div>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                After-Repair Photographic Proof <span style={{ color: 'var(--color-danger-600)' }}>*</span>
              </label>

              {/* 1-Click Demo Samples for Fast Evaluation */}
              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  1-Click Demonstration Proof Samples:
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[
                    { key: 'pothole', label: 'Asphalt Patch Repair' },
                    { key: 'water', label: 'Pipeline Collar Fixed' },
                    { key: 'garbage', label: 'Compactor Cleared Dump' },
                    { key: 'street_light', label: 'LED Luminaire Replaced' },
                    { key: 'drainage', label: 'Culvert Desilted' },
                  ].map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => {
                        const url = SAMPLE_AFTER_REPAIRS[preset.key as keyof typeof SAMPLE_AFTER_REPAIRS];
                        if (!afterRepairPhotos.includes(url)) {
                          setAfterRepairPhotos((prev) => [...prev, url]);
                        }
                      }}
                      className="btn btn-sm btn-outline"
                      style={{ fontSize: '0.6875rem' }}
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Thumbnails */}
              {afterRepairPhotos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {afterRepairPhotos.map((url, idx) => (
                    <div key={idx} style={{ height: '90px', borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative', border: '1.5px solid var(--color-success-500)' }}>
                      <img src={url} alt={`After repair ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setAfterRepairPhotos((prev) => prev.filter((_, i) => i !== idx))}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          fontSize: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Officer Signature Summary */}
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)' }}>
              <div>
                <strong>Resolving Officer:</strong> {user?.fullName} ({user?.role})
              </div>
              <div style={{ marginTop: '2px' }}>
                <strong>Department:</strong> {complaint.departmentName || user?.departmentName || 'Public Works'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button variant="outline" onClick={() => setShowResolveModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                isLoading={isProcessing}
                onClick={handleResolveGrievance}
                leftIcon={<ShieldCheck size={16} />}
              >
                Submit Resolution Proof &amp; Close Ticket
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
