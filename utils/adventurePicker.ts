import { Trail } from './trails';

export interface RandomAdventureOptions {
  maxDistance?: number;
  difficulty?: 'Easy' | 'Moderate' | 'Hard' | 'Expert';
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface RandomAdventureResult {
  trail: Trail;
  reason: string;
  emoji: string;
}

/**
 * Randomly selects an adventure from available trails
 */
export function pickRandomAdventure(
  trails: Trail[],
  options: RandomAdventureOptions = {}
): RandomAdventureResult | null {
  if (trails.length === 0) {
    return null;
  }

  let filteredTrails = [...trails];

  // Apply difficulty filter if specified
  if (options.difficulty) {
    filteredTrails = filteredTrails.filter(t => t.difficulty === options.difficulty);
  }

  // If no trails match filters, use all trails
  if (filteredTrails.length === 0) {
    filteredTrails = trails;
  }

  // Randomly select a trail
  const randomIndex = Math.floor(Math.random() * filteredTrails.length);
  const selectedTrail = filteredTrails[randomIndex];

  // Generate a fun reason for the selection
  const reasons = [
    { text: "The stars have aligned for this adventure!", emoji: "✨" },
    { text: "Your next great story starts here!", emoji: "📖" },
    { text: "Adventure calls, and you must go!", emoji: "🏔️" },
    { text: "This trail chose you!", emoji: "🎯" },
    { text: "Perfect for today's vibe!", emoji: "🌟" },
    { text: "Your destiny awaits on this path!", emoji: "🧭" },
    { text: "Time to make some memories!", emoji: "📸" },
    { text: "This one's calling your name!", emoji: "📣" },
    { text: "The universe says: Go here!", emoji: "🌌" },
    { text: "Your next epic adventure!", emoji: "⚡" },
    { text: "Trust the journey!", emoji: "🗺️" },
    { text: "This trail has your name on it!", emoji: "🎪" },
  ];

  const randomReason = reasons[Math.floor(Math.random() * reasons.length)];

  return {
    trail: selectedTrail,
    reason: randomReason.text,
    emoji: randomReason.emoji,
  };
}

/**
 * Get a random adventure with weighted selection based on factors
 */
export function pickSmartRandomAdventure(
  trails: Trail[],
  options: RandomAdventureOptions = {}
): RandomAdventureResult | null {
  if (trails.length === 0) {
    return null;
  }

  let filteredTrails = [...trails];

  // Apply difficulty filter if specified
  if (options.difficulty) {
    filteredTrails = filteredTrails.filter(t => t.difficulty === options.difficulty);
  }

  // If no trails match filters, use all trails
  if (filteredTrails.length === 0) {
    filteredTrails = trails;
  }

  // Weight trails based on various factors
  const weightedTrails = filteredTrails.map(trail => {
    let weight = 1;

    // Higher rated trails get more weight
    weight += (trail.safetyRating / 10) * 2;

    // Popular trails get slight boost
    if (trail.popularity) {
      weight += (trail.popularity / 10);
    }

    // Moderate difficulty gets slight preference (good for most users)
    if (trail.difficulty === 'Moderate') {
      weight += 0.5;
    }

    return { trail, weight };
  });

  // Calculate total weight
  const totalWeight = weightedTrails.reduce((sum, item) => sum + item.weight, 0);

  // Random selection based on weights
  let random = Math.random() * totalWeight;
  let selectedTrail: Trail | null = null;

  for (const item of weightedTrails) {
    random -= item.weight;
    if (random <= 0) {
      selectedTrail = item.trail;
      break;
    }
  }

  // Fallback to first trail if something went wrong
  if (!selectedTrail) {
    selectedTrail = weightedTrails[0].trail;
  }

  // Generate a fun reason
  const reasons = [
    { text: "The algorithm of adventure chose this!", emoji: "🤖" },
    { text: "Based on cosmic calculations...", emoji: "🌠" },
    { text: "The perfect match for you!", emoji: "💫" },
    { text: "Highly recommended by fate!", emoji: "🎲" },
    { text: "This one's got great vibes!", emoji: "✨" },
    { text: "Trust us, this will be epic!", emoji: "🏆" },
    { text: "The adventure gods have spoken!", emoji: "⚡" },
    { text: "Your perfect trail awaits!", emoji: "🎯" },
  ];

  const randomReason = reasons[Math.floor(Math.random() * reasons.length)];

  return {
    trail: selectedTrail,
    reason: randomReason.text,
    emoji: randomReason.emoji,
  };
}

/**
 * Get multiple random adventure suggestions
 */
export function pickMultipleRandomAdventures(
  trails: Trail[],
  count: number = 3,
  options: RandomAdventureOptions = {}
): RandomAdventureResult[] {
  if (trails.length === 0) {
    return [];
  }

  const results: RandomAdventureResult[] = [];
  const usedIndices = new Set<number>();

  let filteredTrails = [...trails];

  // Apply difficulty filter if specified
  if (options.difficulty) {
    filteredTrails = filteredTrails.filter(t => t.difficulty === options.difficulty);
  }

  // If no trails match filters, use all trails
  if (filteredTrails.length === 0) {
    filteredTrails = trails;
  }

  const actualCount = Math.min(count, filteredTrails.length);

  while (results.length < actualCount) {
    const randomIndex = Math.floor(Math.random() * filteredTrails.length);
    
    if (!usedIndices.has(randomIndex)) {
      usedIndices.add(randomIndex);
      const trail = filteredTrails[randomIndex];
      
      const reasons = [
        { text: "A hidden gem!", emoji: "💎" },
        { text: "Worth exploring!", emoji: "🔍" },
        { text: "Adventure awaits!", emoji: "🎒" },
        { text: "Highly recommended!", emoji: "⭐" },
        { text: "Don't miss this one!", emoji: "🎯" },
      ];

      const randomReason = reasons[Math.floor(Math.random() * reasons.length)];

      results.push({
        trail,
        reason: randomReason.text,
        emoji: randomReason.emoji,
      });
    }
  }

  return results;
}
