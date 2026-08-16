import React from 'react';
import { ComplaintStatus, IssuePriority, IssueCategory } from '../../types';
import { COMPLAINT_STATUSES, ISSUE_PRIORITIES } from '../../utils/constants';

export interface StatusBadgeProps {
  status: ComplaintStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const statusMeta = COMPLAINT_STATUSES.find((s) => s.key === status) || {
    badgeClass: 'badge-status-submitted',
    label: status,
  };

  return (
    <span className={`badge ${statusMeta.badgeClass} ${className}`.trim()}>
      <span className="badge-dot" aria-hidden="true">●</span>
      <span>{statusMeta.label}</span>
    </span>
  );
};

export interface PriorityBadgeProps {
  priority: IssuePriority;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  const priorityMeta = ISSUE_PRIORITIES.find((p) => p.key === priority) || {
    badgeClass: 'badge-priority-medium',
    label: priority,
  };

  return (
    <span className={`badge ${priorityMeta.badgeClass} ${className}`.trim()}>
      <span>{priorityMeta.label}</span>
    </span>
  );
};

export interface CategoryBadgeProps {
  category: IssueCategory;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className = '' }) => {
  return (
    <span className={`badge badge-category ${className}`.trim()}>
      <span>{category}</span>
    </span>
  );
};
