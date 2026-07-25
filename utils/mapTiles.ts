import Constants from "expo-constants";

export type MapLayerType = "default" | "satellite" | "topo";

export interface TileSource {
  url: string;
  flipY?: boolean;
  maxZoom?: number;
}

export const TILE_SOURCES: Record<MapLayerType, TileSource | null> = {
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

export function getTileSource(
  layer: MapLayerType,
  isPremium: boolean,
): TileSource | null {
  if (layer === "default") return null;

  const token = Constants.expoConfig?.extra?.mapboxAccessToken as
    | string
    | undefined;

  if (isPremium && token) {
    return {
      url: MAPBOX_SATELLITE_URL.replace("{token}", token),
      maxZoom: 20,
    };
  }

  return TILE_SOURCES[layer];
}
