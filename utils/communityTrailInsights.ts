import type { AdventureHazard, CompletedAdventure } from "@/utils/storage";

export const MAX_COMMUNITY_SPEED_MPH = 55;
export const MIN_VALID_SPEED_SAMPLES = 2;

export type TrailPaceInsight =
  | {
      status: "ready";
      observedPeerPaceMph: number;
      qualifyingAdventureCount: number;
      distinctUserCount: number;
    }
  | {
      status: "insufficient-data";
      qualifyingAdventureCount: number;
      distinctUserCount: number;
    };

export type TrailHazardInsight =
  | {
      status: "available";
      reportedHazardCount: number;
      hazards: AdventureHazard[];
    }
  | {
      status: "none";
      reportedHazardCount: 0;
      hazards: [];
    };

export interface TrailCommunityInsights {
  trailId: string;
  pace: TrailPaceInsight;
  hazards: TrailHazardInsight;
}

interface QualifyingAdventure {
  adventure: CompletedAdventure;
  speeds: number[];
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function getPaceInsight(
  qualifyingAdventures: QualifyingAdventure[],
): TrailPaceInsight {
  const distinctUserIds = new Set(
    qualifyingAdventures
      .map(({ adventure }) => adventure.userId)
      .filter((userId) => userId.trim().length > 0),
  );
  const pooledSpeeds = qualifyingAdventures.flatMap(({ speeds }) => speeds);

  if (pooledSpeeds.length === 0) {
    return {
      status: "insufficient-data",
      qualifyingAdventureCount: qualifyingAdventures.length,
      distinctUserCount: distinctUserIds.size,
    };
  }

  return {
    status: "ready",
    observedPeerPaceMph: median(pooledSpeeds),
    qualifyingAdventureCount: qualifyingAdventures.length,
    distinctUserCount: distinctUserIds.size,
  };
}

function getHazardInsight(
  adventures: CompletedAdventure[],
): TrailHazardInsight {
  const hazards = adventures.flatMap((adventure) => adventure.hazards);

  if (hazards.length === 0) {
    return {
      status: "none",
      reportedHazardCount: 0,
      hazards: [],
    };
  }

  return {
    status: "available",
    reportedHazardCount: hazards.length,
    hazards,
  };
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
        speeds,
      };
    })
    .filter(
      (item): item is QualifyingAdventure =>
        item.speeds.length >= MIN_VALID_SPEED_SAMPLES,
    );

  return {
    trailId,
    pace: getPaceInsight(qualifyingAdventures),
    hazards: getHazardInsight(trailAdventures),
  };
}
