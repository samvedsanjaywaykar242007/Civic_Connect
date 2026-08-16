import { CivicNotification } from '../types';
import { mockDataService } from './mockDataService';

export const notificationService = {
  async getNotifications(recipientUid?: string): Promise<CivicNotification[]> {
    return mockDataService.getNotifications(recipientUid);
  },

  async markAsRead(notificationId: string): Promise<void> {
    return mockDataService.markNotificationRead(notificationId);
  },

  async markAllAsRead(recipientUid: string): Promise<void> {
    return mockDataService.markAllNotificationsRead(recipientUid);
  },

  async createNotification(
    data: Omit<CivicNotification, 'id' | 'createdAt'>
  ): Promise<CivicNotification> {
    return mockDataService.createNotification(data);
  },
};
