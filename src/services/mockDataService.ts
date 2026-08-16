import {
  Complaint,
  ComplaintStatus,
  ComplaintUpdate,
  ComplaintFilterOptions,
  ResolutionEvidence,
  UserProfile,
  Department,
  CivicNotification,
  GovernmentNotice,
} from '../types';
import {
  MOCK_COMPLAINTS,
  MOCK_USERS,
  MOCK_DEPARTMENTS,
  MOCK_NOTICES,
  MOCK_NOTIFICATIONS,
  MOCK_COMPLAINT_UPDATES,
} from '../data/mockData';
import { generateTicketNumber } from '../utils/formatters';

const STORAGE_KEYS = {
  COMPLAINTS: 'civicconnect_mock_complaints_v1',
  USERS: 'civicconnect_mock_users_v1',
  DEPARTMENTS: 'civicconnect_mock_departments_v1',
  NOTICES: 'civicconnect_mock_notices_v1',
  NOTIFICATIONS: 'civicconnect_mock_notifications_v1',
  UPDATES: 'civicconnect_mock_updates_v1',
};

// In-memory fallback if localStorage is disabled or in non-browser context
let memoryStore: {
  complaints: Complaint[];
  users: UserProfile[];
  departments: Department[];
  notices: GovernmentNotice[];
  notifications: CivicNotification[];
  updates: Record<string, ComplaintUpdate[]>;
} | null = null;

function getStore<T>(key: string, defaultData: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return JSON.parse(JSON.stringify(defaultData));
    }
    return JSON.parse(raw);
  } catch {
    if (!memoryStore) {
      memoryStore = {
        complaints: JSON.parse(JSON.stringify(MOCK_COMPLAINTS)),
        users: JSON.parse(JSON.stringify(MOCK_USERS)),
        departments: JSON.parse(JSON.stringify(MOCK_DEPARTMENTS)),
        notices: JSON.parse(JSON.stringify(MOCK_NOTICES)),
        notifications: JSON.parse(JSON.stringify(MOCK_NOTIFICATIONS)),
        updates: JSON.parse(JSON.stringify(MOCK_COMPLAINT_UPDATES)),
      };
    }
    if (key === STORAGE_KEYS.COMPLAINTS) return memoryStore.complaints as unknown as T;
    if (key === STORAGE_KEYS.USERS) return memoryStore.users as unknown as T;
    if (key === STORAGE_KEYS.DEPARTMENTS) return memoryStore.departments as unknown as T;
    if (key === STORAGE_KEYS.NOTICES) return memoryStore.notices as unknown as T;
    if (key === STORAGE_KEYS.NOTIFICATIONS) return memoryStore.notifications as unknown as T;
    if (key === STORAGE_KEYS.UPDATES) return memoryStore.updates as unknown as T;
    return defaultData;
  }
}

function setStore<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    if (!memoryStore) return;
    if (key === STORAGE_KEYS.COMPLAINTS) memoryStore.complaints = data as unknown as Complaint[];
    if (key === STORAGE_KEYS.USERS) memoryStore.users = data as unknown as UserProfile[];
    if (key === STORAGE_KEYS.DEPARTMENTS) memoryStore.departments = data as unknown as Department[];
    if (key === STORAGE_KEYS.NOTICES) memoryStore.notices = data as unknown as GovernmentNotice[];
    if (key === STORAGE_KEYS.NOTIFICATIONS) memoryStore.notifications = data as unknown as CivicNotification[];
    if (key === STORAGE_KEYS.UPDATES) memoryStore.updates = data as unknown as Record<string, ComplaintUpdate[]>;
  }
}

/**
 * Validates whether a complaint status transition is allowed by the 5-stage lifecycle.
 * Sequence: Submitted -> Verified -> Assigned -> In Progress -> Resolved
 */
export function isValidStatusTransition(currentStatus: ComplaintStatus, targetStatus: ComplaintStatus): {
  valid: boolean;
  reason?: string;
} {
  if (currentStatus === targetStatus) {
    return { valid: true };
  }

  const statusOrder: Record<ComplaintStatus, number> = {
    'Submitted': 1,
    'Verified': 2,
    'Assigned': 3,
    'In Progress': 4,
    'Resolved': 5,
  };

  const currentStep = statusOrder[currentStatus];
  const targetStep = statusOrder[targetStatus];

  // Moving forward one step at a time is valid
  if (targetStep === currentStep + 1) {
    return { valid: true };
  }

  // Admin/officer can move back one step if revision is needed (e.g. In Progress back to Assigned)
  if (targetStep === currentStep - 1) {
    return { valid: true };
  }

  // Jumping directly from Submitted to Resolved or skipping steps is forbidden
  return {
    valid: false,
    reason: `Invalid status transition from "${currentStatus}" to "${targetStatus}". Complaints must follow the sequential lifecycle: Submitted → Verified → Assigned → In Progress → Resolved.`,
  };
}

export const mockDataService = {
  /**
   * Reset all mock data to clean initial state
   */
  resetToDefaults(): void {
    setStore(STORAGE_KEYS.COMPLAINTS, MOCK_COMPLAINTS);
    setStore(STORAGE_KEYS.USERS, MOCK_USERS);
    setStore(STORAGE_KEYS.DEPARTMENTS, MOCK_DEPARTMENTS);
    setStore(STORAGE_KEYS.NOTICES, MOCK_NOTICES);
    setStore(STORAGE_KEYS.NOTIFICATIONS, MOCK_NOTIFICATIONS);
    setStore(STORAGE_KEYS.UPDATES, MOCK_COMPLAINT_UPDATES);
  },

  // ---------------------------------------------------------------------------
  // Complaints Engine
  // ---------------------------------------------------------------------------
  async getComplaints(filters?: ComplaintFilterOptions): Promise<Complaint[]> {
    let list = getStore<Complaint[]>(STORAGE_KEYS.COMPLAINTS, MOCK_COMPLAINTS);

    if (!filters) return list;

    if (filters.status && filters.status !== 'All') {
      list = list.filter((c) => c.status === filters.status);
    }
    if (filters.category && filters.category !== 'All') {
      list = list.filter((c) => c.category === filters.category);
    }
    if (filters.priority && filters.priority !== 'All') {
      list = list.filter((c) => c.priority === filters.priority);
    }
    if (filters.departmentId && filters.departmentId !== 'All') {
      list = list.filter((c) => c.departmentId === filters.departmentId);
    }
    if (filters.ward && filters.ward !== 'All') {
      list = list.filter((c) => c.location.ward === filters.ward);
    }
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.ticketNumber.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.location.address.toLowerCase().includes(q) ||
          c.citizenName.toLowerCase().includes(q)
      );
    }

    return list;
  },

  async getComplaintById(id: string): Promise<Complaint | null> {
    const list = getStore<Complaint[]>(STORAGE_KEYS.COMPLAINTS, MOCK_COMPLAINTS);
    return list.find((c) => c.id === id || c.ticketNumber.toLowerCase() === id.toLowerCase()) || null;
  },

  async getComplaintByTicketNumber(ticketNumber: string): Promise<Complaint | null> {
    const list = getStore<Complaint[]>(STORAGE_KEYS.COMPLAINTS, MOCK_COMPLAINTS);
    return list.find((c) => c.ticketNumber.toLowerCase() === ticketNumber.toLowerCase().trim()) || null;
  },

  async getComplaintsByCitizen(citizenId: string): Promise<Complaint[]> {
    const list = getStore<Complaint[]>(STORAGE_KEYS.COMPLAINTS, MOCK_COMPLAINTS);
    return list.filter((c) => c.citizenId === citizenId);
  },

  async createComplaint(
    data: Omit<
      Complaint,
      'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'upvotesCount' | 'upvoters' | 'isMock'
    >
  ): Promise<Complaint> {
    const list = getStore<Complaint[]>(STORAGE_KEYS.COMPLAINTS, MOCK_COMPLAINTS);
    const updatesMap = getStore<Record<string, ComplaintUpdate[]>>(
      STORAGE_KEYS.UPDATES,
      MOCK_COMPLAINT_UPDATES
    );

    const now = new Date().toISOString();
    const id = `mock_complaint_${Date.now()}`;
    const ticketNumber = generateTicketNumber(data.location.state === 'Uttar Pradesh' ? 'UP' : 'MH');

    const newComplaint: Complaint = {
      ...data,
      id,
      ticketNumber,
      status: 'Submitted',
      upvotesCount: 1,
      upvoters: [data.citizenId],
      isMock: true,
      createdAt: now,
      updatedAt: now,
    };

    list.unshift(newComplaint);
    setStore(STORAGE_KEYS.COMPLAINTS, list);

    // Record initial update event
    const initialUpdate: ComplaintUpdate = {
      id: `upd_${Date.now()}`,
      complaintId: id,
      previousStatus: 'Submitted',
      newStatus: 'Submitted',
      actorUid: data.citizenId,
      actorName: data.citizenName,
      actorRole: 'citizen',
      title: 'Complaint Registered with GPS & Evidence',
      notes: `Grievance submitted by citizen at ${data.location.address}. Ticket assigned: ${ticketNumber}.`,
      timestamp: now,
    };

    updatesMap[id] = [initialUpdate];
    setStore(STORAGE_KEYS.UPDATES, updatesMap);

    return newComplaint;
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
    const list = getStore<Complaint[]>(STORAGE_KEYS.COMPLAINTS, MOCK_COMPLAINTS);
    const updatesMap = getStore<Record<string, ComplaintUpdate[]>>(
      STORAGE_KEYS.UPDATES,
      MOCK_COMPLAINT_UPDATES
    );

    const index = list.findIndex((c) => c.id === complaintId);
    if (index === -1) {
      throw new Error(`Complaint with ID ${complaintId} not found.`);
    }

    const complaint = list[index];

    // Role Verification: Citizens cannot change complaint lifecycle status
    if (actor.role === 'citizen') {
      throw new Error('Unauthorized: Citizens cannot transition complaint lifecycle status.');
    }

    // Lifecycle Sequence Validation
    const transitionCheck = isValidStatusTransition(complaint.status, targetStatus);
    if (!transitionCheck.valid) {
      throw new Error(transitionCheck.reason);
    }

    // Resolution Verification: When resolving, resolution evidence is strictly mandatory
    if (targetStatus === 'Resolved') {
      if (!options?.resolutionEvidence) {
        throw new Error('Resolution failed: Government officer resolution report and after-repair photo evidence are mandatory.');
      }
      if (!options.resolutionEvidence.resolutionDescription || options.resolutionEvidence.resolutionDescription.trim() === '') {
        throw new Error('Resolution failed: Work report / resolution description cannot be empty.');
      }
      if (!options.resolutionEvidence.evidenceImages || options.resolutionEvidence.evidenceImages.length === 0) {
        throw new Error('Resolution failed: At least one after-repair evidence photo must be uploaded.');
      }
    }

    const now = new Date().toISOString();
    const previousStatus = complaint.status;

    complaint.status = targetStatus;
    complaint.updatedAt = now;

    if (options?.departmentId) complaint.departmentId = options.departmentId;
    if (options?.departmentName) complaint.departmentName = options.departmentName;
    if (options?.assignedOfficerId) complaint.assignedOfficerId = options.assignedOfficerId;
    if (options?.assignedOfficerName) complaint.assignedOfficerName = options.assignedOfficerName;
    if (options?.resolutionEvidence) {
      complaint.resolutionDetails = {
        ...options.resolutionEvidence,
        resolvedAt: options.resolutionEvidence.resolvedAt || now,
        resolvedByUid: actor.uid,
        resolvedByName: actor.fullName,
        resolvedByRole: actor.role as 'admin' | 'officer',
        departmentId: complaint.departmentId || 'admin',
        departmentName: complaint.departmentName || 'Administration Desk',
      };
    }

    list[index] = complaint;
    setStore(STORAGE_KEYS.COMPLAINTS, list);

    // Record lifecycle update timeline item
    const updateItem: ComplaintUpdate = {
      id: `upd_${Date.now()}`,
      complaintId,
      previousStatus,
      newStatus: targetStatus,
      actorUid: actor.uid,
      actorName: actor.fullName,
      actorRole: actor.role,
      title:
        targetStatus === 'Resolved'
          ? 'Issue Resolved — Resolution Proof Uploaded'
          : targetStatus === 'Assigned'
          ? `Assigned to ${complaint.departmentName || 'Department'}`
          : targetStatus === 'In Progress'
          ? 'Maintenance Team Dispatched on Site'
          : targetStatus === 'Verified'
          ? 'Complaint Verified by Control Desk'
          : `Status changed to ${targetStatus}`,
      notes: updateNotes,
      timestamp: now,
    };

    if (!updatesMap[complaintId]) updatesMap[complaintId] = [];
    updatesMap[complaintId].push(updateItem);
    setStore(STORAGE_KEYS.UPDATES, updatesMap);

    // Create Notification for the citizen
    this.createNotification({
      recipientUid: complaint.citizenId,
      complaintId: complaint.id,
      ticketNumber: complaint.ticketNumber,
      title: `Complaint #${complaint.ticketNumber} Updated`,
      message: `Your grievance is now [${targetStatus}]. ${updateNotes}`,
      type: 'status_change',
      isRead: false,
    });

    return complaint;
  },

  async upvoteComplaint(complaintId: string, citizenUid: string): Promise<Complaint> {
    const list = getStore<Complaint[]>(STORAGE_KEYS.COMPLAINTS, MOCK_COMPLAINTS);
    const index = list.findIndex((c) => c.id === complaintId);
    if (index === -1) throw new Error('Complaint not found');

    const complaint = list[index];
    if (complaint.upvoters.includes(citizenUid)) {
      // Toggle off upvote
      complaint.upvoters = complaint.upvoters.filter((id) => id !== citizenUid);
      complaint.upvotesCount = Math.max(0, complaint.upvotesCount - 1);
    } else {
      // Add upvote
      complaint.upvoters.push(citizenUid);
      complaint.upvotesCount += 1;
    }
    complaint.updatedAt = new Date().toISOString();
    list[index] = complaint;
    setStore(STORAGE_KEYS.COMPLAINTS, list);
    return complaint;
  },

  async submitCitizenFeedback(
    complaintId: string,
    rating: number,
    feedback: string
  ): Promise<Complaint> {
    const list = getStore<Complaint[]>(STORAGE_KEYS.COMPLAINTS, MOCK_COMPLAINTS);
    const index = list.findIndex((c) => c.id === complaintId);
    if (index === -1) throw new Error('Complaint not found');

    const complaint = list[index];
    if (complaint.status !== 'Resolved') {
      throw new Error('Feedback can only be submitted for Resolved complaints.');
    }
    if (!complaint.resolutionDetails) {
      throw new Error('Cannot submit feedback: Resolution details are missing.');
    }

    complaint.resolutionDetails.citizenRating = rating;
    complaint.resolutionDetails.citizenFeedback = feedback;
    complaint.resolutionDetails.feedbackSubmittedAt = new Date().toISOString();
    complaint.updatedAt = new Date().toISOString();

    list[index] = complaint;
    setStore(STORAGE_KEYS.COMPLAINTS, list);
    return complaint;
  },

  async getComplaintUpdates(complaintId: string): Promise<ComplaintUpdate[]> {
    const updatesMap = getStore<Record<string, ComplaintUpdate[]>>(
      STORAGE_KEYS.UPDATES,
      MOCK_COMPLAINT_UPDATES
    );
    return updatesMap[complaintId] || [];
  },

  // ---------------------------------------------------------------------------
  // Departments, Notices & Notifications
  // ---------------------------------------------------------------------------
  async getDepartments(): Promise<Department[]> {
    return getStore<Department[]>(STORAGE_KEYS.DEPARTMENTS, MOCK_DEPARTMENTS);
  },

  async getNotices(): Promise<GovernmentNotice[]> {
    return getStore<GovernmentNotice[]>(STORAGE_KEYS.NOTICES, MOCK_NOTICES);
  },

  async createNotice(data: Omit<GovernmentNotice, 'id' | 'createdAt'>): Promise<GovernmentNotice> {
    const list = getStore<GovernmentNotice[]>(STORAGE_KEYS.NOTICES, MOCK_NOTICES);
    const newNotice: GovernmentNotice = {
      ...data,
      id: `notice_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newNotice);
    setStore(STORAGE_KEYS.NOTICES, list);
    return newNotice;
  },

  async getNotifications(recipientUid?: string): Promise<CivicNotification[]> {
    const list = getStore<CivicNotification[]>(STORAGE_KEYS.NOTIFICATIONS, MOCK_NOTIFICATIONS);
    if (!recipientUid) return list;
    return list.filter((n) => n.recipientUid === recipientUid);
  },

  async createNotification(data: Omit<CivicNotification, 'id' | 'createdAt'>): Promise<CivicNotification> {
    const list = getStore<CivicNotification[]>(STORAGE_KEYS.NOTIFICATIONS, MOCK_NOTIFICATIONS);
    const newNotif: CivicNotification = {
      ...data,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newNotif);
    setStore(STORAGE_KEYS.NOTIFICATIONS, list);
    return newNotif;
  },

  async markNotificationRead(notifId: string): Promise<void> {
    const list = getStore<CivicNotification[]>(STORAGE_KEYS.NOTIFICATIONS, MOCK_NOTIFICATIONS);
    const item = list.find((n) => n.id === notifId);
    if (item) {
      item.isRead = true;
      setStore(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  },

  async markAllNotificationsRead(recipientUid: string): Promise<void> {
    const list = getStore<CivicNotification[]>(STORAGE_KEYS.NOTIFICATIONS, MOCK_NOTIFICATIONS);
    list.forEach((n) => {
      if (n.recipientUid === recipientUid) {
        n.isRead = true;
      }
    });
    setStore(STORAGE_KEYS.NOTIFICATIONS, list);
  },

  // ---------------------------------------------------------------------------
  // Users & Role Verification
  // ---------------------------------------------------------------------------
  async getUsers(): Promise<UserProfile[]> {
    return getStore<UserProfile[]>(STORAGE_KEYS.USERS, MOCK_USERS);
  },

  async getUserById(uid: string): Promise<UserProfile | null> {
    const list = getStore<UserProfile[]>(STORAGE_KEYS.USERS, MOCK_USERS);
    return list.find((u) => u.uid === uid) || null;
  },

  async registerMockCitizen(data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    ward: string;
    village?: string;
    district: string;
    state: string;
    pincode: string;
  }): Promise<UserProfile> {
    const list = getStore<UserProfile[]>(STORAGE_KEYS.USERS, MOCK_USERS);
    const existing = list.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const now = new Date().toISOString();
    const newUser: UserProfile = {
      ...data,
      uid: `citizen_${Date.now()}`,
      role: 'citizen', // Enforce citizen role strictly
      isMock: true,
      createdAt: now,
      updatedAt: now,
    };

    list.push(newUser);
    setStore(STORAGE_KEYS.USERS, list);
    return newUser;
  },
};
