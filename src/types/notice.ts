export type NoticePriority = 'Normal' | 'Urgent' | 'Emergency Alert';

export interface GovernmentNotice {
  id: string;
  title: string;
  content: string;
  departmentId: string;
  departmentName: string;
  targetArea: string;
  priority: NoticePriority;
  issuedBy: string;
  active: boolean;
  validUntil: string;
  createdAt: string;
}
