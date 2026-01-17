import * as Speech from 'expo-speech';
import { calculateDistance } from './location';
import { Trail } from './trails';

export interface NavigationInstruction {
  id: string;
  text: string;
  distance: number; // meters to next instruction
  action: 'start' | 'continue' | 'turn-left' | 'turn-right' | 'sharp-left' | 'sharp-right' | 'straight' | 'arrive';
  location: {
    latitude: number;
    longitude: number;
  };
  spoken: boolean;
}

export interface NavigationRoute {
  trail: Trail;
  instructions: NavigationInstruction[];
  totalDistance: number;
  currentInstructionIndex: number;
  isActive: boolean;
}

class OfflineVoiceNavigationManager {
  private currentRoute: NavigationRoute | null = null;
  private lastSpokenInstruction: number = -1;
  private voiceEnabled: boolean = true;
  private voiceSettings = {
    language: 'en-US',
    pitch: 1.0,
    rate: 0.9,
  };

  async startNavigation(trail: Trail): Promise<NavigationRoute> {
    // Generate turn-by-turn instructions from trail data
    const instructions = this.generateInstructions(trail);
    
    this.currentRoute = {
      trail,
      instructions,
      totalDistance: trail.distance * 1609.34, // Convert miles to meters
      currentInstructionIndex: 0,
      isActive: true,
    };

    // Speak initial instruction
    await this.speakInstruction(instructions[0]);
    
    return this.currentRoute;
  }

  async stopNavigation(): Promise<void> {
    if (this.currentRoute) {
      this.currentRoute.isActive = false;
    }
    
    await Speech.stop();
    this.currentRoute = null;
    this.lastSpokenInstruction = -1;
  }

  async updatePosition(currentLocation: { latitude: number; longitude: number }): Promise<void> {
    if (!this.currentRoute || !this.currentRoute.isActive) return;

    const { instructions, currentInstructionIndex } = this.currentRoute;
    
    if (currentInstructionIndex >= instructions.length) {
      // Navigation complete
      await this.speakText("You have arrived at your destination");
      await this.stopNavigation();
      return;
    }

    const currentInstruction = instructions[currentInstructionIndex];
    const nextInstruction = instructions[currentInstructionIndex + 1];

    // Calculate distance to next instruction point
    const distanceToNext = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      currentInstruction.location.latitude,
      currentInstruction.location.longitude
    );

    // Check if we've reached the instruction point (within 30 meters)
    if (distanceToNext < 30 && nextInstruction) {
      this.currentRoute.currentInstructionIndex++;
      await this.speakInstruction(nextInstruction);
    } 
    // Provide distance updates at intervals
    else if (distanceToNext < 100 && !currentInstruction.spoken) {
      await this.speakDistanceUpdate(distanceToNext, currentInstruction);
      currentInstruction.spoken = true;
    }
    else if (distanceToNext < 500 && distanceToNext > 400 && this.lastSpokenInstruction !== currentInstructionIndex) {
      await this.speakText(`In ${Math.round(distanceToNext)} meters, ${this.getActionText(currentInstruction.action)}`);
      this.lastSpokenInstruction = currentInstructionIndex;
    }
  }

  private generateInstructions(trail: Trail): NavigationInstruction[] {
    const instructions: NavigationInstruction[] = [];
    
    // Start instruction
    instructions.push({
      id: `inst_0`,
      text: `Starting navigation to ${trail.name}. Head out when ready.`,
      distance: 0,
      action: 'start',
      location: trail.location,
      spoken: false,
    });

    // Generate intermediate instructions based on trail features
    // In a real app, this would use actual trail waypoints and turn data
    const segments = Math.max(3, Math.floor(trail.distance)); // One instruction per mile minimum
    
    for (let i = 1; i < segments; i++) {
      const progress = i / segments;
      const action = this.determineAction(i, segments);
      
      instructions.push({
        id: `inst_${i}`,
        text: this.generateInstructionText(action, trail, progress),
        distance: (trail.distance * 1609.34) / segments, // Distance in meters
        action,
        location: {
          // Interpolate position along trail (simplified)
          latitude: trail.location.latitude + (Math.random() - 0.5) * 0.01,
          longitude: trail.location.longitude + (Math.random() - 0.5) * 0.01,
        },
        spoken: false,
      });
    }

    // Arrival instruction
    instructions.push({
      id: `inst_${segments}`,
      text: `Arriving at ${trail.name}`,
      distance: 0,
      action: 'arrive',
      location: trail.location,
      spoken: false,
    });

    return instructions;
  }

  private determineAction(index: number, total: number): NavigationInstruction['action'] {
    // Simulate varied navigation actions
    const actions: NavigationInstruction['action'][] = [
      'continue', 'turn-left', 'turn-right', 'straight', 'sharp-left', 'sharp-right'
    ];
    
    if (index === 1) return 'continue';
    if (index === total - 1) return 'straight';
    
    // Random action for demo (in production, use actual trail geometry)
    return actions[Math.floor(Math.random() * actions.length)];
  }

  private generateInstructionText(
    action: NavigationInstruction['action'],
    trail: Trail,
    progress: number
  ): string {
    const actionTexts = {
      'start': `Head towards ${trail.name}`,
      'continue': 'Continue on trail',
      'turn-left': 'Turn left',
      'turn-right': 'Turn right',
      'sharp-left': 'Sharp left turn ahead',
      'sharp-right': 'Sharp right turn ahead',
      'straight': 'Continue straight',
      'arrive': `Arriving at ${trail.name}`,
    };

    let text = actionTexts[action];

    // Add contextual information based on trail features
    if (progress > 0.3 && progress < 0.4 && trail.features.includes('Water Crossing')) {
      text += '. Water crossing ahead';
    }
    if (progress > 0.5 && progress < 0.6 && trail.features.includes('Steep Climbs')) {
      text += '. Steep climb approaching';
    }
    if (progress > 0.7 && progress < 0.8 && trail.features.includes('Technical Rocks')) {
      text += '. Technical rock section ahead';
    }

    return text;
  }

  private getActionText(action: NavigationInstruction['action']): string {
    const actionTexts = {
      'start': 'start your journey',
      'continue': 'continue',
      'turn-left': 'turn left',
      'turn-right': 'turn right',
      'sharp-left': 'make a sharp left',
      'sharp-right': 'make a sharp right',
      'straight': 'continue straight',
      'arrive': 'arrive at destination',
    };
    
    return actionTexts[action];
  }

  private async speakInstruction(instruction: NavigationInstruction): Promise<void> {
    if (!this.voiceEnabled) return;
    
    await this.speakText(instruction.text);
  }

  private async speakDistanceUpdate(distance: number, instruction: NavigationInstruction): Promise<void> {
    if (!this.voiceEnabled) return;

    let distanceText: string;
    if (distance < 100) {
      distanceText = `In ${Math.round(distance)} meters`;
    } else if (distance < 1000) {
      distanceText = `In ${Math.round(distance / 100) * 100} meters`;
    } else {
      distanceText = `In ${(distance / 1609.34).toFixed(1)} miles`;
    }

    const text = `${distanceText}, ${this.getActionText(instruction.action)}`;
    await this.speakText(text);
  }

  private async speakText(text: string): Promise<void> {
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }
      
      await Speech.speak(text, this.voiceSettings);
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  }

  async setVoiceEnabled(enabled: boolean): void {
    this.voiceEnabled = enabled;
    if (!enabled) {
      await Speech.stop();
    }
  }

  async setVoiceSettings(settings: Partial<typeof this.voiceSettings>): void {
    this.voiceSettings = { ...this.voiceSettings, ...settings };
  }

  async preloadVoice(): Promise<void> {
    // Preload voice engine
    try {
      await Speech.speak('', { ...this.voiceSettings, volume: 0 });
    } catch (error) {
      console.error('Error preloading voice:', error);
    }
  }

  getCurrentRoute(): NavigationRoute | null {
    return this.currentRoute;
  }

  async repeatLastInstruction(): Promise<void> {
    if (!this.currentRoute || this.currentRoute.currentInstructionIndex >= this.currentRoute.instructions.length) {
      return;
    }

    const currentInstruction = this.currentRoute.instructions[this.currentRoute.currentInstructionIndex];
    await this.speakInstruction(currentInstruction);
  }

  async getNextInstruction(): NavigationInstruction | null {
    if (!this.currentRoute || this.currentRoute.currentInstructionIndex >= this.currentRoute.instructions.length - 1) {
      return null;
    }

    return this.currentRoute.instructions[this.currentRoute.currentInstructionIndex + 1];
  }

  async skipToNextInstruction(): Promise<void> {
    if (!this.currentRoute || this.currentRoute.currentInstructionIndex >= this.currentRoute.instructions.length - 1) {
      return;
    }

    this.currentRoute.currentInstructionIndex++;
    const nextInstruction = this.currentRoute.instructions[this.currentRoute.currentInstructionIndex];
    await this.speakInstruction(nextInstruction);
  }
}

export const voiceNavigationManager = new OfflineVoiceNavigationManager();
