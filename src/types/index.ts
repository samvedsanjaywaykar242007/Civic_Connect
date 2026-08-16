export * from './user';
export * from './complaint';
export * from './department';
export * from './notification';
export * from './notice';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';
