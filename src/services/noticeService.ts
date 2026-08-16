import { GovernmentNotice } from '../types';
import { appConfig } from '../config/env';
import { mockDataService } from './mockDataService';
import { firebaseService } from './firebaseService';

export const noticeService = {
  async getNotices(): Promise<GovernmentNotice[]> {
    if (appConfig.isDemoMode) {
      return mockDataService.getNotices();
    }
    return firebaseService.getNotices();
  },

  async createNotice(data: Omit<GovernmentNotice, 'id' | 'createdAt'>): Promise<GovernmentNotice> {
    if (appConfig.isDemoMode) {
      return mockDataService.createNotice(data);
    }
    return firebaseService.createNotice(data);
  },
};
