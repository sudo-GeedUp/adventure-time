import AsyncStorage from "@react-native-async-storage/async-storage";
import { Trail, TrailLocation } from "./trails";

const OFFLINE_TRAILS_KEY = "@adventure-time/offline_trails";
const OFFLINE_MAP_TILES_KEY = "@adventure-time/offline_map_tiles";

interface OfflineTrail extends Trail {
  cachedAt: number;
  isDownloaded: boolean;
}

interface MapTile {
  x: number;
  y: number;
  z: number;
  data: string; // base64 encoded image data
  cachedAt: number;
}

export class OfflineMapsManager {
  // Cache trail data for offline use
  static async cacheTrail(trail: Trail): Promise<void> {
    try {
      const existingTrails = await this.getCachedTrails();
      const offlineTrail: OfflineTrail = {
        ...trail,
        cachedAt: Date.now(),
        isDownloaded: true,
      };

      // Remove existing trail with same ID if exists
      const filteredTrails = existingTrails.filter(t => t.id !== trail.id);
      filteredTrails.push(offlineTrail);

      await AsyncStorage.setItem(OFFLINE_TRAILS_KEY, JSON.stringify(filteredTrails));
      console.log(`Trail "${trail.name}" cached for offline use`);
    } catch (error) {
      console.error("Error caching trail for offline use:", error);
    }
  }

  // Get all cached trails
  static async getCachedTrails(): Promise<OfflineTrail[]> {
    try {
      const cached = await AsyncStorage.getItem(OFFLINE_TRAILS_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error("Error getting cached trails:", error);
      return [];
    }
  }

  // Check if a trail is cached
  static async isTrailCached(trailId: string): Promise<boolean> {
    try {
      const trails = await this.getCachedTrails();
      return trails.some(trail => trail.id === trailId && trail.isDownloaded);
    } catch (error) {
      console.error("Error checking if trail is cached:", error);
      return false;
    }
  }

  // Remove trail from cache
  static async removeCachedTrail(trailId: string): Promise<void> {
    try {
      const trails = await this.getCachedTrails();
      const filteredTrails = trails.filter(trail => trail.id !== trailId);
      await AsyncStorage.setItem(OFFLINE_TRAILS_KEY, JSON.stringify(filteredTrails));
      console.log(`Trail "${trailId}" removed from cache`);
    } catch (error) {
      console.error("Error removing cached trail:", error);
    }
  }

  // Get cached trails near location (for offline navigation)
  static async getTrailsNearLocation(
    location: TrailLocation, 
    radiusMiles: number
  ): Promise<OfflineTrail[]> {
    try {
      const cachedTrails = await this.getCachedTrails();
      return cachedTrails.filter(trail => {
        if (!trail.isDownloaded) return false;
        
        // Calculate distance using haversine formula
        const R = 3959; // Earth's radius in miles
        const dLat = ((trail.location.latitude - location.latitude) * Math.PI) / 180;
        const dLon = ((trail.location.longitude - location.longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((location.latitude * Math.PI) / 180) *
            Math.cos((trail.location.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance <= radiusMiles;
      });
    } catch (error) {
      console.error("Error getting cached trails near location:", error);
      return [];
    }
  }

  // Cache map tiles for offline use (simplified version)
  static async cacheMapTile(tile: MapTile): Promise<void> {
    try {
      const existingTiles = await this.getCachedMapTiles();
      existingTiles.push(tile);
      
      // Keep only last 100 tiles to prevent storage bloat
      if (existingTiles.length > 100) {
        existingTiles.sort((a, b) => b.cachedAt - a.cachedAt);
        existingTiles.splice(100);
      }

      await AsyncStorage.setItem(OFFLINE_MAP_TILES_KEY, JSON.stringify(existingTiles));
    } catch (error) {
      console.error("Error caching map tile:", error);
    }
  }

  // Get cached map tiles
  static async getCachedMapTiles(): Promise<MapTile[]> {
    try {
      const cached = await AsyncStorage.getItem(OFFLINE_MAP_TILES_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error("Error getting cached map tiles:", error);
      return [];
    }
  }

  // Clear old cache data (older than 30 days)
  static async clearOldCache(): Promise<void> {
    try {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      // Clear old trails
      const trails = await this.getCachedTrails();
      const validTrails = trails.filter(trail => trail.cachedAt > thirtyDaysAgo);
      await AsyncStorage.setItem(OFFLINE_TRAILS_KEY, JSON.stringify(validTrails));

      // Clear old map tiles
      const tiles = await this.getCachedMapTiles();
      const validTiles = tiles.filter(tile => tile.cachedAt > thirtyDaysAgo);
      await AsyncStorage.setItem(OFFLINE_MAP_TILES_KEY, JSON.stringify(validTiles));

      console.log("Old offline cache data cleared");
    } catch (error) {
      console.error("Error clearing old cache data:", error);
    }
  }

  // Get storage usage info
  static async getCacheInfo(): Promise<{
    trailsCount: number;
    tilesCount: number;
    totalSizeKB: number;
  }> {
    try {
      const trails = await this.getCachedTrails();
      const tiles = await this.getCachedMapTiles();
      
      // Rough estimation of storage size
      const trailsSize = JSON.stringify(trails).length;
      const tilesSize = JSON.stringify(tiles).length;
      const totalSizeKB = Math.round((trailsSize + tilesSize) / 1024);

      return {
        trailsCount: trails.length,
        tilesCount: tiles.length,
        totalSizeKB,
      };
    } catch (error) {
      console.error("Error getting cache info:", error);
      return { trailsCount: 0, tilesCount: 0, totalSizeKB: 0 };
    }
  }
}
