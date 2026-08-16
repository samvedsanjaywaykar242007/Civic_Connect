import { UserProfile, UserRole } from '../types';
import { appConfig } from '../config/env';
import { auth, db } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { mockDataService } from './mockDataService';
import { MOCK_USERS } from '../data/mockData';

const CURRENT_USER_STORAGE_KEY = 'civicconnect_current_user_v1';

export const authService = {
  /**
   * Get currently active session user
   */
  getCurrentUser(): UserProfile | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
    // Default to first citizen in demo mode
    return MOCK_USERS[0];
  },

  setCurrentUser(user: UserProfile | null): void {
    try {
      if (typeof localStorage !== 'undefined') {
        if (!user) {
          localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
        } else {
          localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
        }
      }
    } catch {
      // Ignore
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('civicconnect:auth_state_change', { detail: { user } }));
    }
  },

  /**
   * Register a new citizen account.
   * STRICT SECURITY: Forces role to 'citizen'. Citizen cannot pass role parameter.
   */
  async registerCitizen(data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    ward: string;
    village?: string;
    district: string;
    state: string;
    pincode: string;
    password?: string;
  }): Promise<UserProfile> {
    if (appConfig.isDemoMode) {
      const newUser = await mockDataService.registerMockCitizen({
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        ward: data.ward,
        village: data.village,
        district: data.district,
        state: data.state,
        pincode: data.pincode,
      });
      this.setCurrentUser(newUser);
      return newUser;
    }

    // Live Firebase Auth
    if (!auth || !db) throw new Error('Firebase Auth is not initialized.');
    if (!data.password) throw new Error('Password is required for registration.');

    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const now = new Date().toISOString();

    const userProfile: UserProfile = {
      uid: userCredential.user.uid,
      email: data.email,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      role: 'citizen', // Enforce citizen role strictly
      ward: data.ward,
      village: data.village || null,
      district: data.district,
      state: data.state,
      pincode: data.pincode,
      isMock: false,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
    this.setCurrentUser(userProfile);
    return userProfile;
  },

  /**
   * Log in with Email & Password
   */
  async login(email: string, password?: string): Promise<UserProfile> {
    if (appConfig.isDemoMode) {
      const users = await mockDataService.getUsers();
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        throw new Error(`Demo account with email "${email}" not found. Try one of the pre-seeded accounts.`);
      }
      this.setCurrentUser(user);
      return user;
    }

    if (!auth || !db) throw new Error('Firebase Auth is not initialized.');
    if (!password) throw new Error('Password is required.');

    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));

    if (!userDoc.exists()) {
      throw new Error('User profile record not found in database.');
    }

    const profile = userDoc.data() as UserProfile;
    this.setCurrentUser(profile);
    return profile;
  },

  /**
   * One-Click Demo Login for quick role switching during presentations
   */
  async quickDemoLogin(role: UserRole, departmentId?: string): Promise<UserProfile> {
    const users = await mockDataService.getUsers();
    let targetUser: UserProfile | undefined;

    if (role === 'citizen') {
      targetUser = users.find((u) => u.role === 'citizen');
    } else if (role === 'admin') {
      targetUser = users.find((u) => u.role === 'admin');
    } else if (role === 'officer') {
      targetUser = departmentId
        ? users.find((u) => u.role === 'officer' && u.departmentId === departmentId)
        : users.find((u) => u.role === 'officer');
    }

    if (!targetUser) {
      targetUser = users[0];
    }

    this.setCurrentUser(targetUser);
    return targetUser;
  },

  /**
   * Log out
   */
  async logout(): Promise<void> {
    if (!appConfig.isDemoMode && auth) {
      await signOut(auth);
    }
    this.setCurrentUser(null);
  },

  /**
   * Check permissions
   */
  hasAdminPermission(user: UserProfile | null): boolean {
    return Boolean(user && user.role === 'admin');
  },

  hasOfficerPermission(user: UserProfile | null, departmentId?: string): boolean {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'officer') {
      return !departmentId || user.departmentId === departmentId;
    }
    return false;
  },
};
