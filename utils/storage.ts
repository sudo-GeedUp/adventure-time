import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  USER_PROFILE: "@adventure-time/user_profile",
  SAVED_GUIDES: "@adventure-time/saved_guides",
  EMERGENCY_CONTACTS: "@adventure-time/emergency_contacts",
  SCAN_HISTORY: "@adventure-time/scan_history",
  HELP_REQUESTS: "@adventure-time/help_requests",
  NEARBY_OFFROADERS: "@adventure-time/nearby_offroaders",
  COMMUNITY_TIPS: "@adventure-time/community_tips",
  CHAT_CONVERSATIONS: "@adventure-time/chat_conversations",
  FRIENDS_DATA: "@adventure-time/friends_data",
  STATUS_UPDATES: "@adventure-time/status_updates",
  FIRST_LAUNCH: "@adventure-time/first_launch",
  SPECIAL_THANKS_SHOWN: "@adventure-time/special_thanks_shown",
  COMMUNITY_ADVENTURES: "@adventure-time/community_adventures",
};

export interface TrailStats {
  totalMiles: number;
  trailsCompleted: number;
  lastTrailDate?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  milesRequired: number;
  earnedAt?: number;
}

export const MILESTONE_BADGES: Badge[] = [
  { id: "rookie", name: "Trail Rookie", description: "Complete your first 10 off-highway miles", icon: "flag", milesRequired: 10 },
  { id: "explorer", name: "Trail Explorer", description: "Travel 50 off-highway miles", icon: "compass", milesRequired: 50 },
  { id: "trooper", name: "Trail Trooper", description: "Travel 100 off-highway miles", icon: "shield", milesRequired: 100 },
  { id: "trailblazer", name: "Trailblazer", description: "Travel 250 off-highway miles", icon: "trending-up", milesRequired: 250 },
  { id: "pathfinder", name: "Pathfinder", description: "Travel 500 off-highway miles", icon: "navigation", milesRequired: 500 },
  { id: "adventurer", name: "Adventurer", description: "Travel 750 off-highway miles", icon: "map", milesRequired: 750 },
  { id: "expedition", name: "Expedition Master", description: "Travel 1,000 off-highway miles", icon: "award", milesRequired: 1000 },
  { id: "legend", name: "Trail Legend", description: "Travel 2,500 off-highway miles", icon: "star", milesRequired: 2500 },
  { id: "pioneer", name: "Pioneer Elite", description: "Travel 5,000 off-highway miles", icon: "zap", milesRequired: 5000 },
  { id: "boss", name: "Trail Boss", description: "Travel 7,500 off-highway miles", icon: "target", milesRequired: 7500 },
];

export interface UserProfile {
  id: string;
  name: string;
  vehicleType: string;
  avatarIndex: number;
  customPhotoUri?: string;
  vehicleSpecs?: {
    make: string;
    model: string;
    year: string;
    modifications: string;
  };
  equipment?: string[];
  trailStats?: TrailStats;
  earnedBadges?: string[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export interface ScanHistoryItem {
  id: string;
  imageUri: string;
  timestamp: number;
  situationType: string;
  analysis?: string;
}

export interface HelpRequest {
  id: string;
  timestamp: number;
  situation: string;
  situationLabel: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  targetAudience: "nearby" | "contacts";
  status: "active" | "resolved" | "cancelled";
  photos?: string[];
}

export interface NearbyOffroader {
  id: string;
  name: string;
  vehicleType: string;
  location: {
    latitude: number;
    longitude: number;
  };
  equipment: string[];
  lastSeen: number;
}

export interface CommunityTip {
  id: string;
  title: string;
  description: string;
  category: "recovery" | "navigation" | "trail_condition" | "maintenance" | "safety";
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  author: {
    name: string;
    vehicleType: string;
  };
  helpful: number;
  suggestedSpeed?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface ChatConversation {
  id: string;
  participantId: string;
  participantName: string;
  participantVehicle: string;
  messages: ChatMessage[];
  lastMessageTime: number;
  unreadCount: number;
}

export interface Adventure {
  id: string;
  title: string;
  location: string;
  timestamp: number;
  difficulty: "Easy" | "Moderate" | "Hard";
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  timestamp: number;
  speed?: number;
}

export interface AdventureHazard {
  id: string;
  type: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: number;
  suggestedSpeed?: number;
}

export interface AssistanceWaypoint {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  description: string;
  timestamp: number;
  status: "active" | "resolved";
}

export interface CompletedAdventure {
  id: string;
  userId: string;
  userName: string;
  vehicleType: string;
  title: string;
  startTime: number;
  endTime: number;
  totalDistance: number;
  maxSpeed: number;
  maxAltitude: number;
  route: RoutePoint[];
  hazards: AdventureHazard[];
  assistanceWaypoints: AssistanceWaypoint[];
  difficulty?: "Easy" | "Moderate" | "Hard" | "Expert";
  trailName?: string;
  description?: string;
}

export interface Friend {
  id: string;
  name: string;
  vehicleType: string;
  location: {
    latitude: number;
    longitude: number;
  };
  lastSeen: number;
  adventures: Adventure[];
}

export interface StatusUpdate {
  id: string;
  userId: string;
  userName: string;
  vehicleType: string;
  status: "mobile" | "stuck" | "recovering";
  location?: string;
  timestamp: number;
  details?: string;
}

export const storage = {
  async addStatusUpdate(update: StatusUpdate): Promise<void> {
    const updates = await this.getStatusUpdates();
    updates.unshift(update);
    await AsyncStorage.setItem(KEYS.STATUS_UPDATES, JSON.stringify(updates.slice(0, 50)));
  },

  async getStatusUpdates(): Promise<StatusUpdate[]> {
    const data = await AsyncStorage.getItem(KEYS.STATUS_UPDATES);
    return data ? JSON.parse(data) : [];
  },

  async getRecentUpdates(limit: number = 10): Promise<StatusUpdate[]> {
    const updates = await this.getStatusUpdates();
    return updates.slice(0, limit);
  },

  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error loading user profile:", error);
      return null;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error("Error saving user profile:", error);
    }
  },

  async addTrailMiles(miles: number): Promise<{ newBadges: Badge[], profile: UserProfile }> {
    const profile = await this.getUserProfile();
    if (!profile) {
      return { newBadges: [], profile: { id: "1", name: "", vehicleType: "", avatarIndex: 0 } };
    }

    const currentStats = profile.trailStats || { totalMiles: 0, trailsCompleted: 0 };
    const previousMiles = currentStats.totalMiles;
    const newTotalMiles = previousMiles + miles;

    const updatedStats: TrailStats = {
      ...currentStats,
      totalMiles: newTotalMiles,
      trailsCompleted: currentStats.trailsCompleted + 1,
      lastTrailDate: Date.now(),
    };

    const earnedBadges = profile.earnedBadges || [];
    const newBadges: Badge[] = [];

    for (const badge of MILESTONE_BADGES) {
      if (previousMiles < badge.milesRequired && newTotalMiles >= badge.milesRequired) {
        if (!earnedBadges.includes(badge.id)) {
          earnedBadges.push(badge.id);
          newBadges.push({ ...badge, earnedAt: Date.now() });
        }
      }
    }

    const updatedProfile: UserProfile = {
      ...profile,
      trailStats: updatedStats,
      earnedBadges,
    };

    await this.saveUserProfile(updatedProfile);
    return { newBadges, profile: updatedProfile };
  },

  getEarnedBadges(earnedBadgeIds: string[]): Badge[] {
    return MILESTONE_BADGES.filter(badge => earnedBadgeIds.includes(badge.id));
  },

  getNextBadge(totalMiles: number): Badge | null {
    for (const badge of MILESTONE_BADGES) {
      if (totalMiles < badge.milesRequired) {
        return badge;
      }
    }
    return null;
  },

  async getSavedGuides(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SAVED_GUIDES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error loading saved guides:", error);
      return [];
    }
  },

  async toggleSavedGuide(guideId: string): Promise<void> {
    try {
      const saved = await this.getSavedGuides();
      const index = saved.indexOf(guideId);
      
      if (index === -1) {
        saved.push(guideId);
      } else {
        saved.splice(index, 1);
      }
      
      await AsyncStorage.setItem(KEYS.SAVED_GUIDES, JSON.stringify(saved));
    } catch (error) {
      console.error("Error toggling saved guide:", error);
    }
  },

  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.EMERGENCY_CONTACTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error loading emergency contacts:", error);
      return [];
    }
  },

  async saveEmergencyContacts(contacts: EmergencyContact[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.EMERGENCY_CONTACTS, JSON.stringify(contacts));
    } catch (error) {
      console.error("Error saving emergency contacts:", error);
    }
  },

  async getScanHistory(): Promise<ScanHistoryItem[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SCAN_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error loading scan history:", error);
      return [];
    }
  },

  async addScanHistory(item: ScanHistoryItem): Promise<void> {
    try {
      const history = await this.getScanHistory();
      history.unshift(item);
      await AsyncStorage.setItem(KEYS.SCAN_HISTORY, JSON.stringify(history.slice(0, 20)));
    } catch (error) {
      console.error("Error saving scan history:", error);
    }
  },

  async getHelpRequests(): Promise<HelpRequest[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.HELP_REQUESTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error loading help requests:", error);
      return [];
    }
  },

  async addHelpRequest(request: HelpRequest): Promise<void> {
    try {
      const requests = await this.getHelpRequests();
      requests.unshift(request);
      await AsyncStorage.setItem(KEYS.HELP_REQUESTS, JSON.stringify(requests.slice(0, 50)));
    } catch (error) {
      console.error("Error saving help request:", error);
    }
  },

  async updateHelpRequestStatus(
    requestId: string,
    status: "active" | "resolved" | "cancelled"
  ): Promise<void> {
    try {
      const requests = await this.getHelpRequests();
      const index = requests.findIndex((r) => r.id === requestId);
      if (index !== -1) {
        requests[index].status = status;
        await AsyncStorage.setItem(KEYS.HELP_REQUESTS, JSON.stringify(requests));
      }
    } catch (error) {
      console.error("Error updating help request:", error);
    }
  },

  async getNearbyOffroaders(): Promise<NearbyOffroader[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.NEARBY_OFFROADERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error loading nearby offroaders:", error);
      return [];
    }
  },

  async addNearbyOffroader(offroader: NearbyOffroader): Promise<void> {
    try {
      const offroaders = await this.getNearbyOffroaders();
      const index = offroaders.findIndex((o) => o.id === offroader.id);
      
      if (index !== -1) {
        offroaders[index] = offroader;
      } else {
        offroaders.push(offroader);
      }
      
      await AsyncStorage.setItem(KEYS.NEARBY_OFFROADERS, JSON.stringify(offroaders));
    } catch (error) {
      console.error("Error adding nearby offroader:", error);
    }
  },

  async removeOldOffroaders(maxAgeMinutes: number = 30): Promise<void> {
    try {
      const offroaders = await this.getNearbyOffroaders();
      const cutoffTime = Date.now() - maxAgeMinutes * 60 * 1000;
      const activeOffroaders = offroaders.filter((o) => o.lastSeen > cutoffTime);
      await AsyncStorage.setItem(KEYS.NEARBY_OFFROADERS, JSON.stringify(activeOffroaders));
    } catch (error) {
      console.error("Error removing old offroaders:", error);
    }
  },

  async getCommunityTips(): Promise<CommunityTip[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.COMMUNITY_TIPS);
      const tips = data ? JSON.parse(data) : [];
      return tips.sort((a: CommunityTip, b: CommunityTip) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error("Error loading community tips:", error);
      return [];
    }
  },

  async saveCommunityTip(tip: CommunityTip): Promise<void> {
    try {
      const tips = await this.getCommunityTips();
      tips.unshift(tip);
      await AsyncStorage.setItem(KEYS.COMMUNITY_TIPS, JSON.stringify(tips));
    } catch (error) {
      console.error("Error saving community tip:", error);
    }
  },

  async markTipAsHelpful(tipId: string): Promise<void> {
    try {
      const tips = await this.getCommunityTips();
      const index = tips.findIndex((t) => t.id === tipId);
      if (index !== -1) {
        tips[index].helpful += 1;
        await AsyncStorage.setItem(KEYS.COMMUNITY_TIPS, JSON.stringify(tips));
      }
    } catch (error) {
      console.error("Error marking tip as helpful:", error);
    }
  },

  async getChatConversations(): Promise<ChatConversation[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CHAT_CONVERSATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error loading chat conversations:", error);
      return [];
    }
  },

  async getConversation(participantId: string): Promise<ChatConversation | null> {
    try {
      const conversations = await this.getChatConversations();
      return conversations.find((c) => c.participantId === participantId) || null;
    } catch (error) {
      console.error("Error loading conversation:", error);
      return null;
    }
  },

  async createOrUpdateConversation(
    participantId: string,
    participantName: string,
    participantVehicle: string
  ): Promise<ChatConversation> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CHAT_CONVERSATIONS);
      const conversations: ChatConversation[] = data ? JSON.parse(data) : [];
      const index = conversations.findIndex((c) => c.participantId === participantId);

      if (index !== -1) {
        return conversations[index];
      }

      const newConversation: ChatConversation = {
        id: `conv_${Date.now()}_${participantId}`,
        participantId,
        participantName,
        participantVehicle,
        messages: [],
        lastMessageTime: Date.now(),
        unreadCount: 0,
      };
      
      conversations.push(newConversation);
      await AsyncStorage.setItem(KEYS.CHAT_CONVERSATIONS, JSON.stringify(conversations));
      
      return newConversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  },

  async sendMessage(
    participantId: string,
    participantName: string,
    participantVehicle: string,
    senderId: string,
    senderName: string,
    text: string
  ): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CHAT_CONVERSATIONS);
      const conversations: ChatConversation[] = data ? JSON.parse(data) : [];
      let index = conversations.findIndex((c) => c.participantId === participantId);

      if (index === -1) {
        const newConversation: ChatConversation = {
          id: `conv_${Date.now()}_${participantId}`,
          participantId,
          participantName,
          participantVehicle,
          messages: [],
          lastMessageTime: Date.now(),
          unreadCount: 0,
        };
        conversations.push(newConversation);
        index = conversations.length - 1;
      }

      const message: ChatMessage = {
        id: `msg_${Date.now()}`,
        senderId,
        senderName,
        text,
        timestamp: Date.now(),
        read: false,
      };

      conversations[index].messages.push(message);
      conversations[index].lastMessageTime = message.timestamp;

      await AsyncStorage.setItem(KEYS.CHAT_CONVERSATIONS, JSON.stringify(conversations));
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  async markMessagesAsRead(participantId: string, currentUserId: string): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CHAT_CONVERSATIONS);
      const conversations: ChatConversation[] = data ? JSON.parse(data) : [];
      const index = conversations.findIndex((c) => c.participantId === participantId);

      if (index !== -1) {
        let hasUnread = false;
        conversations[index].messages.forEach((msg) => {
          if (msg.senderId !== currentUserId && !msg.read) {
            msg.read = true;
            hasUnread = true;
          }
        });
        
        if (hasUnread) {
          conversations[index].unreadCount = 0;
          await AsyncStorage.setItem(KEYS.CHAT_CONVERSATIONS, JSON.stringify(conversations));
        }
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  },

  async sendSimulatedResponse(
    participantId: string,
    participantName: string
  ): Promise<void> {
    const simulatedResponses = [
      "Got it! I'm about 2 miles away, heading your direction.",
      "I have recovery straps and a winch. What's your exact situation?",
      "On my way. Should be there in 10 minutes.",
      "I can help! Do you need a pull or a tow?",
      "Saw your location. I'm close by with recovery gear.",
      "Hang tight, I'll be there soon with my Jeep and winch.",
      "Roger that. What kind of vehicle are you driving?",
      "I'm nearby. Let me grab my recovery equipment and head over.",
    ];

    const randomResponse = simulatedResponses[Math.floor(Math.random() * simulatedResponses.length)];
    
    try {
      const conversation = await this.getConversation(participantId);
      if (!conversation) {
        console.error("Conversation not found for participant:", participantId);
        return;
      }

      await this.sendMessage(
        participantId,
        participantName,
        conversation.participantVehicle,
        participantId,
        participantName,
        randomResponse
      );
    } catch (error) {
      console.error("Error sending simulated response:", error);
    }
  },

  async getFriendsData(): Promise<Friend[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.FRIENDS_DATA);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error loading friends data:", error);
      return [];
    }
  },

  async saveFriendsData(friends: Friend[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.FRIENDS_DATA, JSON.stringify(friends));
    } catch (error) {
      console.error("Error saving friends data:", error);
    }
  },

  async addFriend(friend: Friend): Promise<void> {
    try {
      const friends = await this.getFriendsData();
      const index = friends.findIndex((f) => f.id === friend.id);
      if (index !== -1) {
        friends[index] = friend;
      } else {
        friends.push(friend);
      }
      await AsyncStorage.setItem(KEYS.FRIENDS_DATA, JSON.stringify(friends));
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  },

  async removeFriend(friendId: string): Promise<void> {
    try {
      const friends = await this.getFriendsData();
      const filtered = friends.filter((f) => f.id !== friendId);
      await AsyncStorage.setItem(KEYS.FRIENDS_DATA, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  },

  async addAdventure(friendId: string, adventure: Adventure): Promise<void> {
    try {
      const friends = await this.getFriendsData();
      const friend = friends.find((f) => f.id === friendId);
      if (friend) {
        friend.adventures.unshift(adventure);
        await AsyncStorage.setItem(KEYS.FRIENDS_DATA, JSON.stringify(friends));
      }
    } catch (error) {
      console.error("Error adding adventure:", error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  },

  async getFirstLaunchDone(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(KEYS.FIRST_LAUNCH);
      return data === "true";
    } catch (error) {
      console.error("Error getting first launch status:", error);
      return false;
    }
  },

  async setFirstLaunchDone(): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.FIRST_LAUNCH, "true");
    } catch (error) {
      console.error("Error setting first launch done:", error);
    }
  },

  async getSpecialThanksShown(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SPECIAL_THANKS_SHOWN);
      return data === "true";
    } catch (error) {
      console.error("Error getting special thanks status:", error);
      return false;
    }
  },

  async setSpecialThanksShown(): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SPECIAL_THANKS_SHOWN, "true");
    } catch (error) {
      console.error("Error setting special thanks shown:", error);
    }
  },

  async getCommunityAdventures(): Promise<CompletedAdventure[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.COMMUNITY_ADVENTURES);
      const adventures = data ? JSON.parse(data) : [];
      return adventures.sort((a: CompletedAdventure, b: CompletedAdventure) => b.endTime - a.endTime);
    } catch (error) {
      console.error("Error loading community adventures:", error);
      return [];
    }
  },

  async saveCompletedAdventure(adventure: CompletedAdventure): Promise<void> {
    try {
      const adventures = await this.getCommunityAdventures();
      adventures.unshift(adventure);
      await AsyncStorage.setItem(KEYS.COMMUNITY_ADVENTURES, JSON.stringify(adventures.slice(0, 100)));
    } catch (error) {
      console.error("Error saving completed adventure:", error);
    }
  },

  async getAdventuresNearLocation(
    latitude: number,
    longitude: number,
    radiusMiles: number = 50
  ): Promise<CompletedAdventure[]> {
    try {
      const adventures = await this.getCommunityAdventures();
      return adventures.filter((adventure) => {
        if (adventure.route.length === 0) return false;
        const startPoint = adventure.route[0];
        const R = 3959;
        const dLat = ((startPoint.latitude - latitude) * Math.PI) / 180;
        const dLon = ((startPoint.longitude - longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((latitude * Math.PI) / 180) *
            Math.cos((startPoint.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance <= radiusMiles;
      });
    } catch (error) {
      console.error("Error getting nearby adventures:", error);
      return [];
    }
  },

  async getActiveAssistanceWaypoints(): Promise<{ adventure: CompletedAdventure; waypoint: AssistanceWaypoint }[]> {
    try {
      const adventures = await this.getCommunityAdventures();
      const activeWaypoints: { adventure: CompletedAdventure; waypoint: AssistanceWaypoint }[] = [];
      
      adventures.forEach((adventure) => {
        adventure.assistanceWaypoints
          .filter((wp) => wp.status === "active")
          .forEach((waypoint) => {
            activeWaypoints.push({ adventure, waypoint });
          });
      });
      
      return activeWaypoints;
    } catch (error) {
      console.error("Error getting active assistance waypoints:", error);
      return [];
    }
  },

  async getCommunityScanSubmissions(): Promise<any[]> {
    try {
      const scanHistory = await this.getScanHistory();
      // Filter for scans that users have opted to share with community
      // Add difficulty scoring based on situation type and AI analysis
      const communityScans = scanHistory.map((scan: any) => ({
        ...scan,
        difficultyScore: this.calculateDifficultyScore(scan),
        votes: scan.votes || 0,
        userName: scan.userName || 'Anonymous',
      }));
      return communityScans;
    } catch (error) {
      console.error("Error getting community scan submissions:", error);
      return [];
    }
  },

  calculateDifficultyScore(scan: any): number {
    // Calculate difficulty based on situation type
    const difficultyMap: { [key: string]: number } = {
      'Deep Mud': 7,
      'Rock Crawl': 8,
      'Sand Trap': 6,
      'Water Crossing': 7,
      'Steep Incline': 8,
      'Vehicle Rollover': 10,
      'Broken Axle': 9,
      'High Centering': 7,
      'Stuck in Snow': 6,
      'Other': 5,
    };
    
    return difficultyMap[scan.situationType] || 5;
  },
};
