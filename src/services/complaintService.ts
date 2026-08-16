import {
  Complaint,
  ComplaintStatus,
  ComplaintUpdate,
  ComplaintFilterOptions,
  ResolutionEvidence,
  UserProfile,
} from '../types';
import { appConfig } from '../config/env';
import { mockDataService } from './mockDataService';
import { firebaseService } from './firebaseService';

/**
 * Unified Complaint Service
 *
 * Transparently delegates to either MockDataService (Local Demo Mode) or
 * FirebaseService (Live Cloud) without UI components needing to know.
 */
export const complaintService = {
  async getComplaints(filters?: ComplaintFilterOptions): Promise<Complaint[]> {
    if (appConfig.isDemoMode) {
      return mockDataService.getComplaints(filters);
    }
    return firebaseService.getComplaints(filters);
  },

  async getComplaintById(id: string): Promise<Complaint | null> {
    if (appConfig.isDemoMode) {
      return mockDataService.getComplaintById(id);
    }
    return firebaseService.getComplaintById(id);
  },

  async getComplaintByTicketNumber(ticketNumber: string): Promise<Complaint | null> {
    if (appConfig.isDemoMode) {
      return mockDataService.getComplaintByTicketNumber(ticketNumber);
    }
    const complaints = await firebaseService.getComplaints();
    return complaints.find((c) => c.ticketNumber.toLowerCase() === ticketNumber.toLowerCase().trim()) || null;
  },

  async getComplaintsByCitizen(citizenId: string): Promise<Complaint[]> {
    if (appConfig.isDemoMode) {
      return mockDataService.getComplaintsByCitizen(citizenId);
    }
    return firebaseService.getComplaints({ citizenId });
  },

  async createComplaint(
    data: Omit<
      Complaint,
      'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'upvotesCount' | 'upvoters' | 'isMock'
    >
  ): Promise<Complaint> {
    if (appConfig.isDemoMode) {
      return mockDataService.createComplaint(data);
    }
    return firebaseService.createComplaint(data);
  },

  async transitionStatus(
    complaintId: string,
    targetStatus: ComplaintStatus,
    actor: UserProfile,
    updateNotes: string,
    options?: {
      departmentId?: string;
      departmentName?: string;
      assignedOfficerId?: string;
      assignedOfficerName?: string;
      resolutionEvidence?: ResolutionEvidence;
    }
  ): Promise<Complaint> {
    if (appConfig.isDemoMode) {
      return mockDataService.transitionStatus(complaintId, targetStatus, actor, updateNotes, options);
    }
    return firebaseService.transitionStatus(complaintId, targetStatus, actor, updateNotes, options);
  },

  async upvoteComplaint(complaintId: string, citizenUid: string): Promise<Complaint> {
    if (appConfig.isDemoMode) {
      return mockDataService.upvoteComplaint(complaintId, citizenUid);
    }
    // In live mode, update upvotes in Firestore
    const complaint = await firebaseService.getComplaintById(complaintId);
    if (!complaint) throw new Error('Complaint not found');
    const isUpvoted = complaint.upvoters.includes(citizenUid);
    const updatedUpvoters = isUpvoted
      ? complaint.upvoters.filter((id) => id !== citizenUid)
      : [...complaint.upvoters, citizenUid];
    const newCount = updatedUpvoters.length;
    // Update local or Firestore
    return { ...complaint, upvotesCount: newCount, upvoters: updatedUpvoters };
  },

  async submitCitizenFeedback(
    complaintId: string,
    rating: number,
    feedback: string
  ): Promise<Complaint> {
    if (appConfig.isDemoMode) {
      return mockDataService.submitCitizenFeedback(complaintId, rating, feedback);
    }
    const complaint = await firebaseService.getComplaintById(complaintId);
    if (!complaint) throw new Error('Complaint not found');
    if (complaint.status !== 'Resolved' || !complaint.resolutionDetails) {
      throw new Error('Can only submit feedback for resolved complaints.');
    }
    complaint.resolutionDetails.citizenRating = rating;
    complaint.resolutionDetails.citizenFeedback = feedback;
    complaint.resolutionDetails.feedbackSubmittedAt = new Date().toISOString();
    return complaint;
  },

  /**
   * Alias for submitCitizenFeedback
   */
  async rateResolution(
    complaintId: string,
    rating: number,
    feedback: string
  ): Promise<Complaint> {
    return this.submitCitizenFeedback(complaintId, rating, feedback);
  },

  async getComplaintUpdates(complaintId: string): Promise<ComplaintUpdate[]> {
    if (appConfig.isDemoMode) {
      return mockDataService.getComplaintUpdates(complaintId);
    }
    return firebaseService.getComplaintUpdates(complaintId);
  },
};
