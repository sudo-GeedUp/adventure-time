import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { Trail } from './trails';

function calculateDistance(
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

export interface ARMarker {
  id: string;
  type: 'trail-start' | 'hazard' | 'waypoint' | 'difficulty' | 'feature';
  position: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  distance: number;
  bearing: number;
  label: string;
  description?: string;
  color: string;
  icon: string;
  size: 'small' | 'medium' | 'large';
}

export interface ARTrailData {
  trail: Trail;
  markers: ARMarker[];
  userLocation: {
    latitude: number;
    longitude: number;
    heading: number;
  };
  cameraPermission: boolean;
}

class ARTrailPreviewManager {
  private currentTrailData: ARTrailData | null = null;
  private cameraPermissionGranted: boolean = false;

  async initializeAR(): Promise<boolean> {
    try {
      // Request camera permission
      const { status } = await Camera.requestCameraPermissionsAsync();
      this.cameraPermissionGranted = status === 'granted';
      
      if (!this.cameraPermissionGranted) {
        throw new Error('Camera permission required for AR preview');
      }

      // Request location permission
      const locationStatus = await Location.requestForegroundPermissionsAsync();
      if (locationStatus.status !== 'granted') {
        throw new Error('Location permission required for AR preview');
      }

      return true;
    } catch (error) {
      console.error('Error initializing AR:', error);
      return false;
    }
  }

  async loadTrailForAR(trail: Trail): Promise<ARTrailData> {
    if (!this.cameraPermissionGranted) {
      await this.initializeAR();
    }

    // Get current location and heading
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const heading = await Location.getHeadingAsync();

    const userLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      heading: heading.trueHeading || heading.magHeading || 0,
    };

    // Generate AR markers for trail
    const markers = this.generateARMarkers(trail, userLocation);

    this.currentTrailData = {
      trail,
      markers,
      userLocation,
      cameraPermission: this.cameraPermissionGranted,
    };

    return this.currentTrailData;
  }

  private generateARMarkers(
    trail: Trail,
    userLocation: { latitude: number; longitude: number; heading: number }
  ): ARMarker[] {
    const markers: ARMarker[] = [];

    // Trail start marker
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      trail.location.latitude,
      trail.location.longitude
    );

    const bearing = this.calculateBearing(
      userLocation.latitude,
      userLocation.longitude,
      trail.location.latitude,
      trail.location.longitude
    );

    markers.push({
      id: `trail_start_${trail.id}`,
      type: 'trail-start',
      position: trail.location,
      distance,
      bearing,
      label: trail.name,
      description: `${trail.distance} miles • ${trail.difficulty}`,
      color: this.getDifficultyColor(trail.difficulty),
      icon: 'flag',
      size: 'large',
    });

    // Difficulty indicator
    markers.push({
      id: `difficulty_${trail.id}`,
      type: 'difficulty',
      position: trail.location,
      distance,
      bearing,
      label: trail.difficulty,
      color: this.getDifficultyColor(trail.difficulty),
      icon: this.getDifficultyIcon(trail.difficulty),
      size: 'medium',
    });

    // Feature markers
    trail.features.forEach((feature, index) => {
      markers.push({
        id: `feature_${trail.id}_${index}`,
        type: 'feature',
        position: {
          // Offset slightly from trail start for demo
          latitude: trail.location.latitude + (Math.random() - 0.5) * 0.001,
          longitude: trail.location.longitude + (Math.random() - 0.5) * 0.001,
        },
        distance: distance + Math.random() * 100,
        bearing: bearing + (Math.random() - 0.5) * 30,
        label: feature,
        color: this.getFeatureColor(feature),
        icon: this.getFeatureIcon(feature),
        size: 'small',
      });
    });

    // Hazard markers (if any known hazards)
    if (trail.features.some(f => f.toLowerCase().includes('steep') || f.toLowerCase().includes('technical'))) {
      markers.push({
        id: `hazard_${trail.id}`,
        type: 'hazard',
        position: {
          latitude: trail.location.latitude + 0.0005,
          longitude: trail.location.longitude + 0.0005,
        },
        distance: distance + 50,
        bearing: bearing + 10,
        label: 'Caution',
        description: 'Technical section ahead',
        color: '#FF6B6B',
        icon: 'alert-triangle',
        size: 'medium',
      });
    }

    return markers;
  }

  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
  }

  private getDifficultyColor(difficulty: string): string {
    const colors = {
      'Easy': '#4ECDC4',
      'Moderate': '#FFD93D',
      'Hard': '#FF8C42',
      'Expert': '#FF3C38',
    };
    return colors[difficulty as keyof typeof colors] || '#95E1D3';
  }

  private getDifficultyIcon(difficulty: string): string {
    const icons = {
      'Easy': 'circle',
      'Moderate': 'square',
      'Hard': 'triangle',
      'Expert': 'alert-octagon',
    };
    return icons[difficulty as keyof typeof icons] || 'help-circle';
  }

  private getFeatureColor(feature: string): string {
    if (feature.toLowerCase().includes('water')) return '#3498DB';
    if (feature.toLowerCase().includes('rock')) return '#95A5A6';
    if (feature.toLowerCase().includes('scenic')) return '#27AE60';
    if (feature.toLowerCase().includes('steep')) return '#E74C3C';
    if (feature.toLowerCase().includes('sand')) return '#F39C12';
    return '#7F8C8D';
  }

  private getFeatureIcon(feature: string): string {
    if (feature.toLowerCase().includes('water')) return 'droplet';
    if (feature.toLowerCase().includes('rock')) return 'hexagon';
    if (feature.toLowerCase().includes('scenic')) return 'camera';
    if (feature.toLowerCase().includes('steep')) return 'trending-up';
    if (feature.toLowerCase().includes('sand')) return 'sun';
    if (feature.toLowerCase().includes('technical')) return 'tool';
    return 'map-pin';
  }

  async updateUserPosition(): Promise<ARMarker[]> {
    if (!this.currentTrailData) return [];

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const heading = await Location.getHeadingAsync();

      this.currentTrailData.userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        heading: heading.trueHeading || heading.magHeading || 0,
      };

      // Recalculate distances and bearings for all markers
      this.currentTrailData.markers.forEach(marker => {
        marker.distance = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          marker.position.latitude,
          marker.position.longitude
        );

        marker.bearing = this.calculateBearing(
          location.coords.latitude,
          location.coords.longitude,
          marker.position.latitude,
          marker.position.longitude
        );
      });

      return this.currentTrailData.markers;
    } catch (error) {
      console.error('Error updating user position:', error);
      return [];
    }
  }

  getVisibleMarkers(fieldOfView: number = 60, maxDistance: number = 5000): ARMarker[] {
    if (!this.currentTrailData) return [];

    const { markers, userLocation } = this.currentTrailData;
    const halfFOV = fieldOfView / 2;

    return markers.filter(marker => {
      // Filter by distance
      if (marker.distance > maxDistance) return false;

      // Filter by field of view
      const relativeBearing = Math.abs(marker.bearing - userLocation.heading);
      const normalizedBearing = relativeBearing > 180 ? 360 - relativeBearing : relativeBearing;
      
      return normalizedBearing <= halfFOV;
    });
  }

  calculateScreenPosition(
    marker: ARMarker,
    screenWidth: number,
    screenHeight: number,
    fieldOfView: number = 60
  ): { x: number; y: number; scale: number } | null {
    if (!this.currentTrailData) return null;

    const { userLocation } = this.currentTrailData;
    
    // Calculate relative bearing
    let relativeBearing = marker.bearing - userLocation.heading;
    if (relativeBearing > 180) relativeBearing -= 360;
    if (relativeBearing < -180) relativeBearing += 360;

    // Check if marker is within field of view
    if (Math.abs(relativeBearing) > fieldOfView / 2) return null;

    // Calculate horizontal position
    const x = screenWidth / 2 + (relativeBearing / (fieldOfView / 2)) * (screenWidth / 2);

    // Calculate vertical position based on distance (simplified)
    // Closer objects appear lower, farther objects appear higher
    const maxDistance = 5000; // meters
    const distanceRatio = Math.min(marker.distance / maxDistance, 1);
    const y = screenHeight * 0.3 + (screenHeight * 0.4 * distanceRatio);

    // Calculate scale based on distance
    const scale = Math.max(0.3, 1 - distanceRatio * 0.7);

    return { x, y, scale };
  }

  getTrailDifficultyAssessment(trail: Trail, vehicleType: string): {
    canComplete: boolean;
    requiredModifications: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'extreme';
    tips: string[];
  } {
    const assessment = {
      canComplete: true,
      requiredModifications: [] as string[],
      riskLevel: 'low' as 'low' | 'medium' | 'high' | 'extreme',
      tips: [] as string[],
    };

    // Check vehicle compatibility
    if (!trail.vehicleTypes.includes(vehicleType) && !trail.vehicleTypes.includes('Any 4WD')) {
      assessment.canComplete = false;
      assessment.requiredModifications.push(`Vehicle type ${vehicleType} not recommended`);
    }

    // Assess difficulty
    if (trail.difficulty === 'Expert') {
      assessment.riskLevel = 'extreme';
      assessment.requiredModifications.push('Lift kit recommended', 'Rock sliders essential');
      assessment.tips.push('Travel with experienced group', 'Bring recovery gear');
    } else if (trail.difficulty === 'Hard') {
      assessment.riskLevel = 'high';
      assessment.requiredModifications.push('All-terrain tires recommended');
      assessment.tips.push('Check weather conditions', 'Carry tow straps');
    } else if (trail.difficulty === 'Moderate') {
      assessment.riskLevel = 'medium';
      assessment.tips.push('Air down tires for better traction', 'Drive slowly through obstacles');
    } else {
      assessment.riskLevel = 'low';
      assessment.tips.push('Great for beginners', 'Enjoy the scenery');
    }

    // Check features
    if (trail.features.includes('Water Crossings')) {
      assessment.requiredModifications.push('Snorkel recommended for deep water');
      assessment.tips.push('Check water depth before crossing');
    }

    if (trail.features.includes('Rock Crawling')) {
      assessment.requiredModifications.push('Skid plates recommended');
      assessment.tips.push('Use a spotter for difficult sections');
    }

    if (trail.features.includes('Steep Climbs')) {
      assessment.tips.push('Maintain momentum', 'Use low gear');
    }

    return assessment;
  }

  getCurrentTrailData(): ARTrailData | null {
    return this.currentTrailData;
  }

  clearARData(): void {
    this.currentTrailData = null;
  }
}

export const arTrailPreviewManager = new ARTrailPreviewManager();
