import { IssueCategory } from './complaint';

export interface Department {
  id: string;
  name: string;
  code: string;
  shortCode?: string;
  iconName?: string;
  description?: string;
  categoriesHandled?: IssueCategory[];
  headOfficerName?: string;
  headOfficer?: string;
  contactEmail: string;
  contactPhone: string;
  activeTicketsCount?: number;
  resolvedTicketsCount?: number;
  averageResolutionHours?: number;
  slaTargetHours?: number;
}
