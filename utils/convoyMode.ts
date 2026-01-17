import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { storage } from './storage';

const CONVOY_KEY = '@adventure-time/active_convoy';
const CONVOY_HISTORY_KEY = '@adventure-time/convoy_history';

export interface ConvoyMember {
  id: string;
  name: string;
  vehicleType: string;
  location: {
    latitude: number;
    longitude: number;
    altitude?: number;
    speed?: number;
    heading?: number;
  };
  lastUpdate: number;
  status: 'active' | 'stopped' | 'emergency' | 'offline';
  isLeader: boolean;
  color: string; // For map marker
}

export interface Convoy {
  id: string;
  name: string;
  code: string; // Join code
  createdAt: number;
  leaderId: string;
  members: ConvoyMember[];
  route?: any[]; // Trail waypoints
  rallyPoints: RallyPoint[];
  status: 'active' | 'completed' | 'cancelled';
}

export interface RallyPoint {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  description: string;
  setBy: string;
  timestamp: number;
}

export class ConvoyManager {
  // Create a new convoy
  static async createConvoy(name: string): Promise<Convoy> {
    try {
      const profile = await storage.getUserProfile();
      const convoy: Convoy = {
        id: Date.now().toString(),
        name,
        code: this.generateJoinCode(),
        createdAt: Date.now(),
        leaderId: profile?.id || 'user',
        members: [],
        rallyPoints: [],
        status: 'active',
      };

      // Add creator as first member and leader
      const location = await Location.getCurrentPositionAsync();
      const leader: ConvoyMember = {
        id: profile?.id || 'user',
        name: profile?.name || 'Leader',
        vehicleType: profile?.vehicleType || 'Unknown',
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude || undefined,
          speed: location.coords.speed || undefined,
          heading: location.coords.heading || undefined,
        },
        lastUpdate: Date.now(),
        status: 'active',
        isLeader: true,
        color: '#3b82f6', // Blue for leader
      };

      convoy.members.push(leader);
      await AsyncStorage.setItem(CONVOY_KEY, JSON.stringify(convoy));
      
      return convoy;
    } catch (error) {
      console.error('Error creating convoy:', error);
      throw error;
    }
  }

  // Join existing convoy
  static async joinConvoy(code: string): Promise<Convoy | null> {
    try {
      // In production, this would connect to a backend
      // For now, we'll simulate joining
      const profile = await storage.getUserProfile();
      const location = await Location.getCurrentPositionAsync();
      
      const member: ConvoyMember = {
        id: profile?.id || Date.now().toString(),
        name: profile?.name || 'Member',
        vehicleType: profile?.vehicleType || 'Unknown',
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude || undefined,
          speed: location.coords.speed || undefined,
          heading: location.coords.heading || undefined,
        },
        lastUpdate: Date.now(),
        status: 'active',
        isLeader: false,
        color: this.getRandomColor(),
      };

      // Get existing convoy (simulated)
      const convoy = await this.getActiveConvoy();
      if (convoy && convoy.code === code) {
        convoy.members.push(member);
        await AsyncStorage.setItem(CONVOY_KEY, JSON.stringify(convoy));
        return convoy;
      }
      
      return null;
    } catch (error) {
      console.error('Error joining convoy:', error);
      return null;
    }
  }

  // Update member location
  static async updateMemberLocation(
    memberId: string,
    location: Location.LocationObject
  ): Promise<void> {
    try {
      const convoy = await this.getActiveConvoy();
      if (!convoy) return;

      const memberIndex = convoy.members.findIndex(m => m.id === memberId);
      if (memberIndex !== -1) {
        convoy.members[memberIndex].location = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude || undefined,
          speed: location.coords.speed || undefined,
          heading: location.coords.heading || undefined,
        };
        convoy.members[memberIndex].lastUpdate = Date.now();
        
        await AsyncStorage.setItem(CONVOY_KEY, JSON.stringify(convoy));
      }
    } catch (error) {
      console.error('Error updating member location:', error);
    }
  }

  // Add rally point
  static async addRallyPoint(
    name: string,
    description: string,
    location: { latitude: number; longitude: number }
  ): Promise<void> {
    try {
      const convoy = await this.getActiveConvoy();
      if (!convoy) return;

      const profile = await storage.getUserProfile();
      const rallyPoint: RallyPoint = {
        id: Date.now().toString(),
        name,
        location,
        description,
        setBy: profile?.name || 'Unknown',
        timestamp: Date.now(),
      };

      convoy.rallyPoints.push(rallyPoint);
      await AsyncStorage.setItem(CONVOY_KEY, JSON.stringify(convoy));
    } catch (error) {
      console.error('Error adding rally point:', error);
    }
  }

  // Get active convoy
  static async getActiveConvoy(): Promise<Convoy | null> {
    try {
      const convoy = await AsyncStorage.getItem(CONVOY_KEY);
      return convoy ? JSON.parse(convoy) : null;
    } catch (error) {
      console.error('Error getting active convoy:', error);
      return null;
    }
  }

  // Leave convoy
  static async leaveConvoy(memberId: string): Promise<void> {
    try {
      const convoy = await this.getActiveConvoy();
      if (!convoy) return;

      convoy.members = convoy.members.filter(m => m.id !== memberId);
      
      if (convoy.members.length === 0) {
        // End convoy if no members left
        convoy.status = 'completed';
        await this.saveToHistory(convoy);
        await AsyncStorage.removeItem(CONVOY_KEY);
      } else {
        // If leader left, assign new leader
        if (convoy.leaderId === memberId && convoy.members.length > 0) {
          convoy.members[0].isLeader = true;
          convoy.leaderId = convoy.members[0].id;
        }
        await AsyncStorage.setItem(CONVOY_KEY, JSON.stringify(convoy));
      }
    } catch (error) {
      console.error('Error leaving convoy:', error);
    }
  }

  // End convoy
  static async endConvoy(): Promise<void> {
    try {
      const convoy = await this.getActiveConvoy();
      if (convoy) {
        convoy.status = 'completed';
        await this.saveToHistory(convoy);
        await AsyncStorage.removeItem(CONVOY_KEY);
      }
    } catch (error) {
      console.error('Error ending convoy:', error);
    }
  }

  // Save to history
  private static async saveToHistory(convoy: Convoy): Promise<void> {
    try {
      const history = await this.getConvoyHistory();
      history.unshift(convoy);
      // Keep only last 20 convoys
      if (history.length > 20) {
        history.splice(20);
      }
      await AsyncStorage.setItem(CONVOY_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving convoy to history:', error);
    }
  }

  // Get convoy history
  static async getConvoyHistory(): Promise<Convoy[]> {
    try {
      const history = await AsyncStorage.getItem(CONVOY_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting convoy history:', error);
      return [];
    }
  }

  // Generate join code
  private static generateJoinCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Get random color for member marker
  private static getRandomColor(): string {
    const colors = [
      '#10b981', // Green
      '#f59e0b', // Yellow
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#06b6d4', // Cyan
      '#f97316', // Orange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Update member status
  static async updateMemberStatus(
    memberId: string,
    status: 'active' | 'stopped' | 'emergency' | 'offline'
  ): Promise<void> {
    try {
      const convoy = await this.getActiveConvoy();
      if (!convoy) return;

      const memberIndex = convoy.members.findIndex(m => m.id === memberId);
      if (memberIndex !== -1) {
        convoy.members[memberIndex].status = status;
        convoy.members[memberIndex].lastUpdate = Date.now();
        await AsyncStorage.setItem(CONVOY_KEY, JSON.stringify(convoy));
      }
    } catch (error) {
      console.error('Error updating member status:', error);
    }
  }

  // Check for offline members (no update in 5 minutes)
  static async checkOfflineMembers(): Promise<void> {
    try {
      const convoy = await this.getActiveConvoy();
      if (!convoy) return;

      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      let updated = false;

      convoy.members.forEach(member => {
        if (member.lastUpdate < fiveMinutesAgo && member.status !== 'offline') {
          member.status = 'offline';
          updated = true;
        }
      });

      if (updated) {
        await AsyncStorage.setItem(CONVOY_KEY, JSON.stringify(convoy));
      }
    } catch (error) {
      console.error('Error checking offline members:', error);
    }
  }
}
