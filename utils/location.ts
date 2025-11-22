export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 3959;
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
      Math.cos(toRad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function generateNearbyCoordinate(
  centerCoord: Coordinates,
  maxDistanceMiles: number
): Coordinates {
  const randomAngle = Math.random() * 2 * Math.PI;
  const randomDistance = Math.random() * maxDistanceMiles;
  
  const deltaLat = (randomDistance / 69) * Math.cos(randomAngle);
  const deltaLon =
    (randomDistance / (69 * Math.cos(toRad(centerCoord.latitude)))) *
    Math.sin(randomAngle);
  
  return {
    latitude: centerCoord.latitude + deltaLat,
    longitude: centerCoord.longitude + deltaLon,
  };
}
