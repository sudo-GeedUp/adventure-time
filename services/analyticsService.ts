import { getAnalytics, logEvent as firebaseLogEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { getApp } from 'firebase/app';

class AnalyticsService {
  private analytics: any = null;
  private isInitialized = false;

  initialize() {
    try {
      if (typeof window !== 'undefined') {
        try {
          const app = getApp();
          this.analytics = getAnalytics(app);
          this.isInitialized = true;
          console.log('Analytics initialized successfully');
        } catch (appError) {
          console.log('Analytics skipped - Firebase not configured');
        }
      }
    } catch (error) {
      console.log('Analytics not available on this platform');
    }
  }

  logScreenView(screenName: string, screenClass?: string) {
    if (!this.isInitialized) return;
    try {
      firebaseLogEvent(this.analytics, 'screen_view' as any, {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (error) {
      console.error('Error logging screen view:', error);
    }
  }

  logTrailView(trailId: string, trailName: string, difficulty: string) {
    if (!this.isInitialized) return;
    try {
      firebaseLogEvent(this.analytics, 'view_item' as any, {
        item_id: trailId,
        item_name: trailName,
        item_category: 'trail',
        difficulty,
      });
    } catch (error) {
      console.error('Error logging trail view:', error);
    }
  }

  logAdventureStart(trailId: string, trailName: string, difficulty: string) {
    if (!this.isInitialized) return;
    try {
      firebaseLogEvent(this.analytics, 'adventure_start', {
        trail_id: trailId,
        trail_name: trailName,
        difficulty,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error logging adventure start:', error);
    }
  }

  logAdventureComplete(trailId: string, duration: number, distance: number) {
    if (!this.isInitialized) return;
    try {
      firebaseLogEvent(this.analytics, 'adventure_complete', {
        trail_id: trailId,
        duration_minutes: Math.round(duration / 60000),
        distance_miles: distance,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error logging adventure complete:', error);
    }
  }

  logAIGuideQuery(queryType: string, queryLength: number) {
    if (!this.isInitialized) return;
    try {
      firebaseLogEvent(this.analytics, 'ai_guide_query', {
        query_type: queryType,
        query_length: queryLength,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error logging AI guide query:', error);
    }
  }

  logAIScanUsage(scanType: string, isPremium: boolean) {
    if (!this.isInitialized) return;
    try {
      firebaseLogEvent(this.analytics, 'ai_scan_usage', {
        scan_type: scanType,
        is_premium: isPremium,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error logging AI scan usage:', error);
    }
  }

  logSubscriptionView() {
    if (!this.isInitialized) return;
    try {
      firebaseLogEvent(this.analytics, 'subscription_view', {
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error logging subscription view:', error);
    }
  }

  logSubscriptionPurchase(productId: string, price: number) {
    if (!this.isInitialized) return;
    try {
      firebaseLogEvent(this.analytics, 'purchase', {
        transaction_id: Date.now().toString(),
        value: price,
        currency: 'USD',
        items: [{ item_id: productId, item_name: 'Premium Subscription' }],
      });
    } catch (error) {
      console.error('Error logging subscription purchase:', error);
    }
  }

  logSOSActivation(location: { latitude: number; longitude: number }) {
    if (!this.isInitialized) return;
    try {
      firebaseLogEvent(this.analytics, 'sos_activation', {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error logging SOS activation:', error);
    }
  }

  logFriendRequest(action: 'sent' | 'accepted' | 'declined') {
    if (!this.isInitialized) return;
    try {
      firebaseLogEvent(this.analytics, 'friend_request', {
        action,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error logging friend request:', error);
    }
  }

  logTrailEvent(eventType: string, severity: string, trailId: string) {
    if (!this.isInitialized) return;
    try {
      firebaseLogEvent(this.analytics, 'trail_event', {
        event_type: eventType,
        severity,
        trail_id: trailId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error logging trail event:', error);
    }
  }

  logSearch(searchTerm: string, resultCount: number) {
    if (!this.isInitialized) return;
    try {
      firebaseLogEvent(this.analytics, 'search', {
        search_term: searchTerm,
        result_count: resultCount,
      });
    } catch (error) {
      console.error('Error logging search:', error);
    }
  }

  logShare(contentType: string, itemId: string) {
    if (!this.isInitialized) return;
    try {
      firebaseLogEvent(this.analytics, 'share', {
        content_type: contentType,
        item_id: itemId,
      });
    } catch (error) {
      console.error('Error logging share:', error);
    }
  }

  logError(errorType: string, errorMessage: string, screen?: string) {
    if (!this.isInitialized) return;
    try {
      firebaseLogEvent(this.analytics, 'app_error', {
        error_type: errorType,
        error_message: errorMessage,
        screen: screen || 'unknown',
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error logging error:', error);
    }
  }

  setUser(userId: string, properties?: Record<string, any>) {
    if (!this.isInitialized) return;
    try {
      setUserId(this.analytics, userId);
      if (properties) {
        setUserProperties(this.analytics, properties);
      }
    } catch (error) {
      console.error('Error setting user:', error);
    }
  }

  setUserProperty(property: string, value: any) {
    if (!this.isInitialized) return;
    try {
      setUserProperties(this.analytics, { [property]: value });
    } catch (error) {
      console.error('Error setting user property:', error);
    }
  }

  logCustomEvent(eventName: string, params?: Record<string, any>) {
    if (!this.isInitialized) return;
    try {
      firebaseLogEvent(this.analytics, eventName as any, params);
    } catch (error) {
      console.error('Error logging custom event:', error);
    }
  }
}

export const analyticsService = new AnalyticsService();
