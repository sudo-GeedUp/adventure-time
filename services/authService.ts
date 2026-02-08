import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithCredential,
  OAuthProvider,
  User,
  onAuthStateChanged,
  deleteUser,
} from "firebase/auth";
import { isFirebaseAvailable } from "@/utils/firebase";
import { storage } from "@/utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  vehicleType?: string;
  vehicleSpecs?: {
    make: string;
    model: string;
    year: string;
  };
  emergencyContacts?: any[];
  createdAt: number;
  lastLogin: number;
  isPremium: boolean;
  premiumExpiresAt?: number;
}

class AuthService {
  private auth: any = null;
  private authStateListeners: ((user: User | null) => void)[] = [];

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (isFirebaseAvailable()) {
      this.auth = getAuth();

      onAuthStateChanged(this.auth, (user) => {
        this.authStateListeners.forEach((listener) => listener(user));
        if (user) {
          this.updateLastLogin(user.uid);
        }
      });
    }
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.authStateListeners.push(callback);

    if (this.auth?.currentUser) {
      callback(this.auth.currentUser);
    }

    return () => {
      this.authStateListeners = this.authStateListeners.filter(
        (cb) => cb !== callback,
      );
    };
  }

  getCurrentUser(): User | null {
    return this.auth?.currentUser || null;
  }

  async signUpWithEmail(
    email: string,
    password: string,
    displayName: string,
  ): Promise<UserProfile> {
    if (!this.auth) throw new Error("Firebase not initialized");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password,
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName });

      const profile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName,
        createdAt: Date.now(),
        lastLogin: Date.now(),
        isPremium: false,
      };

      await this.saveUserProfile(profile);
      return profile;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async signInWithEmail(email: string, password: string): Promise<UserProfile> {
    if (!this.auth) throw new Error("Firebase not initialized");

    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password,
      );
      const user = userCredential.user;

      let profile = await this.getUserProfile(user.uid);

      if (!profile) {
        profile = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || "User",
          createdAt: Date.now(),
          lastLogin: Date.now(),
          isPremium: false,
        };
        await this.saveUserProfile(profile);
      }

      return profile;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async signInWithGoogle(): Promise<UserProfile> {
    throw new Error("Google Sign-In not yet implemented. Coming soon!");
  }

  async signInWithApple(): Promise<UserProfile> {
    throw new Error("Apple Sign-In not yet implemented. Coming soon!");
  }

  async signOut(): Promise<void> {
    if (!this.auth) throw new Error("Firebase not initialized");

    try {
      await signOut(this.auth);
      await AsyncStorage.removeItem("userProfile");
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    if (!this.auth) throw new Error("Firebase not initialized");

    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) throw new Error("No user logged in");

    try {
      if (updates.displayName || updates.photoURL) {
        await updateProfile(user, {
          displayName: updates.displayName,
          photoURL: updates.photoURL,
        });
      }

      const currentProfile = await this.getUserProfile(user.uid);
      if (currentProfile) {
        const updatedProfile = { ...currentProfile, ...updates };
        await this.saveUserProfile(updatedProfile);
      }
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async updateUserEmail(newEmail: string, password: string): Promise<void> {
    const user = this.getCurrentUser();
    if (!user || !user.email) throw new Error("No user logged in");

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, newEmail);

      const profile = await this.getUserProfile(user.uid);
      if (profile) {
        profile.email = newEmail;
        await this.saveUserProfile(profile);
      }
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async updateUserPassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = this.getCurrentUser();
    if (!user || !user.email) throw new Error("No user logged in");

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async deleteAccount(password?: string): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) throw new Error("No user logged in");

    try {
      if (password && user.email) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }

      await deleteUser(user);
      await AsyncStorage.removeItem("userProfile");
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const stored = await AsyncStorage.getItem(`userProfile_${uid}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `userProfile_${profile.uid}`,
        JSON.stringify(profile),
      );

      const legacyProfile = {
        id: profile.uid,
        name: profile.displayName,
        email: profile.email,
        vehicleType: profile.vehicleType || "",
        vehicleSpecs: profile.vehicleSpecs
          ? {
              ...profile.vehicleSpecs,
              modifications: "",
            }
          : undefined,
        avatarIndex: 0,
      };
      await storage.saveUserProfile(legacyProfile);
    } catch (error) {
      console.error("Error saving user profile:", error);
      throw error;
    }
  }

  private async updateLastLogin(uid: string): Promise<void> {
    try {
      const profile = await this.getUserProfile(uid);
      if (profile) {
        profile.lastLogin = Date.now();
        await this.saveUserProfile(profile);
      }
    } catch (error) {
      console.error("Error updating last login:", error);
    }
  }

  private handleAuthError(error: any): Error {
    const errorCode = error.code;
    let message = "An error occurred. Please try again.";

    switch (errorCode) {
      case "auth/email-already-in-use":
        message = "This email is already registered. Please sign in instead.";
        break;
      case "auth/invalid-email":
        message = "Invalid email address.";
        break;
      case "auth/operation-not-allowed":
        message = "This sign-in method is not enabled.";
        break;
      case "auth/weak-password":
        message = "Password is too weak. Please use at least 6 characters.";
        break;
      case "auth/user-disabled":
        message = "This account has been disabled.";
        break;
      case "auth/user-not-found":
        message = "No account found with this email.";
        break;
      case "auth/wrong-password":
        message = "Incorrect password.";
        break;
      case "auth/too-many-requests":
        message = "Too many failed attempts. Please try again later.";
        break;
      case "auth/network-request-failed":
        message = "Network error. Please check your connection.";
        break;
      case "auth/requires-recent-login":
        message = "Please sign in again to complete this action.";
        break;
      default:
        message = error.message || message;
    }

    return new Error(message);
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  async checkPremiumStatus(): Promise<boolean> {
    const user = this.getCurrentUser();
    if (!user) return false;

    const profile = await this.getUserProfile(user.uid);
    if (!profile) return false;

    if (profile.isPremium && profile.premiumExpiresAt) {
      return profile.premiumExpiresAt > Date.now();
    }

    return profile.isPremium;
  }

  async setPremiumStatus(
    isPremium: boolean,
    expiresAt?: number,
  ): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) throw new Error("No user logged in");

    const profile = await this.getUserProfile(user.uid);
    if (profile) {
      profile.isPremium = isPremium;
      profile.premiumExpiresAt = expiresAt;
      await this.saveUserProfile(profile);
    }
  }
}

export const authService = new AuthService();
