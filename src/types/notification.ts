export type NotificationType =
  | 'status_change'
  | 'assignment'
  | 'official_remark'
  | 'emergency_notice';

export interface CivicNotification {
  id: string;
  recipientUid: string;
  complaintId?: string;
  ticketNumber?: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}
