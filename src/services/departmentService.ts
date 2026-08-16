import { Department } from '../types';
import { appConfig } from '../config/env';
import { mockDataService } from './mockDataService';
import { firebaseService } from './firebaseService';

export const departmentService = {
  async getDepartments(): Promise<Department[]> {
    if (appConfig.isDemoMode) {
      return mockDataService.getDepartments();
    }
    return firebaseService.getDepartments();
  },

  async getDepartmentById(deptId: string): Promise<Department | null> {
    const list = await this.getDepartments();
    return list.find((d) => d.id === deptId) || null;
  },
};
