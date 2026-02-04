import * as Location from "expo-location";
import * as Speech from "expo-speech";
import { Trail } from "@/utils/trails";
import { RoutePoint, AdventureHazard } from "@/utils/storage";
import { calculateDistance } from "@/utils/location";

// Enhanced location interface with additional properties
interface EnhancedLocation extends Location.LocationObject {
  enhancedSpeed?: number;
}

export interface NavigationCallout {
  id: string;
  type:
    | "direction"
    | "speed"
    | "obstacle"
    | "warning"
    | "info"
    | "turn"
    | "terrain"
    | "altitude"
    | "status";
  message: string;
  priority: "low" | "medium" | "high" | "critical";
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
    direction: "left" | "right" | "straight";
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
  private lastHeading: number | null = null;
  private audioEnabled: boolean = true;
  private maxCalloutHistory: number = 100; // Limit history to prevent memory leaks
  private lastLogTime: number = 0; // Track last log time to reduce spam

  /**
   * Initialize navigator with trail and route data
   */
  initialize(
    trail: Trail,
    routePoints: RoutePoint[] = [],
    hazards: AdventureHazard[] = [],
  ) {
    this.currentTrail = trail;
    this.routePoints = routePoints;
    this.hazards = hazards;
    this.calloutHistory = [];
    this.lastCalloutTime = 0;
    this.lastSpeedWarning = 0;

    // Generate initial welcome callout
    const welcomeCallout: NavigationCallout = {
      id: `welcome-${Date.now()}`,
      type: "info",
      message: `🏁 Adventure started on ${trail.name}! Stay safe and have fun!`,
      priority: "medium",
      timestamp: Date.now(),
      icon: "flag",
    };
    this.calloutHistory.push(welcomeCallout);
  }

  /**
   * Process GPS update and generate navigation callouts
   */
  processGPSUpdate(location: Location.LocationObject): NavigationCallout[] {
    const callouts: NavigationCallout[] = [];
    const now = Date.now();

    // Update last location
    this.lastLocation = location;

    // Use enhanced speed if available (already in MPH from ActiveAdventureScreen)
    // Otherwise convert GPS speed from m/s to mph
    const currentSpeed =
      (location as EnhancedLocation).enhancedSpeed !== undefined
        ? (location as EnhancedLocation).enhancedSpeed
        : location.coords.speed
          ? location.coords.speed * 2.237
          : 0;
    const currentAltitude = location.coords.altitude || 0;
    const currentHeading = location.coords.heading || 0;

    // Only generate callouts every 5 seconds to prevent spam
    if (now - this.lastCalloutTime < 5000) {
      return [];
    }

    // Only log every 10 seconds to reduce console spam
    if (now - this.lastLogTime > 10000 || !this.lastLogTime) {
      console.log(
        `[Rally Navigator] Speed: ${currentSpeed?.toFixed(1) || 0} MPH, Heading: ${currentHeading?.toFixed(0) || 0}°, Altitude: ${currentAltitude.toFixed(0)} ft`,
      );
      this.lastLogTime = now;
    }

    // Check for upcoming hazards
    const hazardCallouts = this.checkUpcomingHazards(location, now);
    callouts.push(...hazardCallouts);

    // Check for speed advisories (lower threshold for off-road)
    if (currentSpeed && currentSpeed > 30) {
      callouts.push({
        id: `speed-${now}`,
        message: `⚠️ Speed ${Math.round(currentSpeed)} mph - Slow down for trail conditions`,
        priority: "high",
        type: "speed",
        timestamp: now,
        icon: "alert-triangle",
      });
    }

    // Check for direction changes
    if (
      this.lastHeading !== null &&
      Math.abs(currentHeading - this.lastHeading) > 45
    ) {
      callouts.push({
        id: `turn-${now}`,
        message: `🔄 Turn ${currentHeading > this.lastHeading ? "right" : "left"} ahead`,
        priority: "medium",
        type: "direction",
        timestamp: now,
        icon: "refresh-cw",
      });
      this.lastHeading = currentHeading;
    }

    // Check for altitude changes (steep ascent/descent)
    if (this.lastLocation && this.lastLocation.coords.altitude) {
      const altitudeChange =
        currentAltitude - this.lastLocation.coords.altitude;
      if (Math.abs(altitudeChange) > 100) {
        // 100 feet change
        callouts.push({
          id: `altitude-${now}`,
          message:
            altitudeChange > 0
              ? `⬆️ Steep ascent ahead (${Math.round(altitudeChange)}ft gain)`
              : `⬇️ Steep descent ahead (${Math.abs(Math.round(altitudeChange))}ft drop)`,
          priority: "medium",
          type: "altitude",
          timestamp: now,
          icon: altitudeChange > 0 ? "trending-up" : "trending-down",
        });
      }
    }

    // Only return the highest priority callout to avoid clutter
    if (callouts.length > 1) {
      // Sort by priority: critical > high > medium > low
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      callouts.sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
      );
      // Keep only the top priority callout
      callouts.splice(1);
    }

    if (callouts.length > 0) {
      this.lastCalloutTime = now;
      this.calloutHistory.push(...callouts);
      
      // Cleanup old callouts to prevent memory leaks
      if (this.calloutHistory.length > this.maxCalloutHistory) {
        this.calloutHistory = this.calloutHistory.slice(-this.maxCalloutHistory);
      }

      // Speak the callouts over device speakers
      if (this.audioEnabled) {
        callouts.forEach((callout) => {
          this.speakCallout(callout);
        });
      }
    }

    return callouts;
  }

  /**
   * Speak a callout using text-to-speech
   */
  private speakCallout(callout: NavigationCallout): void {
    // Remove emojis for cleaner speech
    const cleanMessage = callout.message
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
      .trim();

    // Determine speech rate based on priority
    const rate = callout.priority === "critical" ? 1.1 : 0.95;
    const pitch = callout.priority === "critical" ? 1.2 : 1.0;

    Speech.speak(cleanMessage, {
      language: "en-US",
      pitch: pitch,
      rate: rate,
      volume: 1.0,
    });

    console.log("[Rally Navigator Audio] Speaking:", cleanMessage);
  }

  /**
   * Enable or disable audio callouts
   */
  setAudioEnabled(enabled: boolean): void {
    this.audioEnabled = enabled;
    if (!enabled) {
      Speech.stop();
    }
  }

  /**
   * Stop all current speech
   */
  stopSpeaking(): void {
    Speech.stop();
  }

  /**
   * Check speed and provide advisories
   */
  private checkSpeed(
    currentSpeed: number,
    now: number,
  ): NavigationCallout | null {
    // Speed warnings for different conditions
    if (currentSpeed > 35 && this.currentTrail?.difficulty === "Hard") {
      if (now - this.lastSpeedWarning > 10000) {
        // Every 10 seconds max
        this.lastSpeedWarning = now;
        return {
          id: `speed-${now}`,
          type: "speed",
          message: `⚠️ Speed ${Math.round(currentSpeed)} mph - Caution on difficult terrain!`,
          priority: "high",
          timestamp: now,
          speed: currentSpeed,
          icon: "alert-triangle",
        };
      }
    }

    if (currentSpeed > 45) {
      if (now - this.lastSpeedWarning > 8000) {
        this.lastSpeedWarning = now;
        return {
          id: `speed-${now}`,
          type: "speed",
          message: `🚨 Speed ${Math.round(currentSpeed)} mph - SLOW DOWN!`,
          priority: "critical",
          timestamp: now,
          speed: currentSpeed,
          icon: "alert-octagon",
        };
      }
    }

    // Optimal speed callouts
    if (
      currentSpeed >= 15 &&
      currentSpeed <= 25 &&
      this.currentTrail?.difficulty === "Moderate"
    ) {
      if (now - this.lastSpeedWarning > 5000) {
        // Every 5 seconds for testing
        this.lastSpeedWarning = now;
        return {
          id: `speed-${now}`,
          type: "speed",
          message: `✓ Good pace at ${Math.round(currentSpeed)} mph`,
          priority: "low",
          timestamp: now,
          speed: currentSpeed,
          icon: "check-circle",
        };
      }
    }

    // Fallback: Generate general speed callouts if moving
    if (currentSpeed > 5 && now - this.lastSpeedWarning > 5000) {
      this.lastSpeedWarning = now;
      const difficulty = this.currentTrail?.difficulty || "Unknown";
      return {
        id: `speed-${now}`,
        type: "info",
        message: `📍 Traveling at ${Math.round(currentSpeed)} mph on ${difficulty} terrain`,
        priority: "low",
        timestamp: now,
        speed: currentSpeed,
        icon: "navigation",
      };
    }

    return null;
  }

  /**
   * Check for upcoming hazards
   */
  private checkUpcomingHazards(
    location: Location.LocationObject,
    now: number,
  ): NavigationCallout[] {
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
          (c) => c.type === "obstacle" && c.message.includes(hazard.type),
        );

        if (!alreadyWarned || distanceMeters < 50) {
          callouts.push({
            id: `hazard-${hazard.id}-${now}`,
            type: "obstacle",
            message: this.getHazardCallout(
              hazard.type,
              Math.round(distanceMeters),
            ),
            priority: distanceMeters < 50 ? "critical" : "high",
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
    const distance =
      distanceMeters < 100
        ? `${distanceMeters}m`
        : `${Math.round(distanceMeters / 10) * 10}m`;

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
      washout: "alert-triangle",
      rockslide: "alert-octagon",
      steep_grade: "trending-up",
      narrow_trail: "minimize-2",
      water_crossing: "droplet",
      fallen_tree: "x-circle",
      soft_ground: "circle",
    };
    return icons[hazardType] || "alert-circle";
  }

  /**
   * Check for terrain changes
   */
  private checkTerrainChange(
    location: Location.LocationObject,
    currentAltitude: number,
    now: number,
  ): NavigationCallout | null {
    // Check altitude change rate
    if (this.lastLocation && this.lastLocation.coords.altitude) {
      const altitudeChange =
        currentAltitude - this.lastLocation.coords.altitude;
      const timeDiff = (now - (this.lastLocation.timestamp || now)) / 1000; // seconds

      if (timeDiff > 0) {
        const altitudeRate = altitudeChange / timeDiff; // meters per second

        // Steep climb
        if (altitudeRate > 2) {
          return {
            id: `terrain-${now}`,
            type: "terrain",
            message: `📈 CLIMBING - ${Math.round(altitudeRate * 3.28)} ft/s`,
            priority: "medium",
            timestamp: now,
            icon: "trending-up",
          };
        }

        // Steep descent
        if (altitudeRate < -2) {
          return {
            id: `terrain-${now}`,
            type: "terrain",
            message: `📉 DESCENDING - Use engine braking!`,
            priority: "medium",
            timestamp: now,
            icon: "trending-down",
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
    now: number,
  ): NavigationCallout | null {
    if (!this.lastLocation || !this.lastLocation.coords.heading) {
      return null;
    }

    const headingChange = Math.abs(
      currentHeading - this.lastLocation.coords.heading,
    );

    // Significant turn detected
    if (headingChange > 45 && headingChange < 315) {
      const direction = this.getDirectionFromHeadingChange(
        this.lastLocation.coords.heading,
        currentHeading,
      );

      return {
        id: `turn-${now}`,
        type: "turn",
        message: `↪️ ${direction.toUpperCase()} turn ahead`,
        priority: "medium",
        timestamp: now,
        icon: direction === "left" ? "arrow-left" : "arrow-right",
      };
    }

    return null;
  }

  /**
   * Determine turn direction from heading change
   */
  private getDirectionFromHeadingChange(
    oldHeading: number,
    newHeading: number,
  ): "left" | "right" {
    let diff = newHeading - oldHeading;
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;
    return diff > 0 ? "right" : "left";
  }

  /**
   * Get current navigator state
   */
  getNavigatorState(location: Location.LocationObject): NavigatorState {
    const currentSpeed = location.coords.speed
      ? location.coords.speed * 2.237
      : 0;
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
  private getHazardsAhead(
    location: Location.LocationObject,
  ): AdventureHazard[] {
    const currentPos = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    return this.hazards
      .map((hazard) => ({
        ...hazard,
        distance: calculateDistance(currentPos, hazard.location) * 1609.34, // meters
      }))
      .filter((hazard) => hazard.distance && hazard.distance <= 500)
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
export { GuideMessage, GuideSuggestion } from "./aiGuideService";
