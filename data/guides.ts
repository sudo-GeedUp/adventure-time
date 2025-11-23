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
  { id: "snow", title: "Stuck in Snow", icon: "cloud", guideCount: 4 },
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
    id: "snow-1",
    title: "Basic Snow Extraction",
    category: "snow",
    difficulty: "Easy",
    equipment: ["Shovel", "Traction boards", "Sand or kitty litter", "Gloves"],
    safetyWarnings: [
      "Never spin tires excessively in snow - it creates ice under the tires",
      "Watch for hypothermia if working outdoors for extended periods in cold weather",
      "Keep the exhaust pipe clear of snow to prevent carbon monoxide buildup",
    ],
    steps: [
      {
        number: 1,
        title: "Clear around the tires",
        description: "Shovel out snow from around all four wheels, especially under the chassis. Remove snow that's built up under the vehicle.",
      },
      {
        number: 2,
        title: "Create a path",
        description: "Shovel or remove snow in front and behind the vehicle to create a clear escape route.",
      },
      {
        number: 3,
        title: "Add traction material",
        description: "Place traction boards, sand, gravel, or kitty litter under the drive wheels for improved grip.",
      },
      {
        number: 4,
        title: "Attempt gentle recovery",
        description: "Gently apply throttle without spinning tires. Rock the vehicle slowly forward and backward using low gear.",
      },
    ],
  },
  {
    id: "snow-2",
    title: "Snow and Ice Recovery",
    category: "snow",
    difficulty: "Moderate",
    equipment: ["Shovel", "Ice scraper", "Traction pads", "Tire chains", "Air compressor"],
    safetyWarnings: [
      "Tire chains require practice to install - don't wait until you're stuck to learn",
      "Check local laws regarding tire chain usage on winter roads",
      "Deflating tires slightly helps with ice traction but may cause damage - use with caution",
    ],
    steps: [
      {
        number: 1,
        title: "Break ice pack",
        description: "Use an ice scraper or shovel to break up ice formed under and around the vehicle, especially under the chassis.",
      },
      {
        number: 2,
        title: "Install tire chains",
        description: "If available, install tire chains on drive wheels before attempting recovery. Chains dramatically improve traction.",
      },
      {
        number: 3,
        title: "Lower tire pressure slightly",
        description: "Reduce tire pressure by 2-3 PSI to increase tire surface contact with ice, but not so much that you damage the tires.",
      },
      {
        number: 4,
        title: "Use controlled throttle",
        description: "Apply very gentle, steady throttle. Excessive wheel spin will polish the ice underneath and make it worse.",
      },
      {
        number: 5,
        title: "Rock if necessary",
        description: "If stuck after chains, slowly rock between forward and reverse to build momentum for escape.",
      },
    ],
  },
  {
    id: "snow-3",
    title: "Deep Snow Recovery",
    category: "snow",
    difficulty: "Advanced",
    equipment: ["Shovel", "High-lift jack", "Traction boards", "Full-size spare", "Winch (recommended)"],
    safetyWarnings: [
      "Deep snow recovery is dangerous - never attempt alone",
      "High-lift jacks can cause vehicle rollover - use extreme caution",
      "Watch for hidden obstacles under deep snow like rocks or stumps",
      "Hypothermia risk increases significantly in deep snow conditions",
    ],
    steps: [
      {
        number: 1,
        title: "Clear a large area",
        description: "Shovel a wide path around the entire vehicle to locate hidden obstacles and create working space.",
      },
      {
        number: 2,
        title: "Dig out all wheels",
        description: "Completely expose all four wheels by digging out the snow. Remove snow from the bottom of the vehicle.",
      },
      {
        number: 3,
        title: "Use high-lift jack carefully",
        description: "If the vehicle is high-centered, use a high-lift jack to lift one wheel at a time and place traction boards underneath.",
      },
      {
        number: 4,
        title: "Build a packed road",
        description: "Compress snow into a packed surface using traction boards, spare tires, or by repeatedly driving over the same path.",
      },
      {
        number: 5,
        title: "Attempt escape with full momentum",
        description: "Once traction materials are in place, attempt recovery with steady throttle. Consider using a winch as backup.",
      },
    ],
  },
  {
    id: "snow-4",
    title: "Winter Preparation and Prevention",
    category: "snow",
    difficulty: "Easy",
    equipment: ["Winter tires", "Tire chains", "Emergency kit", "Shovel", "Blankets"],
    safetyWarnings: [
      "Winter driving requires significant skill and preparation - avoid if possible",
      "All-terrain tires perform poorly in snow compared to proper winter tires",
      "Keep extra fuel to run engine for heat if stranded",
    ],
    steps: [
      {
        number: 1,
        title: "Switch to winter tires",
        description: "Winter tires provide significantly better traction than all-season or all-terrain tires. This is the single best prevention step.",
      },
      {
        number: 2,
        title: "Carry tire chains",
        description: "Keep chains in your vehicle during winter. Practice installing them at home before you need them on the trail.",
      },
      {
        number: 3,
        title: "Pack emergency supplies",
        description: "Bring blankets, food, water, first aid kit, and jumper cables. A stranded vehicle in winter can be life-threatening.",
      },
      {
        number: 4,
        title: "Reduce tire pressure",
        description: "In snow, reduce tire pressure to 20-25 PSI for better flotation, but be prepared to air back up on hard roads.",
      },
      {
        number: 5,
        title: "Drive slowly and carefully",
        description: "Use low gear, avoid sudden acceleration or braking, and maintain a slow, steady pace. Prevention is better than recovery.",
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
