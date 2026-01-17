import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { getWeather } from "./weather";

// ============================================
// GEOFENCING ALERTS
// ============================================

export interface Geofence {
  id: string;
  name: string;
  center: { latitude: number; longitude: number };
  radiusMeters: number;
  isActive: boolean;
}

export interface GeofenceAlert {
  id: string;
  geofenceId: string;
  timestamp: number;
  type: 'entered' | 'exited';
  location: { latitude: number; longitude: number };
}

class GeofenceManager {
  private geofences: Geofence[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastKnownPosition: { latitude: number; longitude: number } | null = null;

  async addGeofence(geofence: Omit<Geofence, 'id'>): Promise<Geofence> {
    const newGeofence: Geofence = {
      ...geofence,
      id: `geofence_${Date.now()}`,
    };
    
    this.geofences.push(newGeofence);
    await this.saveGeofences();
    
    return newGeofence;
  }

  async createTrailBoundary(trailCoordinates: { latitude: number; longitude: number }[]): Promise<Geofence> {
    // Calculate center point and radius from trail coordinates
    const center = this.calculateCenterPoint(trailCoordinates);
    const radius = this.calculateMaxRadius(center, trailCoordinates);
    
    return this.addGeofence({
      name: 'Trail Boundary',
      center,
      radiusMeters: radius + 100, // Add 100m buffer
      isActive: true,
    });
  }

  startMonitoring(): void {
    if (this.monitoringInterval) return;
    
    this.monitoringInterval = setInterval(async () => {
      await this.checkGeofences();
    }, 10000); // Check every 10 seconds
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private async checkGeofences(): Promise<void> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const currentPos = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      for (const geofence of this.geofences.filter(g => g.isActive)) {
        const distance = this.calculateDistance(
          currentPos.latitude,
          currentPos.longitude,
          geofence.center.latitude,
          geofence.center.longitude
        );

        const isInside = distance <= geofence.radiusMeters;
        const wasInside = this.lastKnownPosition
          ? this.calculateDistance(
              this.lastKnownPosition.latitude,
              this.lastKnownPosition.longitude,
              geofence.center.latitude,
              geofence.center.longitude
            ) <= geofence.radiusMeters
          : false;

        if (isInside && !wasInside) {
          await this.triggerAlert(geofence, 'entered', currentPos);
        } else if (!isInside && wasInside) {
          await this.triggerAlert(geofence, 'exited', currentPos);
        }
      }

      this.lastKnownPosition = currentPos;
    } catch (error) {
      console.error('Error checking geofences:', error);
    }
  }

  private async triggerAlert(
    geofence: Geofence,
    type: 'entered' | 'exited',
    location: { latitude: number; longitude: number }
  ): Promise<void> {
    const alert: GeofenceAlert = {
      id: `alert_${Date.now()}`,
      geofenceId: geofence.id,
      timestamp: Date.now(),
      type,
      location,
    };

    // Send notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: type === 'exited' ? '⚠️ Trail Boundary Alert' : '✅ Entered Trail Area',
        body: type === 'exited' 
          ? `You've left the ${geofence.name}. Stay safe!`
          : `You've entered ${geofence.name}`,
        sound: true,
      },
      trigger: null,
    });

    await this.saveAlert(alert);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

  private calculateCenterPoint(coords: { latitude: number; longitude: number }[]): { latitude: number; longitude: number } {
    const sum = coords.reduce(
      (acc, coord) => ({
        latitude: acc.latitude + coord.latitude,
        longitude: acc.longitude + coord.longitude,
      }),
      { latitude: 0, longitude: 0 }
    );

    return {
      latitude: sum.latitude / coords.length,
      longitude: sum.longitude / coords.length,
    };
  }

  private calculateMaxRadius(center: { latitude: number; longitude: number }, coords: { latitude: number; longitude: number }[]): number {
    return Math.max(
      ...coords.map(coord =>
        this.calculateDistance(center.latitude, center.longitude, coord.latitude, coord.longitude)
      )
    );
  }

  private async saveGeofences(): Promise<void> {
    await AsyncStorage.setItem('@geofences', JSON.stringify(this.geofences));
  }

  private async saveAlert(alert: GeofenceAlert): Promise<void> {
    const alerts = await this.getAlerts();
    alerts.push(alert);
    await AsyncStorage.setItem('@geofence_alerts', JSON.stringify(alerts));
  }

  async getAlerts(): Promise<GeofenceAlert[]> {
    const data = await AsyncStorage.getItem('@geofence_alerts');
    return data ? JSON.parse(data) : [];
  }
}

// ============================================
// SUNSET TIMER
// ============================================

export interface SunsetAlert {
  sunsetTime: Date;
  alertTime: Date;
  hoursBeforeSunset: number;
  location: { latitude: number; longitude: number };
}

class SunsetTimerManager {
  private alertInterval: NodeJS.Timeout | null = null;
  private hasAlerted: boolean = false;

  async startMonitoring(
    location: { latitude: number; longitude: number },
    hoursBeforeSunset: number = 2
  ): Promise<void> {
    const sunsetTime = await this.calculateSunset(location);
    const alertTime = new Date(sunsetTime.getTime() - hoursBeforeSunset * 60 * 60 * 1000);

    this.alertInterval = setInterval(async () => {
      const now = new Date();
      if (now >= alertTime && !this.hasAlerted) {
        await this.sendSunsetAlert(sunsetTime, hoursBeforeSunset);
        this.hasAlerted = true;
      }
    }, 60000); // Check every minute
  }

  stopMonitoring(): void {
    if (this.alertInterval) {
      clearInterval(this.alertInterval);
      this.alertInterval = null;
      this.hasAlerted = false;
    }
  }

  private async calculateSunset(location: { latitude: number; longitude: number }): Promise<Date> {
    // Simplified sunset calculation (use a proper library in production)
    const now = new Date();
    const sunsetHour = 18; // Approximate sunset at 6 PM
    const sunset = new Date(now);
    sunset.setHours(sunsetHour, 0, 0, 0);
    
    return sunset;
  }

  private async sendSunsetAlert(sunsetTime: Date, hoursBeforeSunset: number): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌅 Sunset Alert',
        body: `Sunset in ${hoursBeforeSunset} hours at ${sunsetTime.toLocaleTimeString()}. Consider heading back soon!`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  }

  async getTimeUntilSunset(location: { latitude: number; longitude: number }): Promise<number> {
    const sunsetTime = await this.calculateSunset(location);
    const now = new Date();
    return sunsetTime.getTime() - now.getTime();
  }
}

// ============================================
// WEATHER ALERTS
// ============================================

export interface WeatherAlert {
  id: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'extreme';
  type: string;
  message: string;
  location: { latitude: number; longitude: number };
}

class WeatherAlertManager {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastWeatherCheck: number = 0;
  private readonly CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes

  async startMonitoring(location: { latitude: number; longitude: number }): Promise<void> {
    this.monitoringInterval = setInterval(async () => {
      await this.checkWeather(location);
    }, this.CHECK_INTERVAL);

    // Check immediately
    await this.checkWeather(location);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private async checkWeather(location: { latitude: number; longitude: number }): Promise<void> {
    try {
      const weather = await getWeather(location.latitude, location.longitude);
      
      if (!weather) return;

      const alerts: WeatherAlert[] = [];

      // Check for dangerous conditions
      if (weather.temperature < 32) {
        alerts.push({
          id: `alert_${Date.now()}_freeze`,
          timestamp: Date.now(),
          severity: 'medium',
          type: 'Freezing Temperature',
          message: 'Temperature below freezing. Watch for ice on trails.',
          location,
        });
      }

      if (weather.windSpeed > 25) {
        alerts.push({
          id: `alert_${Date.now()}_wind`,
          timestamp: Date.now(),
          severity: 'high',
          type: 'High Winds',
          message: `Wind speed ${weather.windSpeed} mph. Use caution on exposed trails.`,
          location,
        });
      }

      if (weather.condition.toLowerCase().includes('storm') || 
          weather.condition.toLowerCase().includes('thunder')) {
        alerts.push({
          id: `alert_${Date.now()}_storm`,
          timestamp: Date.now(),
          severity: 'extreme',
          type: 'Storm Warning',
          message: 'Severe weather detected. Seek shelter immediately.',
          location,
        });
      }

      if (weather.condition.toLowerCase().includes('rain') || 
          weather.condition.toLowerCase().includes('snow')) {
        alerts.push({
          id: `alert_${Date.now()}_precip`,
          timestamp: Date.now(),
          severity: 'medium',
          type: 'Precipitation',
          message: `${weather.condition} detected. Trails may be slippery.`,
          location,
        });
      }

      // Send notifications for high/extreme severity
      for (const alert of alerts) {
        if (alert.severity === 'high' || alert.severity === 'extreme') {
          await this.sendWeatherNotification(alert);
        }
        await this.saveAlert(alert);
      }

      this.lastWeatherCheck = Date.now();
    } catch (error) {
      console.error('Error checking weather:', error);
    }
  }

  private async sendWeatherNotification(alert: WeatherAlert): Promise<void> {
    const emoji = alert.severity === 'extreme' ? '🚨' : '⚠️';
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${emoji} Weather Alert: ${alert.type}`,
        body: alert.message,
        sound: true,
        priority: alert.severity === 'extreme' 
          ? Notifications.AndroidNotificationPriority.MAX
          : Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  }

  private async saveAlert(alert: WeatherAlert): Promise<void> {
    const alerts = await this.getAlerts();
    alerts.push(alert);
    // Keep only last 50 alerts
    const trimmed = alerts.slice(-50);
    await AsyncStorage.setItem('@weather_alerts', JSON.stringify(trimmed));
  }

  async getAlerts(): Promise<WeatherAlert[]> {
    const data = await AsyncStorage.getItem('@weather_alerts');
    return data ? JSON.parse(data) : [];
  }
}

// ============================================
// FUEL CALCULATOR
// ============================================

export interface FuelData {
  vehicleType: string;
  tankCapacityGallons: number;
  avgMpgOnroad: number;
  avgMpgOffroad: number;
  currentFuelLevel: number; // 0-100%
}

export interface FuelEstimate {
  estimatedMilesRemaining: number;
  estimatedGallonsRemaining: number;
  canCompleteTrail: boolean;
  fuelNeededForReturn: number;
  safetyMargin: number;
}

class FuelCalculator {
  calculateEstimate(
    fuelData: FuelData,
    trailDistanceMiles: number,
    isOffroad: boolean = true
  ): FuelEstimate {
    const mpg = isOffroad ? fuelData.avgMpgOffroad : fuelData.avgMpgOnroad;
    const currentGallons = (fuelData.currentFuelLevel / 100) * fuelData.tankCapacityGallons;
    const estimatedMilesRemaining = currentGallons * mpg;
    
    // Calculate fuel needed for trail (round trip)
    const fuelNeededGallons = (trailDistanceMiles * 2) / mpg;
    const fuelNeededForReturn = (trailDistanceMiles / mpg);
    
    // 20% safety margin
    const safetyMargin = fuelNeededGallons * 0.2;
    const totalFuelNeeded = fuelNeededGallons + safetyMargin;
    
    return {
      estimatedMilesRemaining,
      estimatedGallonsRemaining: currentGallons,
      canCompleteTrail: currentGallons >= totalFuelNeeded,
      fuelNeededForReturn,
      safetyMargin,
    };
  }

  async saveFuelData(data: FuelData): Promise<void> {
    await AsyncStorage.setItem('@fuel_data', JSON.stringify(data));
  }

  async getFuelData(): Promise<FuelData | null> {
    const data = await AsyncStorage.getItem('@fuel_data');
    return data ? JSON.parse(data) : null;
  }
}

// Export singleton instances
export const geofenceManager = new GeofenceManager();
export const sunsetTimer = new SunsetTimerManager();
export const weatherAlertManager = new WeatherAlertManager();
export const fuelCalculator = new FuelCalculator();
