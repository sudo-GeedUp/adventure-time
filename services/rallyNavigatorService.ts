import * as Location from 'expo-location';
import { Trail } from '@/utils/trails';
import { RoutePoint, AdventureHazard } from '@/utils/storage';
import { calculateDistance } from '@/utils/location';

export interface NavigationCallout {
  id: string;
  type: 'direction' | 'speed' | 'obstacle' | 'warning' | 'info' | 'turn' | 'terrain';
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  distance?: number; // Distance ahead in meters
  speed?: number; // Current or recommended speed in mph
  icon?: string;
}

export interface NavigatorState {
  currentSpeed: number;
  currentAltitude: number;
  currentHeading: number;
  distanceTraveled: number;
  upcomingTurn?: {
    direction: 'left' | 'right' | 'straight';
    distance: number;
    description: string;
  };
  terrainAhead?: string;
  hazardsAhead: AdventureHazard[];
}

class RallyNavigatorService {
  private calloutHistory: NavigationCallout[] = [];
  private lastCalloutTime: number = 0;
  private minCalloutInterval: number = 3000; // Minimum 3 seconds between callouts
  private currentTrail: Trail | null = null;
  private routePoints: RoutePoint[] = [];
  private hazards: AdventureHazard[] = [];
  private lastSpeedWarning: number = 0;
  private lastLocation: Location.LocationObject | null = null;

  /**
   * Initialize navigator with trail and route data
   */
  initialize(trail: Trail, routePoints: RoutePoint[] = [], hazards: AdventureHazard[] = []) {
    this.currentTrail = trail;
    this.routePoints = routePoints;
    this.hazards = hazards;
    this.calloutHistory = [];
    this.lastCalloutTime = 0;
  }

  /**
   * Process GPS update and generate navigation callouts
   */
  processGPSUpdate(location: Location.LocationObject): NavigationCallout[] {
    const callouts: NavigationCallout[] = [];
    const now = Date.now();

    // Update last location
    this.lastLocation = location;

    const currentSpeed = location.coords.speed ? location.coords.speed * 2.237 : 0; // Convert m/s to mph
    const currentAltitude = location.coords.altitude || 0;
    const currentHeading = location.coords.heading || 0;

    // Check for speed advisories
    const speedCallout = this.checkSpeed(currentSpeed, now);
    if (speedCallout) callouts.push(speedCallout);

    // Check for upcoming hazards
    const hazardCallouts = this.checkUpcomingHazards(location, now);
    callouts.push(...hazardCallouts);

    // Check for terrain changes
    const terrainCallout = this.checkTerrainChange(location, currentAltitude, now);
    if (terrainCallout) callouts.push(terrainCallout);

    // Check for turns/direction changes
    const directionCallout = this.checkDirectionChange(location, currentHeading, now);
    if (directionCallout) callouts.push(directionCallout);

    // Filter out callouts that are too frequent
    const filteredCallouts = callouts.filter(callout => {
      if (callout.priority === 'critical') return true;
      return now - this.lastCalloutTime >= this.minCalloutInterval;
    });

    if (filteredCallouts.length > 0) {
      this.lastCalloutTime = now;
      this.calloutHistory.push(...filteredCallouts);
    }

    return filteredCallouts;
  }

  /**
   * Check speed and provide advisories
   */
  private checkSpeed(currentSpeed: number, now: number): NavigationCallout | null {
    // Speed warnings for different conditions
    if (currentSpeed > 35 && this.currentTrail?.difficulty === 'Hard') {
      if (now - this.lastSpeedWarning > 10000) { // Every 10 seconds max
        this.lastSpeedWarning = now;
        return {
          id: `speed-${now}`,
          type: 'speed',
          message: `⚠️ Speed ${Math.round(currentSpeed)} mph - Caution on difficult terrain!`,
          priority: 'high',
          timestamp: now,
          speed: currentSpeed,
          icon: 'alert-triangle',
        };
      }
    }

    if (currentSpeed > 45) {
      if (now - this.lastSpeedWarning > 8000) {
        this.lastSpeedWarning = now;
        return {
          id: `speed-${now}`,
          type: 'speed',
          message: `🚨 Speed ${Math.round(currentSpeed)} mph - SLOW DOWN!`,
          priority: 'critical',
          timestamp: now,
          speed: currentSpeed,
          icon: 'alert-octagon',
        };
      }
    }

    // Optimal speed callouts
    if (currentSpeed >= 15 && currentSpeed <= 25 && this.currentTrail?.difficulty === 'Moderate') {
      if (now - this.lastSpeedWarning > 30000) { // Every 30 seconds
        this.lastSpeedWarning = now;
        return {
          id: `speed-${now}`,
          type: 'speed',
          message: `✓ Good pace at ${Math.round(currentSpeed)} mph`,
          priority: 'low',
          timestamp: now,
          speed: currentSpeed,
          icon: 'check-circle',
        };
      }
    }

    return null;
  }

  /**
   * Check for upcoming hazards
   */
  private checkUpcomingHazards(location: Location.LocationObject, now: number): NavigationCallout[] {
    const callouts: NavigationCallout[] = [];
    const currentPos = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    for (const hazard of this.hazards) {
      const distance = calculateDistance(currentPos, hazard.location);
      const distanceMeters = distance * 1609.34; // Convert miles to meters

      // Warn about hazards within 200 meters
      if (distanceMeters <= 200 && distanceMeters > 0) {
        const alreadyWarned = this.calloutHistory.some(
          c => c.type === 'obstacle' && c.message.includes(hazard.type)
        );

        if (!alreadyWarned || distanceMeters < 50) {
          callouts.push({
            id: `hazard-${hazard.id}-${now}`,
            type: 'obstacle',
            message: this.getHazardCallout(hazard.type, Math.round(distanceMeters)),
            priority: distanceMeters < 50 ? 'critical' : 'high',
            timestamp: now,
            distance: distanceMeters,
            icon: this.getHazardIcon(hazard.type),
          });
        }
      }
    }

    return callouts;
  }

  /**
   * Get rally-style hazard callout
   */
  private getHazardCallout(hazardType: string, distanceMeters: number): string {
    const distance = distanceMeters < 100 ? `${distanceMeters}m` : `${Math.round(distanceMeters / 10) * 10}m`;
    
    const callouts: Record<string, string> = {
      washout: `⚠️ WASHOUT ahead ${distance}!`,
      rockslide: `🪨 ROCKS on trail ${distance}!`,
      steep_grade: `📈 STEEP GRADE ${distance} - Gear down!`,
      narrow_trail: `↔️ NARROW section ${distance}!`,
      water_crossing: `💧 WATER CROSSING ${distance} - Check depth!`,
      fallen_tree: `🌲 OBSTACLE ${distance} - Tree down!`,
      soft_ground: `⚠️ SOFT GROUND ${distance} - Momentum!`,
    };

    return callouts[hazardType] || `⚠️ HAZARD ${distance}!`;
  }

  /**
   * Get icon for hazard type
   */
  private getHazardIcon(hazardType: string): string {
    const icons: Record<string, string> = {
      washout: 'alert-triangle',
      rockslide: 'alert-octagon',
      steep_grade: 'trending-up',
      narrow_trail: 'minimize-2',
      water_crossing: 'droplet',
      fallen_tree: 'x-circle',
      soft_ground: 'circle',
    };
    return icons[hazardType] || 'alert-circle';
  }

  /**
   * Check for terrain changes
   */
  private checkTerrainChange(
    location: Location.LocationObject,
    currentAltitude: number,
    now: number
  ): NavigationCallout | null {
    // Check altitude change rate
    if (this.lastLocation && this.lastLocation.coords.altitude) {
      const altitudeChange = currentAltitude - this.lastLocation.coords.altitude;
      const timeDiff = (now - (this.lastLocation.timestamp || now)) / 1000; // seconds
      
      if (timeDiff > 0) {
        const altitudeRate = altitudeChange / timeDiff; // meters per second

        // Steep climb
        if (altitudeRate > 2) {
          return {
            id: `terrain-${now}`,
            type: 'terrain',
            message: `📈 CLIMBING - ${Math.round(altitudeRate * 3.28)} ft/s`,
            priority: 'medium',
            timestamp: now,
            icon: 'trending-up',
          };
        }

        // Steep descent
        if (altitudeRate < -2) {
          return {
            id: `terrain-${now}`,
            type: 'terrain',
            message: `📉 DESCENDING - Use engine braking!`,
            priority: 'medium',
            timestamp: now,
            icon: 'trending-down',
          };
        }
      }
    }

    return null;
  }

  /**
   * Check for direction changes
   */
  private checkDirectionChange(
    location: Location.LocationObject,
    currentHeading: number,
    now: number
  ): NavigationCallout | null {
    if (!this.lastLocation || !this.lastLocation.coords.heading) {
      return null;
    }

    const headingChange = Math.abs(currentHeading - this.lastLocation.coords.heading);
    
    // Significant turn detected
    if (headingChange > 45 && headingChange < 315) {
      const direction = this.getDirectionFromHeadingChange(
        this.lastLocation.coords.heading,
        currentHeading
      );
      
      return {
        id: `turn-${now}`,
        type: 'turn',
        message: `↪️ ${direction.toUpperCase()} turn ahead`,
        priority: 'medium',
        timestamp: now,
        icon: direction === 'left' ? 'arrow-left' : 'arrow-right',
      };
    }

    return null;
  }

  /**
   * Determine turn direction from heading change
   */
  private getDirectionFromHeadingChange(oldHeading: number, newHeading: number): 'left' | 'right' {
    let diff = newHeading - oldHeading;
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;
    return diff > 0 ? 'right' : 'left';
  }

  /**
   * Get current navigator state
   */
  getNavigatorState(location: Location.LocationObject): NavigatorState {
    const currentSpeed = location.coords.speed ? location.coords.speed * 2.237 : 0;
    const currentAltitude = location.coords.altitude || 0;
    const currentHeading = location.coords.heading || 0;

    return {
      currentSpeed,
      currentAltitude,
      currentHeading,
      distanceTraveled: 0, // This should be calculated from session
      hazardsAhead: this.getHazardsAhead(location),
    };
  }

  /**
   * Get hazards ahead of current position
   */
  private getHazardsAhead(location: Location.LocationObject): AdventureHazard[] {
    const currentPos = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    return this.hazards
      .map(hazard => ({
        ...hazard,
        distance: calculateDistance(currentPos, hazard.location) * 1609.34, // meters
      }))
      .filter(hazard => hazard.distance && hazard.distance <= 500)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  /**
   * Add new hazard to navigator
   */
  addHazard(hazard: AdventureHazard) {
    this.hazards.push(hazard);
  }

  /**
   * Clear callout history
   */
  clearHistory() {
    this.calloutHistory = [];
  }

  /**
   * Get recent callouts
   */
  getRecentCallouts(count: number = 5): NavigationCallout[] {
    return this.calloutHistory.slice(-count);
  }
}

export const rallyNavigatorService = new RallyNavigatorService();
export { GuideMessage, GuideSuggestion } from './aiGuideService';
