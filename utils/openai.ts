export interface AnalysisStep {
  title: string;
  description: string;
  timeEstimate?: string;
}

export interface Analysis {
  situationType: string;
  difficulty: "Easy" | "Moderate" | "Hard";
  steps: AnalysisStep[];
  warning: string;
  equipment?: string[];
  tips?: string[];
  confidence?: number;
  recoverability?: number;
  relatedGuides?: string[];
}

const recoveryScenarios: Analysis[] = [
  {
    situationType: "Vehicle Stuck in Mud",
    difficulty: "Moderate",
    confidence: 0.88,
    recoverability: 0.85,
    equipment: ["Traction boards", "Shovel", "Air compressor", "Recovery straps", "Gloves"],
    tips: [
      "Decreasing tire pressure to 15-20 PSI improves traction",
      "Keep weight distributed evenly",
      "Use a winch if forward motion is impossible after 2 attempts",
      "Always inflate tires back to normal pressure once free"
    ],
    relatedGuides: ["mud-1", "winching-1"],
    steps: [
      {
        title: "Stop and Assess",
        description: "Do not continue accelerating. Turn off the engine and exit the vehicle to assess the depth and consistency of the mud.",
        timeEstimate: "5 min"
      },
      {
        title: "Clear Mud from Wheels",
        description: "Use a shovel or stick to remove excess mud from around all four wheels, creating a clear path forward.",
        timeEstimate: "15 min"
      },
      {
        title: "Deploy Traction Aids",
        description: "Place traction boards, branches, or other rigid materials directly in front of the drive wheels.",
        timeEstimate: "5 min"
      },
      {
        title: "Lower Tire Pressure",
        description: "Reduce tire pressure to 15-20 PSI to increase the tire's footprint and improve traction. Remember to reinflate later.",
        timeEstimate: "10 min"
      },
      {
        title: "Attempt Recovery",
        description: "Get back in the vehicle, engage low range (if available), and apply gentle, steady throttle while maintaining straight steering.",
        timeEstimate: "10 min"
      }
    ],
    warning: "If the vehicle continues to sink or spin, stop immediately and consider winching or requesting assistance to prevent deeper entrenchment."
  },
  {
    situationType: "Vehicle Stuck in Sand",
    difficulty: "Easy",
    confidence: 0.92,
    recoverability: 0.92,
    equipment: ["Air compressor", "Tire deflator", "Traction boards", "Recovery straps", "Shovel"],
    tips: [
      "Don't brake hard on sand - maintain steady throttle",
      "Travel early morning when sand is more compact",
      "Mark your recovery path to avoid re-digging same spots",
      "Beach sand is softer than inland dunes"
    ],
    relatedGuides: ["sand-1", "tire-1"],
    steps: [
      {
        title: "Reduce Tire Pressure",
        description: "Lower tire pressure to 12-15 PSI to increase the tire contact patch and improve flotation on sand.",
        timeEstimate: "10 min"
      },
      {
        title: "Clear Sand from Wheels",
        description: "Dig out sand from in front of and around the tires, creating a gradual ramp for the vehicle to climb out.",
        timeEstimate: "10 min"
      },
      {
        title: "Use Traction Mats",
        description: "Place traction boards, floor mats, or any flat rigid material under the drive wheels for grip.",
        timeEstimate: "5 min"
      },
      {
        title: "Momentum Recovery",
        description: "Build momentum by rocking the vehicle gently back and forth. Use low gear and steady throttle to drive out.",
        timeEstimate: "15 min"
      }
    ],
    warning: "Avoid spinning the tires excessively, as this will dig you deeper. If stuck in soft sand near water, be aware of tide changes."
  },
  {
    situationType: "Vehicle Stuck on Rocks",
    difficulty: "Hard",
    confidence: 0.85,
    recoverability: 0.65,
    equipment: ["Winch", "High-lift jack", "Recovery straps", "Snatch block", "D-rings", "Spotter"],
    tips: [
      "Rock crawling requires patience - rushing causes damage",
      "Use rock sliders and undercarriage protection when possible",
      "Always have a spotter outside the vehicle",
      "This is high-difficulty recovery - consider professional assistance"
    ],
    relatedGuides: ["rocks-1", "winching-1"],
    steps: [
      {
        title: "Assess High-Center Point",
        description: "Identify which part of the vehicle is caught on rocks. Check for damage to fuel tank, differential, or transfer case.",
        timeEstimate: "10 min"
      },
      {
        title: "Jack and Stack",
        description: "Use a high-lift jack to raise the vehicle. Stack rocks or wood under the tires to create a platform for the vehicle to drive off.",
        timeEstimate: "20 min"
      },
      {
        title: "Clear Obstacles",
        description: "Remove or rearrange rocks that are preventing wheel movement. Create a clear path forward or backward.",
        timeEstimate: "15 min"
      },
      {
        title: "Use Winch if Available",
        description: "Attach winch to a secure anchor point ahead. Apply steady tension while gently throttling to pull vehicle off the rocks.",
        timeEstimate: "20 min"
      },
      {
        title: "Spotter Assistance",
        description: "Have someone outside guide you through the recovery, watching for clearance and directing your path.",
        timeEstimate: "Ongoing"
      }
    ],
    warning: "High-centering can cause serious undercarriage damage. Proceed slowly and carefully. If jacking, ensure stable ground and use proper jacking points."
  },
  {
    situationType: "Vehicle in Deep Water/Creek",
    difficulty: "Hard",
    confidence: 0.80,
    recoverability: 0.55,
    equipment: ["Winch", "Recovery straps", "Life jackets", "Waterproof gear", "Air compressor"],
    tips: [
      "NEVER attempt to ford flood water - it's always deeper and faster than it looks",
      "Water entry into engine causes hydrolock - avoid at all costs",
      "After water crossing, dry brakes by gentle application while moving",
      "This is extremely dangerous - prioritize personal safety over vehicle"
    ],
    relatedGuides: ["ford-1", "emergency-1"],
    steps: [
      {
        title: "Stop Engine Immediately",
        description: "If water has entered the engine bay, do NOT attempt to start or run the engine. This can cause catastrophic engine damage.",
        timeEstimate: "2 min"
      },
      {
        title: "Assess Water Depth",
        description: "Determine if water level is above door seals or engine air intake. Exit safely if water is rising.",
        timeEstimate: "5 min"
      },
      {
        title: "Winch Out",
        description: "Use a winch with a secure anchor point to pull the vehicle out of the water. Do not drive through deep water.",
        timeEstimate: "15 min"
      },
      {
        title: "Check for Water Ingestion",
        description: "Once out, check engine oil and transmission fluid for water contamination (milky appearance). Do not start if contaminated.",
        timeEstimate: "10 min"
      },
      {
        title: "Dry Electrical Components",
        description: "Let electrical components dry completely before attempting to start. Check air filter for water.",
        timeEstimate: "30+ min"
      }
    ],
    warning: "Water in engine cylinders (hydrolock) can cause severe damage. If water entered the intake, have a professional inspect before starting. Fast-moving water is extremely dangerous - prioritize personal safety."
  },
  {
    situationType: "Mechanical Breakdown - Engine Issues",
    difficulty: "Moderate",
    confidence: 0.82,
    recoverability: 0.60,
    equipment: ["Basic tools", "Jumper cables", "Coolant", "Oil", "Flashlight", "Multimeter"],
    tips: [
      "Always carry spare fluids (oil, coolant, transmission)",
      "Don't drive on severely damaged tire - risk of crash",
      "If engine overheats, pull over immediately and let cool",
      "Strange noises often indicate serious problems - stop and diagnose"
    ],
    relatedGuides: ["mechanical-1", "tire-1"],
    steps: [
      {
        title: "Safe Stop",
        description: "Pull to a safe location away from traffic. Turn on hazard lights and set up warning triangles if available.",
        timeEstimate: "5 min"
      },
      {
        title: "Initial Diagnosis",
        description: "Note symptoms: strange noises, smoke, loss of power, warning lights. Check fluid levels (oil, coolant, transmission).",
        timeEstimate: "10 min"
      },
      {
        title: "Check Simple Fixes",
        description: "Verify battery connections are tight, check for loose hoses or belts, ensure fuel cap is secure.",
        timeEstimate: "5 min"
      },
      {
        title: "Document Issue",
        description: "Take photos and videos of the problem. This helps when requesting assistance or explaining to a mechanic.",
        timeEstimate: "5 min"
      },
      {
        title: "Request Professional Help",
        description: "Use the SOS button to request assistance. Provide your location and description of the mechanical issue.",
        timeEstimate: "Varies"
      }
    ],
    warning: "Do not attempt to drive with serious engine problems. Overheating, loss of oil pressure, or unusual noises can cause catastrophic damage if ignored."
  },
  {
    situationType: "Flat Tire on Trail",
    difficulty: "Easy",
    confidence: 0.95,
    recoverability: 0.98,
    equipment: ["Jack", "Lug wrench", "Spare tire", "Wheel blocks", "Tire repair kit", "Air compressor"],
    tips: [
      "Always check spare tire pressure before the trip",
      "Use star pattern when tightening lug nuts for even pressure",
      "Keep tire repair kit and patches as backup",
      "Professional repair shops can fix many punctures rather than replacing"
    ],
    relatedGuides: ["tire-1", "tire-2"],
    steps: [
      {
        title: "Find Level Ground",
        description: "Move to the flattest, most stable surface available. Engage parking brake and place rocks behind wheels.",
        timeEstimate: "5 min"
      },
      {
        title: "Prepare Equipment",
        description: "Get out your jack, lug wrench, and spare tire. Ensure jack is rated for your vehicle's weight.",
        timeEstimate: "2 min"
      },
      {
        title: "Loosen Lug Nuts",
        description: "Before jacking, loosen (but don't remove) all lug nuts while the tire is still on the ground.",
        timeEstimate: "5 min"
      },
      {
        title: "Jack and Replace",
        description: "Jack up the vehicle until the tire is off the ground. Remove lug nuts, replace tire, hand-tighten lug nuts in a star pattern.",
        timeEstimate: "15 min"
      },
      {
        title: "Lower and Torque",
        description: "Lower the vehicle completely, then tighten lug nuts in a star pattern with full force. Check spare tire pressure.",
        timeEstimate: "5 min"
      }
    ],
    warning: "Never get under a vehicle supported only by a jack. If on a slope, use wheel chocks and consider adding rocks under the jack base for stability."
  }
];

export async function analyzeVehicleSituation(imageUri: string): Promise<Analysis> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  const randomIndex = Math.floor(Math.random() * recoveryScenarios.length);
  return recoveryScenarios[randomIndex];
}

export function getScenarioByType(type: string): Analysis {
  const scenario = recoveryScenarios.find(
    (s) => s.situationType.toLowerCase().includes(type.toLowerCase())
  );
  return scenario || recoveryScenarios[0];
}
