import type { AdventureHazard, CompletedAdventure } from "@/utils/storage";

export const MAX_COMMUNITY_SPEED_MPH = 55;
export const MIN_VALID_SPEED_SAMPLES = 3;
export const MIN_QUALIFYING_ADVENTURES = 5;
export const MIN_DISTINCT_USERS = 3;

export interface TrailCommunityInsights {
  trailId: string;
  status: "ready" | "insufficient-data";
  observedPeerPaceMph: number | null;
  qualifyingAdventureCount: number;
  distinctUserCount: number;
  reportedHazardCount: number;
  hazards: AdventureHazard[];
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function aggregateTrailCommunityData(
  adventures: CompletedAdventure[],
  trailId: string,
): TrailCommunityInsights {
  const trailAdventures = adventures.filter(
    (adventure) => adventure.trailId === trailId,
  );
  const qualifyingAdventures = trailAdventures
    .map((adventure) => {
      const speeds = adventure.route
        .map((point) => point.speed)
        .filter(
          (speed): speed is number =>
            typeof speed === "number" &&
            Number.isFinite(speed) &&
            speed > 0 &&
            speed <= MAX_COMMUNITY_SPEED_MPH,
        );

      return {
        adventure,
        medianSpeed:
          speeds.length >= MIN_VALID_SPEED_SAMPLES ? median(speeds) : null,
      };
    })
    .filter(
      (
        item,
      ): item is {
        adventure: CompletedAdventure;
        medianSpeed: number;
      } => item.medianSpeed !== null,
    );

  const distinctUserIds = new Set(
    qualifyingAdventures
      .map(({ adventure }) => adventure.userId)
      .filter((userId) => userId.trim().length > 0),
  );
  const hazards = qualifyingAdventures.flatMap(
    ({ adventure }) => adventure.hazards,
  );
  const hasSufficientData =
    qualifyingAdventures.length >= MIN_QUALIFYING_ADVENTURES &&
    distinctUserIds.size >= MIN_DISTINCT_USERS;

  return {
    trailId,
    status: hasSufficientData ? "ready" : "insufficient-data",
    observedPeerPaceMph: hasSufficientData
      ? median(qualifyingAdventures.map(({ medianSpeed }) => medianSpeed))
      : null,
    qualifyingAdventureCount: qualifyingAdventures.length,
    distinctUserCount: distinctUserIds.size,
    reportedHazardCount: hazards.length,
    hazards,
  };
}
