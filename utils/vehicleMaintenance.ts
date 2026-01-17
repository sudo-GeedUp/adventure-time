import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from './storage';

const MAINTENANCE_LOG_KEY = '@adventure-time/maintenance_log';
const MAINTENANCE_SCHEDULE_KEY = '@adventure-time/maintenance_schedule';

export interface MaintenanceItem {
  id: string;
  type: 'Oil Change' | 'Tire Rotation' | 'Air Filter' | 'Brake Service' | 'Transmission' | 'Differential' | 'Coolant' | 'Custom';
  customType?: string;
  performedAt: number;
  mileage: number;
  trailMiles: number; // Trail miles since last service
  cost: number;
  notes: string;
  shop?: string;
  nextDue?: {
    miles: number;
    date: number;
  };
}

export interface MaintenanceSchedule {
  id: string;
  type: string;
  intervalMiles: number;
  intervalMonths: number;
  lastPerformed?: number;
  nextDueMiles: number;
  nextDueDate: number;
  severity: 'low' | 'medium' | 'high';
  trailMultiplier: number; // How much trail miles count (e.g., 2x = 1 trail mile = 2 street miles)
}

export interface VehicleDamage {
  id: string;
  trailId: string;
  trailName: string;
  date: number;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  repairCost?: number;
  repaired: boolean;
  photos?: string[];
}

export class MaintenanceTracker {
  // Add maintenance record
  static async addMaintenanceRecord(item: Omit<MaintenanceItem, 'id'>): Promise<void> {
    try {
      const newItem: MaintenanceItem = {
        ...item,
        id: Date.now().toString(),
      };

      const log = await this.getMaintenanceLog();
      log.unshift(newItem);
      await AsyncStorage.setItem(MAINTENANCE_LOG_KEY, JSON.stringify(log));

      // Update schedule if applicable
      await this.updateScheduleForType(item.type === 'Custom' ? item.customType! : item.type);
    } catch (error) {
      console.error('Error adding maintenance record:', error);
    }
  }

  // Get maintenance log
  static async getMaintenanceLog(): Promise<MaintenanceItem[]> {
    try {
      const log = await AsyncStorage.getItem(MAINTENANCE_LOG_KEY);
      return log ? JSON.parse(log) : [];
    } catch (error) {
      console.error('Error getting maintenance log:', error);
      return [];
    }
  }

  // Set up maintenance schedule
  static async setupMaintenanceSchedule(vehicleType: string): Promise<void> {
    try {
      // Default maintenance intervals (can be customized per vehicle)
      const defaultSchedule: MaintenanceSchedule[] = [
        {
          id: 'oil',
          type: 'Oil Change',
          intervalMiles: 3000,
          intervalMonths: 3,
          nextDueMiles: 3000,
          nextDueDate: Date.now() + (90 * 24 * 60 * 60 * 1000),
          severity: 'high',
          trailMultiplier: 2, // Trail miles count double
        },
        {
          id: 'tires',
          type: 'Tire Rotation',
          intervalMiles: 5000,
          intervalMonths: 6,
          nextDueMiles: 5000,
          nextDueDate: Date.now() + (180 * 24 * 60 * 60 * 1000),
          severity: 'medium',
          trailMultiplier: 1.5,
        },
        {
          id: 'air_filter',
          type: 'Air Filter',
          intervalMiles: 12000,
          intervalMonths: 12,
          nextDueMiles: 12000,
          nextDueDate: Date.now() + (365 * 24 * 60 * 60 * 1000),
          severity: 'low',
          trailMultiplier: 3, // Gets dirty faster on trails
        },
        {
          id: 'diff',
          type: 'Differential',
          intervalMiles: 15000,
          intervalMonths: 24,
          nextDueMiles: 15000,
          nextDueDate: Date.now() + (730 * 24 * 60 * 60 * 1000),
          severity: 'high',
          trailMultiplier: 2,
        },
      ];

      await AsyncStorage.setItem(MAINTENANCE_SCHEDULE_KEY, JSON.stringify(defaultSchedule));
    } catch (error) {
      console.error('Error setting up maintenance schedule:', error);
    }
  }

  // Get maintenance schedule
  static async getMaintenanceSchedule(): Promise<MaintenanceSchedule[]> {
    try {
      const schedule = await AsyncStorage.getItem(MAINTENANCE_SCHEDULE_KEY);
      return schedule ? JSON.parse(schedule) : [];
    } catch (error) {
      console.error('Error getting maintenance schedule:', error);
      return [];
    }
  }

  // Update schedule after maintenance
  private static async updateScheduleForType(type: string): Promise<void> {
    try {
      const schedule = await this.getMaintenanceSchedule();
      const itemIndex = schedule.findIndex(s => s.type === type);
      
      if (itemIndex !== -1) {
        const item = schedule[itemIndex];
        const stats = await storage.getUserStats();
        
        item.lastPerformed = Date.now();
        item.nextDueMiles = (stats?.totalMiles || 0) + item.intervalMiles;
        item.nextDueDate = Date.now() + (item.intervalMonths * 30 * 24 * 60 * 60 * 1000);
        
        schedule[itemIndex] = item;
        await AsyncStorage.setItem(MAINTENANCE_SCHEDULE_KEY, JSON.stringify(schedule));
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  }

  // Check for due maintenance
  static async checkDueMaintenance(): Promise<MaintenanceSchedule[]> {
    try {
      const schedule = await this.getMaintenanceSchedule();
      const stats = await storage.getTrailStats();
      const currentMiles = stats?.totalMiles || 0;
      const now = Date.now();

      return schedule.filter(item => 
        item.nextDueMiles <= currentMiles || item.nextDueDate <= now
      );
    } catch (error) {
      console.error('Error checking due maintenance:', error);
      return [];
    }
  }

  // Calculate maintenance cost per adventure
  static async calculateCostPerAdventure(
    startDate?: number,
    endDate?: number
  ): Promise<{
    totalCost: number;
    adventureCount: number;
    costPerAdventure: number;
    byType: { [key: string]: number };
  }> {
    try {
      const log = await this.getMaintenanceLog();
      const adventures = await storage.getCommunityAdventures();
      
      const filteredLog = log.filter(item => {
        if (startDate && item.performedAt < startDate) return false;
        if (endDate && item.performedAt > endDate) return false;
        return true;
      });

      const filteredAdventures = adventures.filter((adv: any) => {
        if (startDate && adv.startTime < startDate) return false;
        if (endDate && adv.startTime > endDate) return false;
        return true;
      });

      const totalCost = filteredLog.reduce((sum, item) => sum + item.cost, 0);
      const byType: { [key: string]: number } = {};
      
      filteredLog.forEach(item => {
        const type = item.type === 'Custom' ? item.customType! : item.type;
        byType[type] = (byType[type] || 0) + item.cost;
      });

      return {
        totalCost,
        adventureCount: filteredAdventures.length,
        costPerAdventure: filteredAdventures.length > 0 
          ? Math.round(totalCost / filteredAdventures.length * 100) / 100 
          : 0,
        byType,
      };
    } catch (error) {
      console.error('Error calculating cost per adventure:', error);
      return {
        totalCost: 0,
        adventureCount: 0,
        costPerAdventure: 0,
        byType: {},
      };
    }
  }

  // Log trail damage
  static async logTrailDamage(damage: Omit<VehicleDamage, 'id'>): Promise<void> {
    try {
      const newDamage: VehicleDamage = {
        ...damage,
        id: Date.now().toString(),
      };

      const damageLog = await this.getDamageLog();
      damageLog.unshift(newDamage);
      await AsyncStorage.setItem('@adventure-time/damage_log', JSON.stringify(damageLog));
    } catch (error) {
      console.error('Error logging trail damage:', error);
    }
  }

  // Get damage log
  static async getDamageLog(): Promise<VehicleDamage[]> {
    try {
      const log = await AsyncStorage.getItem('@adventure-time/damage_log');
      return log ? JSON.parse(log) : [];
    } catch (error) {
      console.error('Error getting damage log:', error);
      return [];
    }
  }

  // Mark damage as repaired
  static async markDamageRepaired(damageId: string, cost: number): Promise<void> {
    try {
      const log = await this.getDamageLog();
      const index = log.findIndex(d => d.id === damageId);
      
      if (index !== -1) {
        log[index].repaired = true;
        log[index].repairCost = cost;
        await AsyncStorage.setItem('@adventure-time/damage_log', JSON.stringify(log));
      }
    } catch (error) {
      console.error('Error marking damage as repaired:', error);
    }
  }

  // Get maintenance reminders
  static async getMaintenanceReminders(): Promise<string[]> {
    try {
      const due = await this.checkDueMaintenance();
      const reminders: string[] = [];
      
      due.forEach(item => {
        const daysOverdue = Math.floor((Date.now() - item.nextDueDate) / (24 * 60 * 60 * 1000));
        if (daysOverdue > 0) {
          reminders.push(`⚠️ ${item.type} is ${daysOverdue} days overdue!`);
        } else {
          const daysUntil = Math.floor((item.nextDueDate - Date.now()) / (24 * 60 * 60 * 1000));
          reminders.push(`📅 ${item.type} due in ${daysUntil} days`);
        }
      });
      
      return reminders;
    } catch (error) {
      console.error('Error getting maintenance reminders:', error);
      return [];
    }
  }
}
