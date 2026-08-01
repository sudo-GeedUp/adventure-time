import Constants from "expo-constants";

export type MapLayerType = "default" | "satellite" | "topo";

export interface TileSource {
  url: string;
  flipY?: boolean;
  maxZoom?: number;
}

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
  if (layer === "default" || !isPremium) return null;

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

  return null;
}

export function getMapViewMapType(
  layer: MapLayerType,
  tileSource: TileSource | null,
): string {
  if (tileSource) return "standard";
  if (layer === "satellite") return "satellite";
  if (layer === "topo") return "terrain";
  return "standard";
}
