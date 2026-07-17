export interface TrailLocation {
  latitude: number;
  longitude: number;
}

export interface Trail {
  id: string;
  name: string;
  location: TrailLocation;
  difficulty: "Easy" | "Moderate" | "Hard" | "Expert";
  distance: number;
  duration: number;
  landType: "public" | "private" | "mixed";
  description: string;
  elevation: number;
  features: string[];
  vehicleTypes: string[];
  safetyRating: number;
  popularity: number;
}

export interface Route {
  id: string;
  name: string;
  trails: Trail[];
  startLocation: TrailLocation;
  endLocation: TrailLocation;
  totalDistance: number;
  totalDuration: number;
  difficulty: "Easy" | "Moderate" | "Hard" | "Expert";
  description: string;
}

export const SAMPLE_TRAILS: Trail[] = [
  {
    id: "trail_1",
    name: "Moab Rim Trail",
    location: { latitude: 38.5729, longitude: -109.5898 },
    difficulty: "Hard",
    distance: 15.5,
    duration: 180,
    landType: "public",
    description: "Technical trail with stunning canyon views. Rocky terrain and steep grades.",
    elevation: 1200,
    features: ["Scenic Views", "Technical Rocks", "Steep Climbs", "Water Crossings"],
    vehicleTypes: ["Jeep", "4Runner", "Bronco"],
    safetyRating: 7.5,
    popularity: 8.2,
  },
  {
    id: "trail_2",
    name: "Hell's Revenge",
    location: { latitude: 38.5656, longitude: -109.5932 },
    difficulty: "Expert",
    distance: 12.0,
    duration: 150,
    landType: "public",
    description: "Extreme rock crawling with sharp rock edges and deep ruts.",
    elevation: 800,
    features: ["Rock Crawling", "Extreme Terrain", "Scenic Views"],
    vehicleTypes: ["Jeep", "Rock Crawler"],
    safetyRating: 6.0,
    popularity: 7.9,
  },
  {
    id: "trail_3",
    name: "Sand Hollow State Park Loop",
    location: { latitude: 37.3221, longitude: -113.7891 },
    difficulty: "Moderate",
    distance: 8.5,
    duration: 90,
    landType: "public",
    description: "Beautiful sand dunes with moderate difficulty. Good for beginners.",
    elevation: 300,
    features: ["Sand Dunes", "Scenic Views", "Family Friendly"],
    vehicleTypes: ["Any 4WD", "SUV"],
    safetyRating: 8.5,
    popularity: 9.1,
  },
  {
    id: "trail_4",
    name: "Pritchett Canyon",
    location: { latitude: 38.4832, longitude: -109.7241 },
    difficulty: "Hard",
    distance: 10.0,
    duration: 120,
    landType: "mixed",
    description: "Narrow canyon with technical rock formations. Requires skilled driving.",
    elevation: 600,
    features: ["Canyon Scenery", "Technical Rocks", "Narrow Passages"],
    vehicleTypes: ["Jeep", "High Clearance"],
    safetyRating: 7.0,
    popularity: 7.3,
  },
  {
    id: "trail_5",
    name: "Elephant Hill",
    location: { latitude: 38.2129, longitude: -109.8934 },
    difficulty: "Hard",
    distance: 5.0,
    duration: 60,
    landType: "public",
    description: "Steep rocky hill with hairpin turns. Popular and well-maintained.",
    elevation: 400,
    features: ["Hill Climb", "Rocky Terrain", "Scenic Overlook"],
    vehicleTypes: ["Jeep", "4Runner", "Trucks"],
    safetyRating: 7.8,
    popularity: 8.7,
  },
  {
    id: "trail_6",
    name: "Needles Eye",
    location: { latitude: 38.5123, longitude: -109.8765 },
    difficulty: "Expert",
    distance: 3.0,
    duration: 45,
    landType: "private",
    description: "Extremely tight slot canyon. Owner permission required. Advanced only.",
    elevation: 200,
    features: ["Slot Canyon", "Extreme Tight Spaces", "Scrambling"],
    vehicleTypes: ["Small Jeep", "Modified Vehicle"],
    safetyRating: 5.5,
    popularity: 6.2,
  },
];

export const SAMPLE_ROUTES: Route[] = [
  {
    id: "route_1",
    name: "Moab Adventure Loop",
    trails: [SAMPLE_TRAILS[0], SAMPLE_TRAILS[1], SAMPLE_TRAILS[4]],
    startLocation: { latitude: 38.5729, longitude: -109.5898 },
    endLocation: { latitude: 38.2129, longitude: -109.8934 },
    totalDistance: 32.5,
    totalDuration: 390,
    difficulty: "Hard",
    description: "Full day adventure combining multiple iconic Moab trails.",
  },
  {
    id: "route_2",
    name: "Beginner Friendly Scenic Route",
    trails: [SAMPLE_TRAILS[2]],
    startLocation: { latitude: 37.3221, longitude: -113.7891 },
    endLocation: { latitude: 37.3221, longitude: -113.7891 },
    totalDistance: 8.5,
    totalDuration: 90,
    difficulty: "Moderate",
    description: "Perfect for families and beginners. Beautiful dunes and low difficulty.",
  },
];

export function getTrailsNearLocation(
  location: { latitude: number; longitude: number },
  radiusMiles: number
): Trail[] {
  return SAMPLE_TRAILS.filter((trail) => {
    const lat1 = location.latitude;
    const lon1 = location.longitude;
    const lat2 = trail.location.latitude;
    const lon2 = trail.location.longitude;

    const R = 3959;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radiusMiles;
  });
}

export function filterTrailsByDifficulty(
  trails: Trail[],
  difficulty: "Easy" | "Moderate" | "Hard" | "Expert"
): Trail[] {
  return trails.filter((trail) => trail.difficulty === difficulty);
}

export function filterTrailsByLandType(
  trails: Trail[],
  landType: "public" | "private" | "mixed"
): Trail[] {
  return trails.filter((trail) => {
    if (landType === "private") return trail.landType === "private";
    if (landType === "public") return trail.landType === "public" || trail.landType === "mixed";
    return true;
  });
}

export function sortTrailsByRating(trails: Trail[]): Trail[] {
  return [...trails].sort((a, b) => b.safetyRating - a.safetyRating);
}

export function sortTrailsByPopularity(trails: Trail[]): Trail[] {
  return [...trails].sort((a, b) => b.popularity - a.popularity);
}
