import { IssuePriority, ComplaintStatus } from '../types';
import { differenceInHours, differenceInMinutes, parseISO, addHours, isPast } from 'date-fns';

/**
 * Standard Municipal SLA Duration Configuration (Hours)
 * Low: 7 Days (168 hours)
 * Medium: 72 Hours (3 days)
 * High: 24 Hours (1 day)
 * Critical: 6 Hours (Immediate Emergency)
 */
export const SLA_HOURS_MAP: Record<IssuePriority, number> = {
  Critical: 6,
  High: 24,
  Medium: 72,
  Low: 168,
};

export interface SLAStatusInfo {
  slaHours: number;
  deadline: Date;
  isOverdue: boolean;
  isNearBreach: boolean;
  timeRemainingFormatted: string;
  elapsedHours: number;
  percentElapsed: number;
  urgencyLevel: 'normal' | 'warning' | 'critical' | 'breached' | 'resolved';
  badgeClass: string;
  badgeLabel: string;
}

/**
 * Calculate SLA compliance for a civic complaint
 */
export function calculateComplaintSLA(
  createdAtIso: string,
  priority: IssuePriority,
  status: ComplaintStatus,
  resolvedAtIso?: string
): SLAStatusInfo {
  const createdDate = typeof createdAtIso === 'string' ? parseISO(createdAtIso) : new Date(createdAtIso);
  const slaHours = SLA_HOURS_MAP[priority] || 72;
  const deadline = addHours(createdDate, slaHours);

  if (status === 'Resolved') {
    const resolveDate = resolvedAtIso ? parseISO(resolvedAtIso) : new Date();
    const resolvedInHours = Math.max(0, differenceInHours(resolveDate, createdDate));
    const wasOverdue = resolveDate.getTime() > deadline.getTime();

    return {
      slaHours,
      deadline,
      isOverdue: wasOverdue,
      isNearBreach: false,
      timeRemainingFormatted: `Resolved in ${resolvedInHours}h`,
      elapsedHours: resolvedInHours,
      percentElapsed: 100,
      urgencyLevel: 'resolved',
      badgeClass: wasOverdue ? 'badge-warning' : 'badge-success',
      badgeLabel: wasOverdue ? 'Resolved (Late)' : 'Resolved (Within SLA)',
    };
  }

  const now = new Date();
  const elapsedMinutes = Math.max(0, differenceInMinutes(now, createdDate));
  const elapsedHours = elapsedMinutes / 60;
  const totalSlaMinutes = slaHours * 60;
  const percentElapsed = Math.min(100, Math.round((elapsedMinutes / totalSlaMinutes) * 100));

  const isOverdue = isPast(deadline);
  const remainingMinutes = differenceInMinutes(deadline, now);
  const remainingHours = Math.floor(remainingMinutes / 60);

  // Near breach if > 75% elapsed and not yet overdue
  const isNearBreach = !isOverdue && percentElapsed >= 75;

  let urgencyLevel: 'normal' | 'warning' | 'critical' | 'breached' = 'normal';
  let badgeClass = 'badge-priority-low';
  let badgeLabel = '';

  if (isOverdue) {
    urgencyLevel = 'breached';
    badgeClass = 'badge-priority-critical';
    const overdueHours = Math.abs(remainingHours);
    badgeLabel = overdueHours > 24
      ? `Overdue (${Math.floor(overdueHours / 24)}d ${overdueHours % 24}h)`
      : `Overdue (${overdueHours}h)`;
  } else if (isNearBreach) {
    urgencyLevel = 'critical';
    badgeClass = 'badge-priority-high';
    badgeLabel = `${remainingHours}h remaining (Urgent)`;
  } else if (percentElapsed >= 50) {
    urgencyLevel = 'warning';
    badgeClass = 'badge-priority-medium';
    badgeLabel = `${remainingHours}h remaining`;
  } else {
    urgencyLevel = 'normal';
    badgeClass = 'badge-success';
    badgeLabel = remainingHours > 24
      ? `${Math.floor(remainingHours / 24)}d ${remainingHours % 24}h left`
      : `${remainingHours}h left`;
  }

  return {
    slaHours,
    deadline,
    isOverdue,
    isNearBreach,
    timeRemainingFormatted: badgeLabel,
    elapsedHours: Math.round(elapsedHours),
    percentElapsed,
    urgencyLevel,
    badgeClass,
    badgeLabel,
  };
}
