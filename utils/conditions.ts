import { CommunityTip } from "./storage";
import { calculateDistance } from "./location";

export interface WeatherCondition {
  condition: string;
  temperature: number;
  windSpeed: number;
  description: string;
}

export interface TrailConditionSummary {
  recentTips: CommunityTip[];
  severity: "low" | "moderate" | "high" | "severe";
  primaryConcerns: string[];
  affectedAreas: number;
}

export interface ImpactAssessment {
  overallSeverity: "low" | "moderate" | "high" | "critical";
  riskFactors: string[];
  recommendations: string[];
  color: string;
}

export function filterNearbyTips(
  tips: CommunityTip[],
  userLocation: { latitude: number; longitude: number },
  radiusMiles: number
): CommunityTip[] {
  const tipsWithLocation = tips.filter((tip) => tip.location !== undefined);

  const tipsWithDistance = tipsWithLocation.map((tip) => ({
    tip,
    distance: calculateDistance(userLocation, tip.location!),
  }));

  const nearbyTips = tipsWithDistance.filter(
    (item) => item.distance <= radiusMiles
  );

  nearbyTips.sort((a, b) => a.distance - b.distance);

  return nearbyTips.map((item) => item.tip);
}

export function analyzeTrailConditions(
  tips: CommunityTip[],
  userLocation: { latitude: number; longitude: number },
  radiusMiles: number
): TrailConditionSummary {
  const nearbyTips = filterNearbyTips(tips, userLocation, radiusMiles);

  const trailConditionTips = nearbyTips.filter(
    (tip) => tip.category === "trail_condition"
  );

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentTips = trailConditionTips.filter(
    (tip) => tip.timestamp > sevenDaysAgo
  );

  let severity: "low" | "moderate" | "high" | "severe";
  const tipCount = recentTips.length;

  if (tipCount === 0) {
    severity = "low";
  } else if (tipCount <= 2) {
    severity = "moderate";
  } else if (tipCount <= 4) {
    severity = "high";
  } else {
    severity = "severe";
  }

  const concernKeywords = [
    "mud",
    "snow",
    "washout",
    "flooded",
    "stuck",
    "ice",
    "slippery",
    "blocked",
    "impassable",
    "damage",
    "hazard",
    "dangerous",
  ];

  const primaryConcerns: string[] = [];
  recentTips.forEach((tip) => {
    const text = `${tip.title} ${tip.description}`.toLowerCase();
    concernKeywords.forEach((keyword) => {
      if (text.includes(keyword) && !primaryConcerns.includes(keyword)) {
        primaryConcerns.push(keyword);
      }
    });
  });

  const uniqueLocations = new Set<string>();
  recentTips.forEach((tip) => {
    if (tip.location) {
      const locationKey = `${tip.location.latitude.toFixed(3)},${tip.location.longitude.toFixed(3)}`;
      uniqueLocations.add(locationKey);
    }
  });

  const affectedAreas = uniqueLocations.size;

  return {
    recentTips,
    severity,
    primaryConcerns,
    affectedAreas,
  };
}

export function calculateImpactAssessment(
  weather: WeatherCondition | null,
  trailConditions: TrailConditionSummary
): ImpactAssessment {
  const riskFactors: string[] = [];

  if (weather) {
    const condition = weather.condition.toLowerCase();
    const description = weather.description.toLowerCase();

    if (condition.includes("rain") || description.includes("rain")) {
      riskFactors.push("Rain increases mud and slippery conditions");
    }
    if (condition.includes("snow") || description.includes("snow")) {
      riskFactors.push("Snow creates ice and visibility hazards");
    }
    if (condition.includes("storm") || description.includes("storm")) {
      riskFactors.push("Severe weather conditions present");
    }
    if (weather.windSpeed > 25) {
      riskFactors.push("High winds may affect vehicle stability");
    }
    if (weather.temperature < 32) {
      riskFactors.push("Freezing temperatures create ice hazards");
    }
  }

  trailConditions.primaryConcerns.forEach((concern) => {
    riskFactors.push(`Trail reports indicate ${concern} conditions`);
  });

  if (trailConditions.affectedAreas > 0) {
    riskFactors.push(
      `${trailConditions.affectedAreas} area${trailConditions.affectedAreas > 1 ? "s" : ""} with reported issues`
    );
  }

  let weatherSeverity: "low" | "moderate" | "high" | "critical" = "low";
  if (weather) {
    const condition = weather.condition.toLowerCase();
    const description = weather.description.toLowerCase();

    if (
      condition.includes("severe") ||
      condition.includes("storm") ||
      description.includes("severe")
    ) {
      weatherSeverity = "critical";
    } else if (
      condition.includes("rain") ||
      condition.includes("snow") ||
      weather.windSpeed > 25
    ) {
      weatherSeverity = "high";
    } else if (weather.temperature < 32 || weather.windSpeed > 15) {
      weatherSeverity = "moderate";
    }
  }

  const trailSeverityMap = {
    low: 0,
    moderate: 1,
    high: 2,
    severe: 3,
  };

  const weatherSeverityMap = {
    low: 0,
    moderate: 1,
    high: 2,
    critical: 3,
  };

  const trailSeverityValue = trailSeverityMap[trailConditions.severity];
  const weatherSeverityValue = weatherSeverityMap[weatherSeverity];

  let overallSeverity: "low" | "moderate" | "high" | "critical";
  const maxSeverity = Math.max(trailSeverityValue, weatherSeverityValue);

  if (maxSeverity === 0) {
    overallSeverity = "low";
  } else if (maxSeverity === 1) {
    overallSeverity = "moderate";
  } else if (maxSeverity === 2) {
    overallSeverity = "high";
  } else {
    overallSeverity = "critical";
  }

  let recommendations: string[];
  switch (overallSeverity) {
    case "low":
      recommendations = ["Stay alert", "Basic recovery gear recommended"];
      break;
    case "moderate":
      recommendations = ["Carry recovery gear", "Check tire pressure"];
      break;
    case "high":
      recommendations = [
        "Travel in groups",
        "Advanced recovery equipment required",
      ];
      break;
    case "critical":
      recommendations = [
        "Consider delaying trip",
        "Expert recovery skills needed",
      ];
      break;
  }

  let color: string;
  switch (overallSeverity) {
    case "low":
      color = "#2E7D32";
      break;
    case "moderate":
      color = "#FBC02D";
      break;
    case "high":
      color = "#FF6B35";
      break;
    case "critical":
      color = "#D32F2F";
      break;
  }

  return {
    overallSeverity,
    riskFactors,
    recommendations,
    color,
  };
}
