import AsyncStorage from "@react-native-async-storage/async-storage";
import { storage, UserProfile } from "./storage";

// ============================================
// FRIENDS LEADERBOARD
// ============================================

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatarUri?: string;
  totalMiles: number;
  trailsCompleted: number;
  badges: string[];
  rank: number;
  weeklyMiles: number;
  monthlyMiles: number;
  lastActive: number;
}

export interface LeaderboardPeriod {
  period: 'all-time' | 'monthly' | 'weekly';
  entries: LeaderboardEntry[];
  lastUpdated: number;
}

class LeaderboardManager {
  async getLeaderboard(
    period: 'all-time' | 'monthly' | 'weekly' = 'all-time',
    friendUserIds?: string[]
  ): Promise<LeaderboardEntry[]> {
    try {
      // In production, this would fetch from a backend
      // For now, generate sample data
      const entries = await this.generateLeaderboardEntries(friendUserIds);
      
      // Sort by appropriate metric
      const sorted = entries.sort((a, b) => {
        if (period === 'weekly') return b.weeklyMiles - a.weeklyMiles;
        if (period === 'monthly') return b.monthlyMiles - a.monthlyMiles;
        return b.totalMiles - a.totalMiles;
      });

      // Assign ranks
      sorted.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return sorted;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  private async generateLeaderboardEntries(friendUserIds?: string[]): Promise<LeaderboardEntry[]> {
    // Get current user's stats
    const profile = await storage.getUserProfile();
    const entries: LeaderboardEntry[] = [];

    if (profile?.trailStats) {
      entries.push({
        userId: profile.id,
        userName: profile.name,
        avatarUri: profile.customPhotoUri,
        totalMiles: profile.trailStats.totalMiles,
        trailsCompleted: profile.trailStats.trailsCompleted,
        badges: profile.earnedBadges || [],
        rank: 0,
        weeklyMiles: Math.random() * 50, // Mock data
        monthlyMiles: Math.random() * 200,
        lastActive: Date.now(),
      });
    }

    // Add mock friend data
    if (friendUserIds && friendUserIds.length > 0) {
      friendUserIds.forEach((friendId, index) => {
        entries.push({
          userId: friendId,
          userName: `Friend ${index + 1}`,
          totalMiles: Math.random() * 1000,
          trailsCompleted: Math.floor(Math.random() * 50),
          badges: [],
          rank: 0,
          weeklyMiles: Math.random() * 50,
          monthlyMiles: Math.random() * 200,
          lastActive: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        });
      });
    }

    return entries;
  }

  async getUserRank(userId: string, period: 'all-time' | 'monthly' | 'weekly' = 'all-time'): Promise<number> {
    const leaderboard = await this.getLeaderboard(period);
    const entry = leaderboard.find(e => e.userId === userId);
    return entry?.rank || 0;
  }

  async getTopUsers(limit: number = 10, period: 'all-time' | 'monthly' | 'weekly' = 'all-time'): Promise<LeaderboardEntry[]> {
    const leaderboard = await this.getLeaderboard(period);
    return leaderboard.slice(0, limit);
  }
}

// ============================================
// TRAIL PHOTO FEED
// ============================================

export interface TrailPhoto {
  id: string;
  userId: string;
  userName: string;
  userAvatarUri?: string;
  imageUri: string;
  caption?: string;
  trailId?: string;
  trailName?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: number;
  likes: string[]; // Array of user IDs who liked
  comments: PhotoComment[];
  tags: string[];
}

export interface PhotoComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

const PHOTOS_KEY = '@trail_photos';

class TrailPhotoFeedManager {
  async postPhoto(photo: Omit<TrailPhoto, 'id' | 'timestamp' | 'likes' | 'comments'>): Promise<TrailPhoto> {
    const newPhoto: TrailPhoto = {
      ...photo,
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      likes: [],
      comments: [],
    };

    const photos = await this.getAllPhotos();
    photos.unshift(newPhoto);
    
    // Keep only last 1000 photos
    const trimmed = photos.slice(0, 1000);
    await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(trimmed));

    return newPhoto;
  }

  async getAllPhotos(): Promise<TrailPhoto[]> {
    try {
      const data = await AsyncStorage.getItem(PHOTOS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading photos:', error);
      return [];
    }
  }

  async getFeed(limit: number = 20, offset: number = 0): Promise<TrailPhoto[]> {
    const photos = await this.getAllPhotos();
    return photos.slice(offset, offset + limit);
  }

  async getUserPhotos(userId: string): Promise<TrailPhoto[]> {
    const photos = await this.getAllPhotos();
    return photos.filter(p => p.userId === userId);
  }

  async getTrailPhotos(trailId: string): Promise<TrailPhoto[]> {
    const photos = await this.getAllPhotos();
    return photos.filter(p => p.trailId === trailId);
  }

  async likePhoto(photoId: string, userId: string): Promise<void> {
    const photos = await this.getAllPhotos();
    const photo = photos.find(p => p.id === photoId);
    
    if (photo && !photo.likes.includes(userId)) {
      photo.likes.push(userId);
      await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
    }
  }

  async unlikePhoto(photoId: string, userId: string): Promise<void> {
    const photos = await this.getAllPhotos();
    const photo = photos.find(p => p.id === photoId);
    
    if (photo) {
      photo.likes = photo.likes.filter(id => id !== userId);
      await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
    }
  }

  async addComment(photoId: string, userId: string, userName: string, text: string): Promise<PhotoComment> {
    const comment: PhotoComment = {
      id: `comment_${Date.now()}`,
      userId,
      userName,
      text,
      timestamp: Date.now(),
    };

    const photos = await this.getAllPhotos();
    const photo = photos.find(p => p.id === photoId);
    
    if (photo) {
      photo.comments.push(comment);
      await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
    }

    return comment;
  }

  async deletePhoto(photoId: string, userId: string): Promise<void> {
    const photos = await this.getAllPhotos();
    const filtered = photos.filter(p => !(p.id === photoId && p.userId === userId));
    await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(filtered));
  }
}

// ============================================
// GROUP CHALLENGES
// ============================================

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'distance' | 'trails' | 'elevation' | 'time';
  goal: number;
  startDate: number;
  endDate: number;
  participants: ChallengeParticipant[];
  prize?: string;
  badgeId?: string;
  isActive: boolean;
}

export interface ChallengeParticipant {
  userId: string;
  userName: string;
  progress: number;
  completed: boolean;
  completedAt?: number;
  rank?: number;
}

const CHALLENGES_KEY = '@group_challenges';

class ChallengeManager {
  async createChallenge(challenge: Omit<Challenge, 'id' | 'participants' | 'isActive'>): Promise<Challenge> {
    const newChallenge: Challenge = {
      ...challenge,
      id: `challenge_${Date.now()}`,
      participants: [],
      isActive: true,
    };

    const challenges = await this.getAllChallenges();
    challenges.push(newChallenge);
    await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));

    return newChallenge;
  }

  async joinChallenge(challengeId: string, userId: string, userName: string): Promise<void> {
    const challenges = await this.getAllChallenges();
    const challenge = challenges.find(c => c.id === challengeId);
    
    if (challenge && !challenge.participants.some(p => p.userId === userId)) {
      challenge.participants.push({
        userId,
        userName,
        progress: 0,
        completed: false,
      });
      await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
    }
  }

  async updateProgress(challengeId: string, userId: string, progress: number): Promise<void> {
    const challenges = await this.getAllChallenges();
    const challenge = challenges.find(c => c.id === challengeId);
    
    if (challenge) {
      const participant = challenge.participants.find(p => p.userId === userId);
      if (participant) {
        participant.progress = progress;
        
        if (progress >= challenge.goal && !participant.completed) {
          participant.completed = true;
          participant.completedAt = Date.now();
        }
        
        await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
      }
    }
  }

  async getAllChallenges(): Promise<Challenge[]> {
    try {
      const data = await AsyncStorage.getItem(CHALLENGES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading challenges:', error);
      return [];
    }
  }

  async getActiveChallenges(): Promise<Challenge[]> {
    const challenges = await this.getAllChallenges();
    const now = Date.now();
    
    return challenges.filter(c => 
      c.isActive && 
      c.startDate <= now && 
      c.endDate >= now
    );
  }

  async getUserChallenges(userId: string): Promise<Challenge[]> {
    const challenges = await this.getAllChallenges();
    return challenges.filter(c => 
      c.participants.some(p => p.userId === userId)
    );
  }

  async getChallengeLeaderboard(challengeId: string): Promise<ChallengeParticipant[]> {
    const challenges = await this.getAllChallenges();
    const challenge = challenges.find(c => c.id === challengeId);
    
    if (!challenge) return [];

    const sorted = [...challenge.participants].sort((a, b) => b.progress - a.progress);
    sorted.forEach((p, index) => {
      p.rank = index + 1;
    });

    return sorted;
  }

  async getMonthlyChallenge(): Promise<Challenge | null> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

    // Check if monthly challenge exists
    const challenges = await this.getAllChallenges();
    let monthlyChallenge = challenges.find(c => 
      c.startDate === monthStart && 
      c.endDate === monthEnd
    );

    // Create if doesn't exist
    if (!monthlyChallenge) {
      monthlyChallenge = await this.createChallenge({
        title: `${now.toLocaleString('default', { month: 'long' })} Miles Challenge`,
        description: 'Complete 100 miles of off-road trails this month!',
        type: 'distance',
        goal: 100,
        startDate: monthStart,
        endDate: monthEnd,
        badgeId: 'monthly_champion',
      });
    }

    return monthlyChallenge;
  }
}

// ============================================
// TRAIL COMMENTS & DISCUSSIONS
// ============================================

export interface TrailComment {
  id: string;
  trailId: string;
  userId: string;
  userName: string;
  userAvatarUri?: string;
  text: string;
  timestamp: number;
  likes: string[];
  replies: TrailCommentReply[];
  rating?: number;
  photos?: string[];
}

export interface TrailCommentReply {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

const COMMENTS_KEY = '@trail_comments';

class TrailDiscussionManager {
  async postComment(comment: Omit<TrailComment, 'id' | 'timestamp' | 'likes' | 'replies'>): Promise<TrailComment> {
    const newComment: TrailComment = {
      ...comment,
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      likes: [],
      replies: [],
    };

    const comments = await this.getAllComments();
    comments.push(newComment);
    await AsyncStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));

    return newComment;
  }

  async getAllComments(): Promise<TrailComment[]> {
    try {
      const data = await AsyncStorage.getItem(COMMENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading comments:', error);
      return [];
    }
  }

  async getTrailComments(trailId: string): Promise<TrailComment[]> {
    const comments = await this.getAllComments();
    return comments
      .filter(c => c.trailId === trailId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  async addReply(commentId: string, userId: string, userName: string, text: string): Promise<TrailCommentReply> {
    const reply: TrailCommentReply = {
      id: `reply_${Date.now()}`,
      userId,
      userName,
      text,
      timestamp: Date.now(),
    };

    const comments = await this.getAllComments();
    const comment = comments.find(c => c.id === commentId);
    
    if (comment) {
      comment.replies.push(reply);
      await AsyncStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
    }

    return reply;
  }

  async likeComment(commentId: string, userId: string): Promise<void> {
    const comments = await this.getAllComments();
    const comment = comments.find(c => c.id === commentId);
    
    if (comment && !comment.likes.includes(userId)) {
      comment.likes.push(userId);
      await AsyncStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
    }
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comments = await this.getAllComments();
    const filtered = comments.filter(c => !(c.id === commentId && c.userId === userId));
    await AsyncStorage.setItem(COMMENTS_KEY, JSON.stringify(filtered));
  }
}

// Export singleton instances
export const leaderboardManager = new LeaderboardManager();
export const photoFeedManager = new TrailPhotoFeedManager();
export const challengeManager = new ChallengeManager();
export const trailDiscussionManager = new TrailDiscussionManager();
