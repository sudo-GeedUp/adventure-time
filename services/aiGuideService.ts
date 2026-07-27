import { Trail } from "@/utils/trails";
import {
  isOpenAIProxyConfigured,
  OpenAIProxyError,
  requestOpenAIProxy,
} from "@/services/openaiProxy";

interface GuideContext {
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  currentTrail?: Trail;
  weather?: any;
  vehicleType?: string;
  experienceLevel?: string;
  recentActivities?: string[];
  userPreferences?: {
    difficulty?: string;
    terrain?: string;
    distance?: string;
  };
}

interface GuideMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GuideSuggestion {
  type: "trail" | "safety" | "tip" | "warning" | "recommendation";
  title: string;
  message: string;
  priority: "low" | "medium" | "high" | "critical";
  actionable?: boolean;
  action?: {
    label: string;
    type: "navigate" | "call" | "share" | "view";
    data?: any;
  };
}

class AIGuideService {
  private conversationHistory: GuideMessage[] = [];
  private context: GuideContext = {};

  isAvailable(): boolean {
    return isOpenAIProxyConfigured();
  }

  updateContext(context: Partial<GuideContext>) {
    this.context = { ...this.context, ...context };
  }

  getContext(): GuideContext {
    return this.context;
  }

  clearConversation() {
    this.conversationHistory = [];
  }

  async chat(userMessage: string): Promise<string> {
    if (!isOpenAIProxyConfigured()) {
      return "I'm sorry, but I'm not available right now. Please check your internet connection and try again.";
    }

    try {
      // Add user message to history
      this.conversationHistory.push({
        role: "user",
        content: userMessage,
      });

      const data = await requestOpenAIProxy<{ text: string }>({
        operation: "chat",
        conversationHistory: this.conversationHistory.slice(-10),
        context: this.context,
      });
      const assistantMessage =
        data.text ||
        "I'm having trouble responding right now. Please try again.";

      // Add assistant response to history
      this.conversationHistory.push({
        role: "assistant",
        content: assistantMessage,
      });

      return assistantMessage;
    } catch (error: any) {
      console.error("AI Guide chat error:", error);

      if (error instanceof OpenAIProxyError && error.status === 429) {
        return "I'm getting too many requests right now. Please wait a moment and try again.";
      }
      if (
        error instanceof OpenAIProxyError &&
        (error.status === 401 || error.status === 403)
      ) {
        return "Trail Buddy is available with an active premium subscription.";
      }

      return "I encountered an error. Please try asking your question again.";
    }
  }

  async getSmartSuggestions(): Promise<GuideSuggestion[]> {
    if (!isOpenAIProxyConfigured()) return [];

    try {
      const data = await requestOpenAIProxy<{ suggestions: GuideSuggestion[] }>(
        {
          operation: "getSmartSuggestions",
          context: this.context,
        },
      );
      return data.suggestions || [];
    } catch (error) {
      console.error("Error getting smart suggestions:", error);
      return [];
    }
  }

  async getTrailRecommendations(
    trails: Trail[],
    limit: number = 3,
  ): Promise<Trail[]> {
    return trails.slice(0, limit);
  }

  async analyzeTrailSafety(trail: Trail): Promise<{
    safetyScore: number;
    warnings: string[];
    recommendations: string[];
  }> {
    void trail;
    return {
      safetyScore: 7,
      warnings: ["Unable to analyze safety at this time"],
      recommendations: ["Proceed with caution and check conditions"],
    };
  }

  async getQuickTip(): Promise<string> {
    if (!isOpenAIProxyConfigured()) {
      return "💡 Always let someone know your route and expected return time before heading out.";
    }

    try {
      const data = await requestOpenAIProxy<{ text: string }>({
        operation: "getQuickTip",
        context: this.context,
      });
      return data.text?.trim() || "💡 Stay safe and have fun on the trails!";
    } catch (error) {
      console.error("Error getting quick tip:", error);
      if (error instanceof OpenAIProxyError && error.status === 429) {
        return "💡 AI is busy right now. Please try again later.";
      }
      return "💡 Always carry emergency supplies and a first aid kit.";
    }
  }

  async getEmergencyGuidance(situation: string): Promise<string> {
    void situation;
    return `Emergency Guidance:
1. Stay calm and assess the situation
2. Call 911 if there's immediate danger
3. Share your location with emergency contacts
4. Stay with your vehicle if possible
5. Use emergency supplies

If you need immediate help, call 911.`;
  }

  async generateTripPlan(
    destination: string,
    duration: string,
    preferences: string[],
  ): Promise<string> {
    void destination;
    void duration;
    void preferences;
    return "I'm unable to generate a trip plan right now. Please try again later.";
  }
}

export const aiGuideService = new AIGuideService();
export type { GuideContext, GuideSuggestion, GuideMessage };
