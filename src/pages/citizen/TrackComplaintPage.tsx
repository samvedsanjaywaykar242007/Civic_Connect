import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  Star,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { complaintService } from '../../services/complaintService';
import { Complaint, ComplaintUpdate } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { COMPLAINT_STATUSES } from '../../utils/constants';

export const TrackComplaintPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const ticketFromUrl = searchParams.get('ticket') || '';

  const [ticketInput, setTicketInput] = useState<string>(ticketFromUrl || 'CC-2026-MH-4998');
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [timeline, setTimeline] = useState<ComplaintUpdate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);

  // Citizen satisfaction rating state
  const [rating, setRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);

  const fetchTicket = async (ticketQuery: string) => {
    if (!ticketQuery.trim()) return;
    setIsLoading(true);
    setNotFound(false);
    try {
      const result = await complaintService.getComplaintById(ticketQuery.trim());
      if (result) {
        setComplaint(result);
        const updates = await complaintService.getComplaintUpdates(result.id);
        setTimeline(updates);

        if (result.resolutionDetails?.citizenRating) {
          setRating(result.resolutionDetails.citizenRating);
          setFeedbackComment(result.resolutionDetails.citizenFeedback || '');
        }
      } else {
        setComplaint(null);
        setTimeline([]);
        setNotFound(true);
      }
    } catch {
      setComplaint(null);
      setTimeline([]);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (ticketFromUrl) {
      setTicketInput(ticketFromUrl);
      fetchTicket(ticketFromUrl);
    } else {
      // Default load first complaint for seamless demo presentation
      fetchTicket('CC-2026-MH-4998');
    }
  }, [ticketFromUrl]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketInput.trim()) return;
    fetchTicket(ticketInput);
  };

  const handleRateResolution = async () => {
    if (!complaint) return;
    setIsSubmittingRating(true);
    try {
      const updated = await complaintService.rateResolution(complaint.id, rating, feedbackComment);
      setComplaint(updated);
      success('Feedback Submitted!', 'Thank you for verifying the municipal repair work.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rating submission failed';
      toastError('Error', msg);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const currentStepIndex = complaint
    ? COMPLAINT_STATUSES.findIndex((s) => s.key === complaint.status)
    : -1;

  const resDetails = complaint?.resolutionDetails || complaint?.resolutionEvidence;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }} className="animate-fade-in">
      <PageHeader
        title="Live Grievance Lifecycle Tracker"
        subtitle="Transparent end-to-end audit trail and official resolution verification"
        breadcrumbs={[
          { label: 'Citizen Portal', href: '/citizen/dashboard' },
          { label: 'Live Status Tracker' },
        ]}
      />

      {/* Ticket Search Bar */}
      <Card style={{ marginBottom: '2rem' }}>
        <CardBody style={{ padding: '1.25rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 300px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Enter unique ticket code (e.g. CC-2026-MH-4998)"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}
              />
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
            <Button type="submit" variant="primary" leftIcon={<Search size={15} />}>
              Search Ticket
            </Button>
          </form>

          {/* Quick Demo Ticket Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
              Sample Tickets:
            </span>
            {['CC-2026-MH-4998', 'CC-2026-MH-3891', 'CC-2026-MH-2041', 'CC-2026-MH-1092'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setTicketInput(code);
                  fetchTicket(code);
                }}
                style={{
                  fontSize: '0.6875rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--color-primary-700)',
                  cursor: 'pointer',
                }}
              >
                {code}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Loading & Not Found States */}
      {isLoading ? (
        <LoadingState message="Fetching live complaint audit trail..." />
      ) : notFound || !complaint ? (
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '3rem' }}>
            <AlertTriangle size={40} color="var(--color-accent-600)" style={{ margin: '0 auto 1rem auto' }} />
            <h3>Grievance Ticket Not Found</h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0.5rem auto 1.5rem auto' }}>
              We could not find any active or archived complaint matching <strong>"{ticketInput}"</strong>. Please verify the ticket code from your SMS or dashboard.
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate('/citizen/my-complaints')}>
              View My Complaints
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* =================================================================
              5-STAGE VISUAL TIMELINE PROGRESS BAR
              ================================================================= */}
          <Card>
            <CardBody style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Resolution Progress
                  </div>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>
                    Current Status: <span style={{ color: 'var(--color-primary-700)' }}>{complaint.status}</span>
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <StatusBadge status={complaint.status} />
                  <PriorityBadge priority={complaint.priority} />
                </div>
              </div>

              {/* Progress Stepper Line */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${COMPLAINT_STATUSES.length}, 1fr)`,
                  position: 'relative',
                  marginTop: '1rem',
                  marginBottom: '1rem',
                }}
              >
                {COMPLAINT_STATUSES.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                      {/* Connecting line */}
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

                      {/* Step Circle */}
                      <div
                        style={{
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '50%',
                          backgroundColor: isCompleted
                            ? 'var(--color-success-600)'
                            : 'var(--bg-surface)',
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

                      {/* Step Label */}
                      <div style={{ marginTop: '0.5rem', zIndex: 2 }}>
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

          {/* =================================================================
              COMPLAINT CORE DETAILS
              ================================================================= */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left 2 Cols: Description, Location, Before Photos */}
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Card>
                <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-primary-800)' }}>
                      {complaint.ticketNumber}
                    </div>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', marginTop: '0.25rem' }}>{complaint.title}</h3>
                  </div>
                  <CategoryBadge category={complaint.category} />
                </CardHeader>
                <CardBody>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    {complaint.description}
                  </p>

                  {/* Incident Geotag & Location */}
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      marginBottom: '1.5rem',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    <MapPin size={18} color="var(--color-primary-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{complaint.location.address}</div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Ward: {complaint.location.ward} • Village: {complaint.location.village || complaint.location.villageOrArea || 'N/A'} • District: {complaint.location.district}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        GPS: {complaint.location.latitude.toFixed(6)}° N, {complaint.location.longitude.toFixed(6)}° E
                      </div>
                    </div>
                  </div>

                  {/* Initial Citizen Photo Evidence */}
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
                          <img src={img.url} alt={`Before proof ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
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

              {/* =============================================================
                  RESOLUTION VERIFICATION & BEFORE / AFTER GALLERY (If Resolved)
                  ============================================================= */}
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
                        {/* Before photo */}
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

                        {/* After photo */}
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

                    {/* Citizen Satisfaction Feedback Form */}
                    <div style={{ borderTop: '1px solid hsl(150, 40%, 88%)', paddingTop: '1.25rem' }}>
                      <h4 style={{ fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>
                        Citizen Resolution Verification &amp; Satisfaction Rating
                      </h4>

                      {resDetails.citizenRating ? (
                        <div style={{ padding: '0.75rem', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', marginBottom: '0.35rem' }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={16} fill={s <= (resDetails.citizenRating || 5) ? '#f59e0b' : 'none'} />
                            ))}
                            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-primary)', marginLeft: '0.25rem' }}>
                              {resDetails.citizenRating}/5 Stars
                            </span>
                          </div>
                          {resDetails.citizenFeedback && (
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                              "{resDetails.citizenFeedback}"
                            </p>
                          )}
                          <div style={{ fontSize: '0.6875rem', color: 'var(--color-success-600)', marginTop: '0.35rem', fontWeight: 600 }}>
                            ✓ Verified by Citizen ({complaint.citizenName})
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setRating(s)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                              >
                                <Star size={24} color="#f59e0b" fill={s <= rating ? '#f59e0b' : 'none'} />
                              </button>
                            ))}
                            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>
                              {rating} / 5 Stars
                            </span>
                          </div>

                          <textarea
                            className="form-textarea"
                            placeholder="Add your feedback (e.g. Repair was done cleanly, quality looks solid)..."
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            rows={2}
                            style={{ marginBottom: '0.75rem' }}
                          />

                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={isSubmittingRating}
                            onClick={handleRateResolution}
                            leftIcon={<CheckCircle2 size={15} />}
                          >
                            Submit Verification Rating
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>

            {/* Right Col: Timeline History & SLA Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Department Assignment Card */}
              <Card>
                <CardHeader>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building2 size={16} /> Department Assignment
                  </h4>
                </CardHeader>
                <CardBody style={{ fontSize: 'var(--font-size-xs)' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Assigned Department</div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-primary-800)', marginTop: '2px' }}>
                      {complaint.departmentName || 'Under Initial Assessment'}
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Assigned Nodal Officer</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {complaint.assignedOfficerName || 'Pending Officer Dispatch'}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Reported Date &amp; Time</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {formatDateTime(complaint.createdAt)}
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Timeline Updates Log */}
              <Card>
                <CardHeader>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={16} /> Timeline Audit Trail
                  </h4>
                </CardHeader>
                <CardBody>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {timeline && timeline.length > 0 ? (
                      timeline.map((update, idx) => (
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
                              <strong style={{ color: 'var(--text-primary)' }}>{update.newStatus}</strong>
                              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                {formatDate(update.timestamp)}
                              </span>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {update.notes}
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--color-primary-700)', marginTop: '2px' }}>
                              By: {update.actorName} ({update.actorRole})
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>No audit events recorded.</p>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
