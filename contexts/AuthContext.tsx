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
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const profile = await authService.getUserProfile(firebaseUser.uid);
        setUserProfile(profile);
        
        const premiumStatus = await authService.checkPremiumStatus();
        setIsPremium(premiumStatus);
      } else {
        setUserProfile(null);
        setIsPremium(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
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
