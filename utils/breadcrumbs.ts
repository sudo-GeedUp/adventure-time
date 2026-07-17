import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

export interface Breadcrumb {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  altitude?: number;
  note?: string;
  type: 'auto' | 'manual' | 'waypoint';
  icon?: string;
}

export interface BreadcrumbTrail {
  id: string;
  adventureId: string;
  breadcrumbs: Breadcrumb[];
  startTime: number;
  lastUpdate: number;
  isActive: boolean;
}

const STORAGE_KEY = '@adventure-time/breadcrumb_trails';
const AUTO_DROP_INTERVAL = 30000; // Drop breadcrumb every 30 seconds
const MIN_DISTANCE_METERS = 50; // Only drop if moved 50+ meters

class BreadcrumbManager {
  private activeTrail: BreadcrumbTrail | null = null;
  private autoDropInterval: NodeJS.Timeout | null = null;
  private lastPosition: { latitude: number; longitude: number } | null = null;

  async startTrail(adventureId: string): Promise<BreadcrumbTrail> {
    const trail: BreadcrumbTrail = {
      id: `trail_${Date.now()}`,
      adventureId,
      breadcrumbs: [],
      startTime: Date.now(),
      lastUpdate: Date.now(),
      isActive: true,
    };

    this.activeTrail = trail;
    this.startAutoDropping();
    await this.saveTrail(trail);
    
    return trail;
  }

  async stopTrail(): Promise<void> {
    if (this.activeTrail) {
      this.activeTrail.isActive = false;
      await this.saveTrail(this.activeTrail);
    }
    
    this.stopAutoDropping();
    this.activeTrail = null;
    this.lastPosition = null;
  }

  private startAutoDropping(): void {
    this.autoDropInterval = setInterval(async () => {
      await this.dropAutoBreadcrumb();
    }, AUTO_DROP_INTERVAL);
  }

  private stopAutoDropping(): void {
    if (this.autoDropInterval) {
      clearInterval(this.autoDropInterval);
      this.autoDropInterval = null;
    }
  }

  private async dropAutoBreadcrumb(): Promise<void> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude, altitude } = location.coords;

      // Check if we've moved enough to warrant a new breadcrumb
      if (this.lastPosition) {
        const distance = this.calculateDistance(
          this.lastPosition.latitude,
          this.lastPosition.longitude,
          latitude,
          longitude
        );

        if (distance < MIN_DISTANCE_METERS) {
          return; // Don't drop breadcrumb if we haven't moved much
        }
      }

      await this.dropBreadcrumb({
        latitude,
        longitude,
        altitude: altitude || undefined,
        type: 'auto',
      });

      this.lastPosition = { latitude, longitude };
    } catch (error) {
      console.error('Error dropping auto breadcrumb:', error);
    }
  }

  async dropBreadcrumb(params: {
    latitude: number;
    longitude: number;
    altitude?: number;
    note?: string;
    type?: 'auto' | 'manual' | 'waypoint';
    icon?: string;
  }): Promise<Breadcrumb | null> {
    if (!this.activeTrail) {
      console.warn('No active trail to drop breadcrumb on');
      return null;
    }

    const breadcrumb: Breadcrumb = {
      id: `breadcrumb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      latitude: params.latitude,
      longitude: params.longitude,
      timestamp: Date.now(),
      altitude: params.altitude,
      note: params.note,
      type: params.type || 'manual',
      icon: params.icon,
    };

    this.activeTrail.breadcrumbs.push(breadcrumb);
    this.activeTrail.lastUpdate = Date.now();
    
    await this.saveTrail(this.activeTrail);
    
    return breadcrumb;
  }

  async getActiveTrail(): Promise<BreadcrumbTrail | null> {
    return this.activeTrail;
  }

  async getAllTrails(): Promise<BreadcrumbTrail[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading breadcrumb trails:', error);
      return [];
    }
  }

  async getTrailById(trailId: string): Promise<BreadcrumbTrail | null> {
    const trails = await this.getAllTrails();
    return trails.find(t => t.id === trailId) || null;
  }

  async getTrailByAdventureId(adventureId: string): Promise<BreadcrumbTrail | null> {
    const trails = await this.getAllTrails();
    return trails.find(t => t.adventureId === adventureId) || null;
  }

  private async saveTrail(trail: BreadcrumbTrail): Promise<void> {
    try {
      const trails = await this.getAllTrails();
      const index = trails.findIndex(t => t.id === trail.id);
      
      if (index >= 0) {
        trails[index] = trail;
      } else {
        trails.push(trail);
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trails));
    } catch (error) {
      console.error('Error saving breadcrumb trail:', error);
    }
  }

  async deleteTrail(trailId: string): Promise<void> {
    try {
      const trails = await this.getAllTrails();
      const filtered = trails.filter(t => t.id !== trailId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting breadcrumb trail:', error);
    }
  }

  async getBacktrackRoute(): Promise<Breadcrumb[]> {
    if (!this.activeTrail) {
      return [];
    }
    
    // Return breadcrumbs in reverse order for backtracking
    return [...this.activeTrail.breadcrumbs].reverse();
  }

  async getDistanceToStart(): Promise<number | null> {
    if (!this.activeTrail || this.activeTrail.breadcrumbs.length === 0) {
      return null;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const startBreadcrumb = this.activeTrail.breadcrumbs[0];
      
      return this.calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        startBreadcrumb.latitude,
        startBreadcrumb.longitude
      );
    } catch (error) {
      console.error('Error calculating distance to start:', error);
      return null;
    }
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  async exportToGPX(trailId: string): Promise<string> {
    const trail = await this.getTrailById(trailId);
    if (!trail) {
      throw new Error('Trail not found');
    }

    const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Adventure Time" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Breadcrumb Trail ${new Date(trail.startTime).toISOString()}</name>
    <time>${new Date(trail.startTime).toISOString()}</time>
  </metadata>
  <trk>
    <name>Breadcrumb Trail</name>
    <trkseg>`;

    const trackPoints = trail.breadcrumbs
      .map(
        (b) => `
      <trkpt lat="${b.latitude}" lon="${b.longitude}">
        ${b.altitude ? `<ele>${b.altitude}</ele>` : ''}
        <time>${new Date(b.timestamp).toISOString()}</time>
        ${b.note ? `<name>${b.note}</name>` : ''}
      </trkpt>`
      )
      .join('');

    const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;

    return gpxHeader + trackPoints + gpxFooter;
  }
}

export const breadcrumbManager = new BreadcrumbManager();
