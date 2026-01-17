export interface VehicleSpecs {
  groundClearance: number; // inches
  wheelbase: number; // inches
  approachAngle: number; // degrees
  departureAngle: number; // degrees
  breakoverAngle: number; // degrees
  hasLockers: boolean;
  has4WD: boolean;
  tireSize: number; // inches
  hasWinch: boolean;
  hasSkidPlates: boolean;
  weight: number; // lbs
  engineType: 'gas' | 'diesel' | 'hybrid' | 'electric';
}

export interface TrailRequirements {
  minGroundClearance: number;
  maxWheelbase: number;
  minApproachAngle: number;
  minDepartureAngle: number;
  minBreakoverAngle: number;
  requiresLockers: boolean;
  requires4WD: boolean;
  minTireSize: number;
  requiresWinch: boolean;
  requiresSkidPlates: boolean;
  maxVehicleWeight?: number;
}

export interface DifficultyAssessment {
  overallDifficulty: 'Easy' | 'Moderate' | 'Hard' | 'Expert' | 'Not Recommended';
  score: number; // 0-100
  canComplete: boolean;
  warnings: string[];
  recommendations: string[];
  requiredModifications: string[];
  confidenceLevel: number; // 0-1
}

export class TrailDifficultyCalculator {
  // Calculate personalized difficulty based on vehicle specs
  static calculateDifficulty(
    vehicleSpecs: VehicleSpecs,
    trailRequirements: TrailRequirements
  ): DifficultyAssessment {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const requiredModifications: string[] = [];
    let score = 100;
    let canComplete = true;

    // Ground clearance check
    const clearanceDiff = vehicleSpecs.groundClearance - trailRequirements.minGroundClearance;
    if (clearanceDiff < 0) {
      score -= Math.abs(clearanceDiff) * 5;
      warnings.push(`Your ground clearance (${vehicleSpecs.groundClearance}") is ${Math.abs(clearanceDiff)}" below recommended`);
      if (clearanceDiff < -3) {
        canComplete = false;
        requiredModifications.push(`Lift kit needed (min ${trailRequirements.minGroundClearance}" clearance)`);
      }
    }

    // Wheelbase check (shorter is better for tight trails)
    if (vehicleSpecs.wheelbase > trailRequirements.maxWheelbase) {
      const wheelbadeDiff = vehicleSpecs.wheelbase - trailRequirements.maxWheelbase;
      score -= wheelbadeDiff * 2;
      warnings.push(`Long wheelbase may cause difficulty on tight turns`);
      recommendations.push('Take wider lines on switchbacks');
    }

    // Approach angle check
    const approachDiff = vehicleSpecs.approachAngle - trailRequirements.minApproachAngle;
    if (approachDiff < 0) {
      score -= Math.abs(approachDiff) * 3;
      warnings.push(`Low approach angle (${vehicleSpecs.approachAngle}°) - risk of front bumper damage`);
      recommendations.push('Approach obstacles at an angle when possible');
    }

    // Departure angle check
    const departureDiff = vehicleSpecs.departureAngle - trailRequirements.minDepartureAngle;
    if (departureDiff < 0) {
      score -= Math.abs(departureDiff) * 3;
      warnings.push(`Low departure angle (${vehicleSpecs.departureAngle}°) - risk of rear damage`);
      recommendations.push('Exit obstacles slowly and carefully');
    }

    // Breakover angle check
    const breakoverDiff = vehicleSpecs.breakoverAngle - trailRequirements.minBreakoverAngle;
    if (breakoverDiff < 0) {
      score -= Math.abs(breakoverDiff) * 3;
      warnings.push(`Low breakover angle - risk of high-centering`);
      recommendations.push('Use rock sliders or choose alternate lines');
    }

    // Lockers check
    if (trailRequirements.requiresLockers && !vehicleSpecs.hasLockers) {
      score -= 15;
      warnings.push('Trail requires differential lockers for traction');
      requiredModifications.push('Install front/rear lockers or limited-slip differentials');
      recommendations.push('Maintain momentum through difficult sections');
    }

    // 4WD check
    if (trailRequirements.requires4WD && !vehicleSpecs.has4WD) {
      canComplete = false;
      score = 0;
      warnings.push('This trail requires 4WD capability');
      requiredModifications.push('4WD is mandatory for this trail');
    }

    // Tire size check
    const tireDiff = vehicleSpecs.tireSize - trailRequirements.minTireSize;
    if (tireDiff < 0) {
      score -= Math.abs(tireDiff) * 4;
      warnings.push(`Larger tires recommended (current: ${vehicleSpecs.tireSize}")`);
      recommendations.push('Air down tires for better traction');
      if (tireDiff < -4) {
        requiredModifications.push(`Upgrade to minimum ${trailRequirements.minTireSize}" tires`);
      }
    }

    // Winch check
    if (trailRequirements.requiresWinch && !vehicleSpecs.hasWinch) {
      score -= 10;
      warnings.push('Winch strongly recommended for self-recovery');
      recommendations.push('Travel with others who have recovery gear');
    }

    // Skid plates check
    if (trailRequirements.requiresSkidPlates && !vehicleSpecs.hasSkidPlates) {
      score -= 8;
      warnings.push('Skid plates recommended to protect undercarriage');
      recommendations.push('Choose lines carefully to avoid rock strikes');
    }

    // Weight check (for soft terrain)
    if (trailRequirements.maxVehicleWeight && vehicleSpecs.weight > trailRequirements.maxVehicleWeight) {
      score -= 10;
      warnings.push('Heavy vehicle may struggle in sand/mud');
      recommendations.push('Reduce weight by removing unnecessary gear');
    }

    // Calculate overall difficulty
    let overallDifficulty: 'Easy' | 'Moderate' | 'Hard' | 'Expert' | 'Not Recommended';
    if (!canComplete || score < 30) {
      overallDifficulty = 'Not Recommended';
    } else if (score >= 85) {
      overallDifficulty = 'Easy';
    } else if (score >= 70) {
      overallDifficulty = 'Moderate';
    } else if (score >= 50) {
      overallDifficulty = 'Hard';
    } else {
      overallDifficulty = 'Expert';
    }

    // Calculate confidence level based on how many specs we have
    const specsProvided = Object.values(vehicleSpecs).filter(v => v !== undefined).length;
    const confidenceLevel = specsProvided / Object.keys(vehicleSpecs).length;

    return {
      overallDifficulty,
      score: Math.max(0, Math.min(100, score)),
      canComplete,
      warnings,
      recommendations,
      requiredModifications,
      confidenceLevel,
    };
  }

  // Get trail requirements based on standard difficulty
  static getStandardTrailRequirements(
    difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Expert'
  ): TrailRequirements {
    const requirements: { [key: string]: TrailRequirements } = {
      Easy: {
        minGroundClearance: 8,
        maxWheelbase: 130,
        minApproachAngle: 25,
        minDepartureAngle: 20,
        minBreakoverAngle: 15,
        requiresLockers: false,
        requires4WD: true,
        minTireSize: 31,
        requiresWinch: false,
        requiresSkidPlates: false,
      },
      Moderate: {
        minGroundClearance: 10,
        maxWheelbase: 120,
        minApproachAngle: 30,
        minDepartureAngle: 25,
        minBreakoverAngle: 20,
        requiresLockers: false,
        requires4WD: true,
        minTireSize: 33,
        requiresWinch: false,
        requiresSkidPlates: true,
      },
      Hard: {
        minGroundClearance: 12,
        maxWheelbase: 110,
        minApproachAngle: 35,
        minDepartureAngle: 30,
        minBreakoverAngle: 25,
        requiresLockers: true,
        requires4WD: true,
        minTireSize: 35,
        requiresWinch: true,
        requiresSkidPlates: true,
      },
      Expert: {
        minGroundClearance: 14,
        maxWheelbase: 100,
        minApproachAngle: 40,
        minDepartureAngle: 35,
        minBreakoverAngle: 30,
        requiresLockers: true,
        requires4WD: true,
        minTireSize: 37,
        requiresWinch: true,
        requiresSkidPlates: true,
      },
    };

    return requirements[difficulty];
  }

  // Get vehicle capability score
  static getVehicleCapabilityScore(specs: VehicleSpecs): {
    score: number;
    category: 'Stock' | 'Mild Build' | 'Moderate Build' | 'Extreme Build';
    strengths: string[];
    weaknesses: string[];
  } {
    let score = 0;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Score calculation
    if (specs.groundClearance >= 12) {
      score += 15;
      strengths.push('Excellent ground clearance');
    } else if (specs.groundClearance < 9) {
      weaknesses.push('Low ground clearance');
    }

    if (specs.hasLockers) {
      score += 20;
      strengths.push('Differential lockers');
    } else {
      weaknesses.push('No lockers');
    }

    if (specs.has4WD) {
      score += 15;
      strengths.push('4WD capable');
    } else {
      score = 0; // Can't offroad without 4WD
      weaknesses.push('No 4WD');
    }

    if (specs.tireSize >= 35) {
      score += 15;
      strengths.push('Large tires');
    } else if (specs.tireSize < 31) {
      weaknesses.push('Small tires');
    }

    if (specs.hasWinch) {
      score += 10;
      strengths.push('Self-recovery winch');
    }

    if (specs.hasSkidPlates) {
      score += 10;
      strengths.push('Undercarriage protection');
    }

    if (specs.approachAngle >= 35) {
      score += 5;
      strengths.push('Good approach angle');
    } else if (specs.approachAngle < 28) {
      weaknesses.push('Poor approach angle');
    }

    if (specs.departureAngle >= 30) {
      score += 5;
      strengths.push('Good departure angle');
    } else if (specs.departureAngle < 23) {
      weaknesses.push('Poor departure angle');
    }

    if (specs.wheelbase <= 100) {
      score += 5;
      strengths.push('Short wheelbase');
    } else if (specs.wheelbase > 120) {
      weaknesses.push('Long wheelbase');
    }

    // Categorize build level
    let category: 'Stock' | 'Mild Build' | 'Moderate Build' | 'Extreme Build';
    if (score >= 80) {
      category = 'Extreme Build';
    } else if (score >= 60) {
      category = 'Moderate Build';
    } else if (score >= 40) {
      category = 'Mild Build';
    } else {
      category = 'Stock';
    }

    return {
      score: Math.min(100, score),
      category,
      strengths,
      weaknesses,
    };
  }

  // Suggest modifications for trail
  static suggestModifications(
    currentSpecs: VehicleSpecs,
    targetDifficulty: 'Easy' | 'Moderate' | 'Hard' | 'Expert'
  ): {
    priority: 'Essential' | 'Recommended' | 'Nice to Have';
    modification: string;
    estimatedCost: string;
    difficultyImprovement: number;
  }[] {
    const requirements = this.getStandardTrailRequirements(targetDifficulty);
    const suggestions: any[] = [];

    // Check each requirement and suggest modifications
    if (currentSpecs.groundClearance < requirements.minGroundClearance) {
      suggestions.push({
        priority: 'Essential',
        modification: `Lift kit (${requirements.minGroundClearance - currentSpecs.groundClearance}" lift)`,
        estimatedCost: '$1,500 - $3,000',
        difficultyImprovement: 20,
      });
    }

    if (!currentSpecs.hasLockers && requirements.requiresLockers) {
      suggestions.push({
        priority: 'Essential',
        modification: 'Front and rear differential lockers',
        estimatedCost: '$2,000 - $4,000',
        difficultyImprovement: 25,
      });
    }

    if (currentSpecs.tireSize < requirements.minTireSize) {
      suggestions.push({
        priority: 'Recommended',
        modification: `Larger tires (${requirements.minTireSize}" or bigger)`,
        estimatedCost: '$1,200 - $2,000',
        difficultyImprovement: 15,
      });
    }

    if (!currentSpecs.hasWinch && requirements.requiresWinch) {
      suggestions.push({
        priority: 'Recommended',
        modification: 'Front winch (10,000+ lbs capacity)',
        estimatedCost: '$800 - $1,500',
        difficultyImprovement: 10,
      });
    }

    if (!currentSpecs.hasSkidPlates && requirements.requiresSkidPlates) {
      suggestions.push({
        priority: 'Recommended',
        modification: 'Skid plates (engine, transmission, transfer case)',
        estimatedCost: '$500 - $1,200',
        difficultyImprovement: 8,
      });
    }

    // Sort by priority and improvement
    suggestions.sort((a, b) => {
      const priorityOrder = { 'Essential': 0, 'Recommended': 1, 'Nice to Have': 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.difficultyImprovement - a.difficultyImprovement;
    });

    return suggestions;
  }
}
