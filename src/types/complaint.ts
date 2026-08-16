export type IssueCategory =
  | 'Pothole'
  | 'Flood'
  | 'Road blockage'
  | 'Garbage'
  | 'Broken street light'
  | 'Water leakage'
  | 'Fallen tree'
  | 'Landslide'
  | 'Drainage problem'
  | 'Other';

export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintStatus =
  | 'Submitted'
  | 'Verified'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved';

export type ComplaintCategory = IssueCategory;
export type PriorityLevel = IssuePriority;

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  villageOrArea?: string;
  village?: string;
  ward: string;
  district: string;
  state: string;
  pincode: string;
}

export type LocationData = LocationCoordinate;

export interface ComplaintEvidence {
  id: string;
  url: string;
  storagePath?: string;
  caption?: string;
  uploadedAt: string;
}

export interface AIAnalysisResult {
  suggestedCategory: IssueCategory;
  suggestedPriority: IssuePriority;
  confidenceScore: number;
  summary: string;
  urgencyReason: string;
  generatedAt: string;
}

export interface ResolutionEvidence {
  resolvedAt: string;
  resolvedByUid: string;
  resolvedByName: string;
  resolvedByRole: 'admin' | 'officer';
  departmentId: string;
  departmentName: string;
  resolutionDescription: string;
  evidenceImages: ComplaintEvidence[];
  citizenRating?: number;            // 1 to 5 stars
  citizenFeedback?: string;
  feedbackSubmittedAt?: string;
}

export interface ComplaintUpdate {
  id: string;
  complaintId: string;
  previousStatus: ComplaintStatus;
  newStatus: ComplaintStatus;
  actorUid: string;
  actorName: string;
  actorRole: 'citizen' | 'admin' | 'officer';
  title: string;
  notes: string;
  attachments?: string[];
  timestamp: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;              // e.g. "CC-2026-MH-9102"
  citizenId: string;
  citizenName: string;
  citizenPhone: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: ComplaintStatus;
  departmentId?: string | null;
  departmentName?: string | null;
  assignedOfficerId?: string | null;
  assignedOfficerName?: string | null;
  evidenceImages: ComplaintEvidence[];
  images?: string[];
  location: LocationCoordinate;
  aiAnalysis?: AIAnalysisResult | null;
  resolutionDetails?: ResolutionEvidence | null;
  resolutionEvidence?: ResolutionEvidence | null;
  citizenRating?: number;
  citizenFeedback?: string;
  timeline?: ComplaintUpdate[];
  upvotesCount: number;
  upvoters: string[];
  isMock?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintFilterOptions {
  citizenId?: string;
  status?: ComplaintStatus | 'All';
  category?: IssueCategory | 'All';
  priority?: IssuePriority | 'All';
  departmentId?: string | 'All';
  ward?: string | 'All';
  searchQuery?: string;
}
