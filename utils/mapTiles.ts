import Constants from "expo-constants";

export type MapLayerType = "default" | "satellite" | "topo";

export interface TileSource {
  url: string;
  flipY?: boolean;
  maxZoom?: number;
}

const FREE_TILE_SOURCES: Record<MapLayerType, TileSource | null> = {
  default: null,
  satellite: {
    // ArcGIS World Imagery tiles use TMS row order and a {z}/{y}/{x} path.
    url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    flipY: true,
    maxZoom: 18,
  },
  topo: {
    url: "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
    maxZoom: 17,
  },
};

const MAPBOX_SATELLITE_URL =
  "https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token={token}";

const MAPTILER_SATELLITE_URL =
  "https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key={key}";

const MAPTILER_TOPO_URL =
  "https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key={key}";

function getMapboxToken(): string | undefined {
  return (
    (process.env as any)?.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    (Constants.expoConfig?.extra?.mapboxAccessToken as string | undefined)
  );
}

function getMapTilerKey(): string | undefined {
  return (
    (process.env as any)?.EXPO_PUBLIC_MAPTILER_KEY ||
    (Constants.expoConfig?.extra?.mapTilerKey as string | undefined)
  );
}

export function getTileSource(
  layer: MapLayerType,
  isPremium: boolean,
): TileSource | null {
  if (layer === "default") return null;

  if (isPremium) {
    if (layer === "satellite") {
      const mapboxToken = getMapboxToken();
      if (mapboxToken) {
        return {
          url: MAPBOX_SATELLITE_URL.replace("{token}", mapboxToken),
          maxZoom: 20,
        };
      }

      const mapTilerKey = getMapTilerKey();
      if (mapTilerKey) {
        return {
          url: MAPTILER_SATELLITE_URL.replace("{key}", mapTilerKey),
          maxZoom: 20,
        };
      }
    }

    if (layer === "topo") {
      const mapTilerKey = getMapTilerKey();
      if (mapTilerKey) {
        return {
          url: MAPTILER_TOPO_URL.replace("{key}", mapTilerKey),
          maxZoom: 18,
        };
      }
    }
  }

  return FREE_TILE_SOURCES[layer];
}
