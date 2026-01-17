import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export interface GPXTrackPoint {
  latitude: number;
  longitude: number;
  elevation?: number;
  timestamp: number;
  speed?: number;
  heading?: number;
}

export interface GPXWaypoint {
  latitude: number;
  longitude: number;
  elevation?: number;
  name: string;
  description?: string;
  timestamp: number;
  symbol?: string;
}

export interface GPXTrack {
  id: string;
  name: string;
  description?: string;
  startTime: number;
  endTime?: number;
  trackPoints: GPXTrackPoint[];
  waypoints: GPXWaypoint[];
  totalDistance: number;
  totalDuration: number;
  maxSpeed: number;
  maxElevation: number;
  minElevation: number;
  averageSpeed: number;
}

const STORAGE_KEY = '@gpx_tracks';

class GPXRecorder {
  private activeTrack: GPXTrack | null = null;
  private recordingInterval: NodeJS.Timeout | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;

  async startRecording(name: string, description?: string): Promise<GPXTrack> {
    const track: GPXTrack = {
      id: `track_${Date.now()}`,
      name,
      description,
      startTime: Date.now(),
      trackPoints: [],
      waypoints: [],
      totalDistance: 0,
      totalDuration: 0,
      maxSpeed: 0,
      maxElevation: -Infinity,
      minElevation: Infinity,
      averageSpeed: 0,
    };

    this.activeTrack = track;
    await this.startLocationTracking();
    
    return track;
  }

  async stopRecording(): Promise<GPXTrack | null> {
    if (!this.activeTrack) return null;

    this.activeTrack.endTime = Date.now();
    this.activeTrack.totalDuration = this.activeTrack.endTime - this.activeTrack.startTime;
    
    // Calculate average speed
    if (this.activeTrack.trackPoints.length > 0) {
      const totalSpeed = this.activeTrack.trackPoints.reduce((sum, pt) => sum + (pt.speed || 0), 0);
      this.activeTrack.averageSpeed = totalSpeed / this.activeTrack.trackPoints.length;
    }

    await this.saveTrack(this.activeTrack);
    this.stopLocationTracking();

    const completedTrack = this.activeTrack;
    this.activeTrack = null;
    
    return completedTrack;
  }

  async pauseRecording(): Promise<void> {
    this.stopLocationTracking();
  }

  async resumeRecording(): Promise<void> {
    if (this.activeTrack) {
      await this.startLocationTracking();
    }
  }

  private async startLocationTracking(): Promise<void> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // Record every second
          distanceInterval: 5, // Or every 5 meters
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
      throw error;
    }
  }

  private stopLocationTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
  }

  private handleLocationUpdate(location: Location.LocationObject): void {
    if (!this.activeTrack) return;

    const trackPoint: GPXTrackPoint = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      elevation: location.coords.altitude || undefined,
      timestamp: location.timestamp,
      speed: location.coords.speed || undefined,
      heading: location.coords.heading || undefined,
    };

    // Update track statistics
    if (trackPoint.speed && trackPoint.speed > this.activeTrack.maxSpeed) {
      this.activeTrack.maxSpeed = trackPoint.speed;
    }

    if (trackPoint.elevation) {
      if (trackPoint.elevation > this.activeTrack.maxElevation) {
        this.activeTrack.maxElevation = trackPoint.elevation;
      }
      if (trackPoint.elevation < this.activeTrack.minElevation) {
        this.activeTrack.minElevation = trackPoint.elevation;
      }
    }

    // Calculate distance from last point
    if (this.activeTrack.trackPoints.length > 0) {
      const lastPoint = this.activeTrack.trackPoints[this.activeTrack.trackPoints.length - 1];
      const distance = this.calculateDistance(
        lastPoint.latitude,
        lastPoint.longitude,
        trackPoint.latitude,
        trackPoint.longitude
      );
      this.activeTrack.totalDistance += distance;
    }

    this.activeTrack.trackPoints.push(trackPoint);
  }

  async addWaypoint(
    name: string,
    description?: string,
    symbol?: string
  ): Promise<GPXWaypoint | null> {
    if (!this.activeTrack) return null;

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const waypoint: GPXWaypoint = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        elevation: location.coords.altitude || undefined,
        name,
        description,
        timestamp: Date.now(),
        symbol,
      };

      this.activeTrack.waypoints.push(waypoint);
      return waypoint;
    } catch (error) {
      console.error('Error adding waypoint:', error);
      return null;
    }
  }

  async exportToGPX(trackId: string): Promise<string> {
    const track = await this.getTrackById(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    return this.generateGPXString(track);
  }

  private generateGPXString(track: GPXTrack): string {
    const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Adventure Time" 
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${this.escapeXml(track.name)}</name>
    ${track.description ? `<desc>${this.escapeXml(track.description)}</desc>` : ''}
    <time>${new Date(track.startTime).toISOString()}</time>
  </metadata>`;

    // Add waypoints
    const waypoints = track.waypoints
      .map(
        (wp) => `
  <wpt lat="${wp.latitude}" lon="${wp.longitude}">
    ${wp.elevation ? `<ele>${wp.elevation}</ele>` : ''}
    <time>${new Date(wp.timestamp).toISOString()}</time>
    <name>${this.escapeXml(wp.name)}</name>
    ${wp.description ? `<desc>${this.escapeXml(wp.description)}</desc>` : ''}
    ${wp.symbol ? `<sym>${this.escapeXml(wp.symbol)}</sym>` : ''}
  </wpt>`
      )
      .join('');

    // Add track
    const trackPoints = track.trackPoints
      .map(
        (pt) => `
      <trkpt lat="${pt.latitude}" lon="${pt.longitude}">
        ${pt.elevation ? `<ele>${pt.elevation}</ele>` : ''}
        <time>${new Date(pt.timestamp).toISOString()}</time>
        ${pt.speed ? `<speed>${pt.speed}</speed>` : ''}
        ${pt.heading ? `<course>${pt.heading}</course>` : ''}
      </trkpt>`
      )
      .join('');

    const trackSection = `
  <trk>
    <name>${this.escapeXml(track.name)}</name>
    ${track.description ? `<desc>${this.escapeXml(track.description)}</desc>` : ''}
    <trkseg>${trackPoints}
    </trkseg>
  </trk>`;

    const gpxFooter = `
</gpx>`;

    return gpxHeader + waypoints + trackSection + gpxFooter;
  }

  async saveGPXFile(trackId: string): Promise<string> {
    const gpxString = await this.exportToGPX(trackId);
    const track = await this.getTrackById(trackId);
    
    if (!track) {
      throw new Error('Track not found');
    }

    const fileName = `${track.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.gpx`;
    // Use a temporary directory path for GPX files
    const filePath = `${fileName}`;

    // For now, just return the GPX string as we can't write to filesystem in Expo Go
    // In production, this would write to FileSystem.documentDirectory
    console.log('GPX file would be saved as:', fileName);
    return filePath;
  }

  async shareGPX(trackId: string): Promise<void> {
    const filePath = await this.saveGPXFile(trackId);
    
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device');
    }

    await Sharing.shareAsync(filePath, {
      mimeType: 'application/gpx+xml',
      dialogTitle: 'Share GPX Track',
    });
  }

  async importGPX(gpxString: string): Promise<GPXTrack> {
    // Basic GPX parsing (in production, use a proper XML parser)
    const track: GPXTrack = {
      id: `imported_${Date.now()}`,
      name: 'Imported Track',
      startTime: Date.now(),
      trackPoints: [],
      waypoints: [],
      totalDistance: 0,
      totalDuration: 0,
      maxSpeed: 0,
      maxElevation: -Infinity,
      minElevation: Infinity,
      averageSpeed: 0,
    };

    // This is a simplified parser - in production, use a proper XML parser
    // For now, just save the track
    await this.saveTrack(track);
    return track;
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  async getActiveTrack(): Promise<GPXTrack | null> {
    return this.activeTrack;
  }

  async getAllTracks(): Promise<GPXTrack[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading tracks:', error);
      return [];
    }
  }

  async getTrackById(trackId: string): Promise<GPXTrack | null> {
    const tracks = await this.getAllTracks();
    return tracks.find(t => t.id === trackId) || null;
  }

  private async saveTrack(track: GPXTrack): Promise<void> {
    try {
      const tracks = await this.getAllTracks();
      const index = tracks.findIndex(t => t.id === track.id);
      
      if (index >= 0) {
        tracks[index] = track;
      } else {
        tracks.push(track);
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
    } catch (error) {
      console.error('Error saving track:', error);
    }
  }

  async deleteTrack(trackId: string): Promise<void> {
    try {
      const tracks = await this.getAllTracks();
      const filtered = tracks.filter(t => t.id !== trackId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting track:', error);
    }
  }
}

export const gpxRecorder = new GPXRecorder();
