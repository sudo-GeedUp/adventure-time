import { calculateDistance } from "./location";

export interface NavPoint {
  latitude: number;
  longitude: number;
}

export interface SnapResult {
  snappedPoint: NavPoint;
  segmentIndex: number;
  segmentProgress: number;
  distanceToRouteMiles: number;
  distanceTraveledMiles: number;
  distanceRemainingMiles: number;
  totalRouteDistanceMiles: number;
}

export interface TurnInfo {
  distance: number;
  direction: "left" | "right";
  bearingChange: number;
}

const EARTH_RADIUS_METERS = 6_371_000;
const OFF_ROUTE_THRESHOLD_MILES = 0.05; // ~80 meters
const TURN_THRESHOLD_DEGREES = 30;

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

function toMeters(point: NavPoint): { x: number; y: number } {
  const latRad = toRad(point.latitude);
  const lonRad = toRad(point.longitude);
  return {
    x: EARTH_RADIUS_METERS * lonRad * Math.cos(latRad),
    y: EARTH_RADIUS_METERS * latRad,
  };
}

function toLatLon(x: number, y: number): NavPoint {
  const lat = toDegrees(y / EARTH_RADIUS_METERS);
  const lon = toDegrees(x / (EARTH_RADIUS_METERS * Math.cos(toRad(lat))));
  return { latitude: lat, longitude: lon };
}

function segmentDistance(a: NavPoint, b: NavPoint): number {
  return calculateDistance(a, b);
}

export function snapToRoute(
  position: NavPoint,
  route: NavPoint[],
): SnapResult | null {
  if (!route || route.length < 2) return null;

  let bestDistance = Infinity;
  let bestSegmentIndex = 0;
  let bestT = 0;
  let bestSnapped: NavPoint = route[0];

  const posM = toMeters(position);

  for (let i = 0; i < route.length - 1; i++) {
    const startM = toMeters(route[i]);
    const endM = toMeters(route[i + 1]);

    const abx = endM.x - startM.x;
    const aby = endM.y - startM.y;
    const apx = posM.x - startM.x;
    const apy = posM.y - startM.y;

    const abLenSq = abx * abx + aby * aby;
    let t = abLenSq === 0 ? 0 : (apx * abx + apy * aby) / abLenSq;
    t = Math.max(0, Math.min(1, t));

    const projX = startM.x + t * abx;
    const projY = startM.y + t * aby;
    const snapped = toLatLon(projX, projY);

    const distance = calculateDistance(position, snapped);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestSegmentIndex = i;
      bestT = t;
      bestSnapped = snapped;
    }
  }

  let totalDistance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    totalDistance += segmentDistance(route[i], route[i + 1]);
  }

  let traveled = 0;
  for (let i = 0; i < bestSegmentIndex; i++) {
    traveled += segmentDistance(route[i], route[i + 1]);
  }
  traveled +=
    bestT *
    segmentDistance(route[bestSegmentIndex], route[bestSegmentIndex + 1]);

  return {
    snappedPoint: bestSnapped,
    segmentIndex: bestSegmentIndex,
    segmentProgress: bestT,
    distanceToRouteMiles: bestDistance,
    distanceTraveledMiles: traveled,
    distanceRemainingMiles: Math.max(0, totalDistance - traveled),
    totalRouteDistanceMiles: totalDistance,
  };
}

export function isOffRoute(snapResult: SnapResult): boolean {
  return snapResult.distanceToRouteMiles > OFF_ROUTE_THRESHOLD_MILES;
}

function bearing(a: NavPoint, b: NavPoint): number {
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

export function getNextTurn(
  route: NavPoint[],
  segmentIndex: number,
  segmentProgress: number,
): TurnInfo | null {
  if (!route || route.length < 3) return null;

  let distanceToTurn =
    (1 - segmentProgress) *
    segmentDistance(route[segmentIndex], route[segmentIndex + 1]);

  for (let i = segmentIndex + 1; i < route.length - 1; i++) {
    distanceToTurn += segmentDistance(route[i], route[i + 1]);

    if (i < route.length - 2) {
      const b1 = bearing(route[i], route[i + 1]);
      const b2 = bearing(route[i + 1], route[i + 2]);
      let delta = ((b2 - b1 + 540) % 360) - 180;

      if (Math.abs(delta) > TURN_THRESHOLD_DEGREES) {
        return {
          distance: distanceToTurn,
          direction: delta > 0 ? "left" : "right",
          bearingChange: Math.abs(delta),
        };
      }
    }
  }

  return null;
}
