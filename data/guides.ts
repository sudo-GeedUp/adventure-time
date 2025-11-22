export interface Guide {
  id: string;
  title: string;
  category: string;
  difficulty: "Easy" | "Moderate" | "Advanced";
  equipment: string[];
  steps: GuideStep[];
  safetyWarnings: string[];
}

export interface GuideStep {
  number: number;
  title: string;
  description: string;
}

export interface GuideCategory {
  id: string;
  title: string;
  icon: string;
  guideCount: number;
}

export const categories: GuideCategory[] = [
  { id: "mud", title: "Stuck in Mud", icon: "droplet", guideCount: 4 },
  { id: "sand", title: "Sand Recovery", icon: "sun", guideCount: 3 },
  { id: "rocks", title: "Rock Crawling", icon: "triangle", guideCount: 3 },
  { id: "mechanical", title: "Mechanical Issues", icon: "tool", guideCount: 5 },
  { id: "winching", title: "Winching", icon: "anchor", guideCount: 3 },
  { id: "tire", title: "Tire Repairs", icon: "disc", guideCount: 4 },
];

export const guides: Guide[] = [
  {
    id: "mud-1",
    title: "Basic Mud Recovery",
    category: "mud",
    difficulty: "Easy",
    equipment: ["Traction boards", "Shovel", "Gloves"],
    safetyWarnings: [
      "Never stand directly in front of or behind the vehicle when attempting recovery",
      "Ensure parking brake is off and vehicle is in appropriate gear",
    ],
    steps: [
      {
        number: 1,
        title: "Assess the situation",
        description: "Stop immediately when you feel the vehicle losing traction. Continuing to accelerate will only dig you deeper.",
      },
      {
        number: 2,
        title: "Clear mud from wheels",
        description: "Use a shovel to remove mud from around all four wheels, creating a path forward and backward.",
      },
      {
        number: 3,
        title: "Place traction aids",
        description: "Position traction boards or mats directly in front of the drive wheels in the direction you want to travel.",
      },
      {
        number: 4,
        title: "Attempt recovery",
        description: "Gently apply throttle while maintaining a straight wheel angle. Use low range if available.",
      },
    ],
  },
  {
    id: "sand-1",
    title: "Sand Extraction Basics",
    category: "sand",
    difficulty: "Easy",
    equipment: ["Air compressor", "Tire pressure gauge", "Traction boards"],
    safetyWarnings: [
      "Deflate tires to appropriate pressure before attempting recovery",
      "Never spin tires excessively in sand",
    ],
    steps: [
      {
        number: 1,
        title: "Lower tire pressure",
        description: "Reduce tire pressure to 15-18 PSI to increase tire footprint and improve traction.",
      },
      {
        number: 2,
        title: "Clear sand from under vehicle",
        description: "Dig out sand from under the chassis and around all four wheels to prevent high-centering.",
      },
      {
        number: 3,
        title: "Create a path",
        description: "Use traction boards to create a solid surface for the tires to grip.",
      },
      {
        number: 4,
        title: "Maintain momentum",
        description: "Apply steady, gentle throttle to rock the vehicle free. Shift between forward and reverse if needed.",
      },
    ],
  },
  {
    id: "rocks-1",
    title: "Rock Crawling Recovery",
    category: "rocks",
    difficulty: "Moderate",
    equipment: ["Spotter", "Gloves", "Tire deflator"],
    safetyWarnings: [
      "Always use a spotter when navigating difficult rock obstacles",
      "Check for stability before attempting to move",
    ],
    steps: [
      {
        number: 1,
        title: "Stop and assess",
        description: "If hung up on rocks, stop immediately and exit the vehicle to inspect the situation.",
      },
      {
        number: 2,
        title: "Identify contact points",
        description: "Determine which parts of the vehicle are in contact with rocks and where clearance issues exist.",
      },
      {
        number: 3,
        title: "Lower tire pressure",
        description: "Reduce tire pressure to 12-15 PSI to allow tires to conform to rock surfaces.",
      },
      {
        number: 4,
        title: "Use spotter guidance",
        description: "Have a spotter guide you through the obstacle with precise steering and throttle input.",
      },
    ],
  },
  {
    id: "mechanical-1",
    title: "Overheating Engine",
    category: "mechanical",
    difficulty: "Easy",
    equipment: ["Coolant", "Water", "Rags"],
    safetyWarnings: [
      "Never open radiator cap when engine is hot",
      "Wait at least 30 minutes for engine to cool before attempting repairs",
    ],
    steps: [
      {
        number: 1,
        title: "Stop safely",
        description: "Pull over to a safe location and turn off the engine immediately.",
      },
      {
        number: 2,
        title: "Let engine cool",
        description: "Wait at least 30 minutes before opening the hood. Do not attempt to open the radiator cap while hot.",
      },
      {
        number: 3,
        title: "Check coolant level",
        description: "Once cool, carefully check coolant reservoir level. Add coolant or water if low.",
      },
      {
        number: 4,
        title: "Identify the cause",
        description: "Look for visible leaks, damaged hoses, or low coolant levels before continuing.",
      },
    ],
  },
  {
    id: "winching-1",
    title: "Safe Winching Procedure",
    category: "winching",
    difficulty: "Moderate",
    equipment: ["Winch", "Tree saver strap", "Snatch block", "Gloves", "Winch blanket"],
    safetyWarnings: [
      "Always use a winch blanket or heavy jacket over the cable during winching",
      "Keep all personnel at least 1.5x the cable length away from the winch line",
      "Never hook the winch cable back to itself",
    ],
    steps: [
      {
        number: 1,
        title: "Select anchor point",
        description: "Choose a solid anchor point like a large tree or rock. Ensure it can handle the load.",
      },
      {
        number: 2,
        title: "Attach tree saver",
        description: "Wrap tree saver strap around anchor point and attach winch hook to the strap, not the cable.",
      },
      {
        number: 3,
        title: "Position winch blanket",
        description: "Drape a heavy blanket or winch dampener over the cable midpoint to prevent whiplash if cable breaks.",
      },
      {
        number: 4,
        title: "Winch slowly",
        description: "Operate winch slowly and steadily. Keep vehicle in neutral with parking brake off.",
      },
    ],
  },
  {
    id: "tire-1",
    title: "Trail Tire Change",
    category: "tire",
    difficulty: "Easy",
    equipment: ["Jack", "Lug wrench", "Spare tire", "Wheel chocks"],
    safetyWarnings: [
      "Always use wheel chocks on opposite wheels",
      "Never work under a vehicle supported only by a jack",
    ],
    steps: [
      {
        number: 1,
        title: "Secure the vehicle",
        description: "Park on level ground, engage parking brake, and place wheel chocks behind opposite wheels.",
      },
      {
        number: 2,
        title: "Loosen lug nuts",
        description: "Before jacking, loosen lug nuts while tire is still on the ground.",
      },
      {
        number: 3,
        title: "Jack up vehicle",
        description: "Position jack on solid frame point and raise vehicle until tire is off the ground.",
      },
      {
        number: 4,
        title: "Replace tire",
        description: "Remove lug nuts, take off flat tire, mount spare, and hand-tighten lug nuts in star pattern.",
      },
      {
        number: 5,
        title: "Lower and tighten",
        description: "Lower vehicle to ground and fully tighten lug nuts in star pattern.",
      },
    ],
  },
];
