import React from 'react';
import { calculateComplaintSLA } from '../../utils/sla';
import { IssuePriority, ComplaintStatus } from '../../types';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface SLABadgeProps {
  createdAt: string;
  priority: IssuePriority;
  status: ComplaintStatus;
  resolvedAt?: string;
  showIcon?: boolean;
}

export const SLABadge: React.FC<SLABadgeProps> = ({
  createdAt,
  priority,
  status,
  resolvedAt,
  showIcon = true,
}) => {
  const sla = calculateComplaintSLA(createdAt, priority, status, resolvedAt);

  return (
    <span
      className={`badge ${sla.badgeClass}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontSize: '0.6875rem',
        padding: '0.2rem 0.55rem',
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        whiteSpace: 'nowrap',
      }}
      title={`SLA Target: ${sla.slaHours} hours`}
    >
      {showIcon && (
        <>
          {sla.isOverdue ? (
            <AlertTriangle size={12} />
          ) : status === 'Resolved' ? (
            <CheckCircle2 size={12} />
          ) : (
            <Clock size={12} />
          )}
        </>
      )}
      {sla.badgeLabel}
    </span>
  );
};
