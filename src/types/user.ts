export type UserRole = 'citizen' | 'admin' | 'officer';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  departmentId?: string | null;      // Present for officers & admins
  departmentName?: string | null;
  ward: string;                     // e.g. "Ward 14 - Gram Panchayat East"
  village?: string | null;          // e.g. "Khed"
  district: string;                 // e.g. "Pune"
  state: string;                    // e.g. "Maharashtra"
  pincode: string;                  // e.g. "410501"
  avatarUrl?: string | null;
  isMock?: boolean;
  createdAt: string;                // ISO timestamp string
  updatedAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
