import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { authService, UserProfile } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isPremium: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    console.log('AuthContext: Auto-authenticating for testing');
    
    // Auto-authenticate without requiring login
    const autoAuth = async () => {
      try {
        // Create a mock user profile for testing (with premium access)
        const mockProfile: UserProfile = {
          uid: 'test-user-' + Date.now(),
          email: 'test@adventure.app',
          displayName: 'Test User',
          photoURL: undefined,
          createdAt: Date.now(),
          lastLogin: Date.now(),
          isPremium: true,
        };
        
        setUserProfile(mockProfile);
        setIsPremium(true);
        console.log('AuthContext: Auto-authenticated as test user');
      } catch (error) {
        console.error('Error in auto-auth:', error);
      } finally {
        setLoading(false);
      }
    };
    
    autoAuth();
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const profile = await authService.signUpWithEmail(email, password, displayName);
      setUserProfile(profile);
    } catch (error) {
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const profile = await authService.signInWithEmail(email, password);
      setUserProfile(profile);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setUserProfile(null);
      setIsPremium(false);
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      await authService.updateUserProfile(updates);
      if (userProfile) {
        setUserProfile({ ...userProfile, ...updates });
      }
    } catch (error) {
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profile = await authService.getUserProfile(user.uid);
      setUserProfile(profile);
      
      const premiumStatus = await authService.checkPremiumStatus();
      setIsPremium(premiumStatus);
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user,
    isPremium,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
