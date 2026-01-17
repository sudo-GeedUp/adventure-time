import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from './storage';

const TRAIL_REVIEWS_KEY = '@adventure-time/trail_reviews';
const USER_REVIEWS_KEY = '@adventure-time/user_reviews';

export interface TrailReview {
  id: string;
  trailId: string;
  trailName: string;
  userId: string;
  userName: string;
  rating: number; // 1-5 stars
  difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Expert';
  vehicleType: string;
  conditions: {
    weather: string;
    trailCondition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Dangerous';
    crowded: boolean;
  };
  review: string;
  photos?: string[]; // URIs to photos
  helpfulCount: number;
  timestamp: number;
  bestTimeToVisit?: string;
  requiredMods?: string[];
  hazards?: string[];
}

export interface TrailRating {
  trailId: string;
  averageRating: number;
  totalReviews: number;
  difficultyBreakdown: {
    Easy: number;
    Moderate: number;
    Hard: number;
    Expert: number;
  };
  recentCondition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Dangerous';
  lastUpdated: number;
}

export class TrailReviewManager {
  // Add a new review
  static async addReview(review: Omit<TrailReview, 'id' | 'timestamp' | 'helpfulCount'>): Promise<void> {
    try {
      const newReview: TrailReview = {
        ...review,
        id: Date.now().toString(),
        timestamp: Date.now(),
        helpfulCount: 0,
      };

      const reviews = await this.getAllReviews();
      reviews.unshift(newReview);
      await AsyncStorage.setItem(TRAIL_REVIEWS_KEY, JSON.stringify(reviews));

      // Update user's review history
      await this.addToUserReviews(newReview);
      
      // Update trail rating
      await this.updateTrailRating(review.trailId);
    } catch (error) {
      console.error('Error adding review:', error);
    }
  }

  // Get reviews for a specific trail
  static async getTrailReviews(trailId: string): Promise<TrailReview[]> {
    try {
      const allReviews = await this.getAllReviews();
      return allReviews
        .filter(r => r.trailId === trailId)
        .sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting trail reviews:', error);
      return [];
    }
  }

  // Get all reviews
  static async getAllReviews(): Promise<TrailReview[]> {
    try {
      const reviews = await AsyncStorage.getItem(TRAIL_REVIEWS_KEY);
      return reviews ? JSON.parse(reviews) : [];
    } catch (error) {
      console.error('Error getting all reviews:', error);
      return [];
    }
  }

  // Get user's reviews
  static async getUserReviews(userId: string): Promise<TrailReview[]> {
    try {
      const userReviews = await AsyncStorage.getItem(`${USER_REVIEWS_KEY}_${userId}`);
      return userReviews ? JSON.parse(userReviews) : [];
    } catch (error) {
      console.error('Error getting user reviews:', error);
      return [];
    }
  }

  // Add to user's review history
  private static async addToUserReviews(review: TrailReview): Promise<void> {
    try {
      const userReviews = await this.getUserReviews(review.userId);
      userReviews.unshift(review);
      // Keep only last 50 reviews per user
      if (userReviews.length > 50) {
        userReviews.splice(50);
      }
      await AsyncStorage.setItem(
        `${USER_REVIEWS_KEY}_${review.userId}`,
        JSON.stringify(userReviews)
      );
    } catch (error) {
      console.error('Error adding to user reviews:', error);
    }
  }

  // Mark review as helpful
  static async markReviewHelpful(reviewId: string): Promise<void> {
    try {
      const reviews = await this.getAllReviews();
      const reviewIndex = reviews.findIndex(r => r.id === reviewId);
      
      if (reviewIndex !== -1) {
        reviews[reviewIndex].helpfulCount++;
        await AsyncStorage.setItem(TRAIL_REVIEWS_KEY, JSON.stringify(reviews));
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    }
  }

  // Update trail rating based on reviews
  static async updateTrailRating(trailId: string): Promise<TrailRating> {
    try {
      const reviews = await this.getTrailReviews(trailId);
      
      if (reviews.length === 0) {
        return {
          trailId,
          averageRating: 0,
          totalReviews: 0,
          difficultyBreakdown: {
            Easy: 0,
            Moderate: 0,
            Hard: 0,
            Expert: 0,
          },
          recentCondition: 'Good',
          lastUpdated: Date.now(),
        };
      }

      // Calculate average rating
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / reviews.length;

      // Calculate difficulty breakdown
      const difficultyBreakdown = {
        Easy: 0,
        Moderate: 0,
        Hard: 0,
        Expert: 0,
      };

      reviews.forEach(r => {
        difficultyBreakdown[r.difficulty]++;
      });

      // Get most recent condition (from last 5 reviews)
      const recentReviews = reviews.slice(0, 5);
      const conditions = recentReviews.map(r => r.conditions.trailCondition);
      const recentCondition = this.getMostCommonCondition(conditions);

      const rating: TrailRating = {
        trailId,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
        difficultyBreakdown,
        recentCondition,
        lastUpdated: Date.now(),
      };

      // Cache the rating
      await this.cacheTrailRating(rating);
      
      return rating;
    } catch (error) {
      console.error('Error updating trail rating:', error);
      throw error;
    }
  }

  // Get trail rating
  static async getTrailRating(trailId: string): Promise<TrailRating | null> {
    try {
      const ratings = await AsyncStorage.getItem('@adventure-time/trail_ratings');
      if (ratings) {
        const allRatings = JSON.parse(ratings);
        return allRatings[trailId] || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting trail rating:', error);
      return null;
    }
  }

  // Cache trail rating
  private static async cacheTrailRating(rating: TrailRating): Promise<void> {
    try {
      const ratings = await AsyncStorage.getItem('@adventure-time/trail_ratings');
      const allRatings = ratings ? JSON.parse(ratings) : {};
      allRatings[rating.trailId] = rating;
      await AsyncStorage.setItem('@adventure-time/trail_ratings', JSON.stringify(allRatings));
    } catch (error) {
      console.error('Error caching trail rating:', error);
    }
  }

  // Get most common condition from array
  private static getMostCommonCondition(
    conditions: string[]
  ): 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Dangerous' {
    if (conditions.length === 0) return 'Good';

    const counts: { [key: string]: number } = {};
    conditions.forEach(c => {
      counts[c] = (counts[c] || 0) + 1;
    });

    let maxCount = 0;
    let mostCommon = 'Good';
    
    Object.entries(counts).forEach(([condition, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = condition;
      }
    });

    return mostCommon as any;
  }

  // Get recent reviews across all trails
  static async getRecentReviews(limit: number = 10): Promise<TrailReview[]> {
    try {
      const allReviews = await this.getAllReviews();
      return allReviews
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent reviews:', error);
      return [];
    }
  }

  // Delete review
  static async deleteReview(reviewId: string, userId: string): Promise<void> {
    try {
      // Remove from all reviews
      const allReviews = await this.getAllReviews();
      const filtered = allReviews.filter(r => r.id !== reviewId);
      await AsyncStorage.setItem(TRAIL_REVIEWS_KEY, JSON.stringify(filtered));

      // Remove from user reviews
      const userReviews = await this.getUserReviews(userId);
      const userFiltered = userReviews.filter(r => r.id !== reviewId);
      await AsyncStorage.setItem(
        `${USER_REVIEWS_KEY}_${userId}`,
        JSON.stringify(userFiltered)
      );

      // Update trail rating
      const review = allReviews.find(r => r.id === reviewId);
      if (review) {
        await this.updateTrailRating(review.trailId);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  }
}
