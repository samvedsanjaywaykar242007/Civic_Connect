import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import {
  Complaint,
  ComplaintStatus,
  ComplaintUpdate,
  ComplaintFilterOptions,
  ResolutionEvidence,
  UserProfile,
  Department,
  GovernmentNotice,
} from '../types';
import { generateTicketNumber } from '../utils/formatters';
import { isValidStatusTransition } from './mockDataService';

export const firebaseService = {
  // ---------------------------------------------------------------------------
  // Complaints Operations
  // ---------------------------------------------------------------------------
  async getComplaints(filters?: ComplaintFilterOptions): Promise<Complaint[]> {
    if (!db) throw new Error('Firebase Firestore is not initialized.');

    const complaintsRef = collection(db, 'complaints');
    let q = query(complaintsRef, orderBy('createdAt', 'desc'));

    if (filters?.status && filters.status !== 'All') {
      q = query(complaintsRef, where('status', '==', filters.status), orderBy('createdAt', 'desc'));
    }
    if (filters?.category && filters.category !== 'All') {
      q = query(complaintsRef, where('category', '==', filters.category), orderBy('createdAt', 'desc'));
    }

    const snap = await getDocs(q);
    const results: Complaint[] = [];
    snap.forEach((d) => {
      results.push({ id: d.id, ...(d.data() as Omit<Complaint, 'id'>) });
    });

    if (filters?.searchQuery && filters.searchQuery.trim() !== '') {
      const sq = filters.searchQuery.toLowerCase();
      return results.filter(
        (c) =>
          c.ticketNumber.toLowerCase().includes(sq) ||
          c.title.toLowerCase().includes(sq) ||
          c.description.toLowerCase().includes(sq) ||
          c.citizenName.toLowerCase().includes(sq)
      );
    }

    return results;
  },

  async getComplaintById(id: string): Promise<Complaint | null> {
    if (!db) throw new Error('Firebase Firestore is not initialized.');
    const docRef = doc(db, 'complaints', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<Complaint, 'id'>) };
  },

  async createComplaint(
    data: Omit<
      Complaint,
      'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'upvotesCount' | 'upvoters' | 'isMock'
    >
  ): Promise<Complaint> {
    if (!db) throw new Error('Firebase Firestore is not initialized.');

    const ticketNumber = generateTicketNumber(data.location.state === 'Uttar Pradesh' ? 'UP' : 'MH');
    const now = new Date().toISOString();

    const newDocData: Omit<Complaint, 'id'> = {
      ...data,
      ticketNumber,
      status: 'Submitted',
      upvotesCount: 1,
      upvoters: [data.citizenId],
      isMock: false,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, 'complaints'), newDocData);

    // Initial update in subcollection
    const updateData: ComplaintUpdate = {
      id: `upd_${Date.now()}`,
      complaintId: docRef.id,
      previousStatus: 'Submitted',
      newStatus: 'Submitted',
      actorUid: data.citizenId,
      actorName: data.citizenName,
      actorRole: 'citizen',
      title: 'Complaint Registered with GPS & Evidence',
      notes: `Grievance submitted by citizen. Ticket: ${ticketNumber}`,
      timestamp: now,
    };

    await setDoc(doc(db, 'complaints', docRef.id, 'updates', updateData.id), updateData);

    return { id: docRef.id, ...newDocData };
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
    if (!db) throw new Error('Firebase Firestore is not initialized.');

    const complaintRef = doc(db, 'complaints', complaintId);
    const snap = await getDoc(complaintRef);
    if (!snap.exists()) {
      throw new Error(`Complaint ${complaintId} not found in Firestore.`);
    }

    const complaint = { id: snap.id, ...(snap.data() as Omit<Complaint, 'id'>) };

    // Role Verification: Only admin or officer can transition status
    if (actor.role === 'citizen') {
      throw new Error('Unauthorized: Citizens cannot transition complaint lifecycle status.');
    }

    // Lifecycle Sequence Validation
    const transitionCheck = isValidStatusTransition(complaint.status, targetStatus);
    if (!transitionCheck.valid) {
      throw new Error(transitionCheck.reason);
    }

    // Resolution Verification: Resolution evidence is mandatory
    if (targetStatus === 'Resolved') {
      if (!options?.resolutionEvidence) {
        throw new Error('Resolution failed: Officer work report and after-repair evidence are mandatory.');
      }
      if (!options.resolutionEvidence.resolutionDescription?.trim()) {
        throw new Error('Resolution failed: Work report cannot be empty.');
      }
      if (!options.resolutionEvidence.evidenceImages?.length) {
        throw new Error('Resolution failed: At least one after-repair evidence photo must be uploaded.');
      }
    }

    const now = new Date().toISOString();
    const updatePayload: Partial<Complaint> = {
      status: targetStatus,
      updatedAt: now,
    };

    if (options?.departmentId) updatePayload.departmentId = options.departmentId;
    if (options?.departmentName) updatePayload.departmentName = options.departmentName;
    if (options?.assignedOfficerId) updatePayload.assignedOfficerId = options.assignedOfficerId;
    if (options?.assignedOfficerName) updatePayload.assignedOfficerName = options.assignedOfficerName;
    if (options?.resolutionEvidence) {
      updatePayload.resolutionDetails = {
        ...options.resolutionEvidence,
        resolvedAt: options.resolutionEvidence.resolvedAt || now,
        resolvedByUid: actor.uid,
        resolvedByName: actor.fullName,
        resolvedByRole: actor.role as 'admin' | 'officer',
        departmentId: complaint.departmentId || 'admin',
        departmentName: complaint.departmentName || 'Administration Desk',
      };
    }

    await updateDoc(complaintRef, updatePayload);

    // Save lifecycle update record
    const updateData: ComplaintUpdate = {
      id: `upd_${Date.now()}`,
      complaintId,
      previousStatus: complaint.status,
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

    await setDoc(doc(db, 'complaints', complaintId, 'updates', updateData.id), updateData);

    return { ...complaint, ...updatePayload };
  },

  async getComplaintUpdates(complaintId: string): Promise<ComplaintUpdate[]> {
    if (!db) throw new Error('Firebase Firestore is not initialized.');
    const updatesRef = collection(db, 'complaints', complaintId, 'updates');
    const q = query(updatesRef, orderBy('timestamp', 'asc'));
    const snap = await getDocs(q);
    const updates: ComplaintUpdate[] = [];
    snap.forEach((d) => {
      updates.push({ id: d.id, ...(d.data() as Omit<ComplaintUpdate, 'id'>) });
    });
    return updates;
  },

  // Real-time listener for complaints
  subscribeToComplaints(onUpdate: (complaints: Complaint[]) => void): Unsubscribe {
    if (!db) throw new Error('Firebase Firestore is not initialized.');
    const complaintsRef = collection(db, 'complaints');
    const q = query(complaintsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const list: Complaint[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as Omit<Complaint, 'id'>) });
      });
      onUpdate(list);
    });
  },

  // ---------------------------------------------------------------------------
  // Storage: Evidence Upload
  // ---------------------------------------------------------------------------
  async uploadEvidencePhoto(
    complaintId: string,
    file: File,
    type: 'initial' | 'resolution' = 'initial'
  ): Promise<string> {
    if (!storage) throw new Error('Firebase Storage is not initialized.');
    const path = `complaints/${complaintId}/${type}/${Date.now()}_${file.name}`;
    const storageReference = ref(storage, path);
    await uploadBytes(storageReference, file);
    return getDownloadURL(storageReference);
  },

  // ---------------------------------------------------------------------------
  // Departments & Notices
  // ---------------------------------------------------------------------------
  async getDepartments(): Promise<Department[]> {
    if (!db) throw new Error('Firebase Firestore is not initialized.');
    const snap = await getDocs(collection(db, 'departments'));
    const list: Department[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Department, 'id'>) }));
    return list;
  },

  async getNotices(): Promise<GovernmentNotice[]> {
    if (!db) throw new Error('Firebase Firestore is not initialized.');
    const q = query(collection(db, 'governmentNotices'), where('active', '==', true), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const list: GovernmentNotice[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<GovernmentNotice, 'id'>) }));
    return list;
  },

  async createNotice(data: Omit<GovernmentNotice, 'id' | 'createdAt'>): Promise<GovernmentNotice> {
    if (!db) throw new Error('Firebase Firestore is not initialized.');
    const now = new Date().toISOString();
    const docData: Omit<GovernmentNotice, 'id'> = {
      ...data,
      createdAt: now,
    };
    const docRef = await addDoc(collection(db, 'governmentNotices'), docData);
    return { id: docRef.id, ...docData };
  },
};

