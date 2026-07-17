import {
  signInAnonymously,
  signOut,
  User,
  Auth,
} from "firebase/auth";
import {
  Database,
  ref,
  set,
  get,
  update,
  onValue,
  Unsubscribe,
} from "firebase/database";
import { Friend, Adventure } from "./storage";

let currentUser: User | null = null;

export const initializeAuth = async (auth: Auth) => {
  try {
    const result = await signInAnonymously(auth);
    currentUser = result.user;
    return result.user;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
};

export const getCurrentUser = () => currentUser;

export const saveFriendToFirebase = async (
  db: Database,
  userId: string,
  friend: Friend
) => {
  try {
    const friendRef = ref(db, `users/${userId}/friends/${friend.id}`);
    await set(friendRef, friend);
  } catch (error) {
    console.error("Error saving friend:", error);
  }
};

export const getFriendsFromFirebase = async (
  db: Database,
  userId: string
): Promise<Friend[]> => {
  try {
    const friendsRef = ref(db, `users/${userId}/friends`);
    const snapshot = await get(friendsRef);
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    return [];
  } catch (error) {
    console.error("Error getting friends:", error);
    return [];
  }
};

export const subscribeToFriends = (
  db: Database,
  userId: string,
  callback: (friends: Friend[]) => void
): Unsubscribe => {
  const friendsRef = ref(db, `users/${userId}/friends`);
  return onValue(friendsRef, (snapshot) => {
    if (snapshot.exists()) {
      const friends = Object.values(snapshot.val());
      callback(friends as Friend[]);
    } else {
      callback([]);
    }
  });
};

export const updateFriendLocation = async (
  db: Database,
  userId: string,
  friendId: string,
  location: { latitude: number; longitude: number }
) => {
  try {
    const locationRef = ref(db, `users/${userId}/friends/${friendId}/location`);
    await set(locationRef, {
      ...location,
      lastSeen: Date.now(),
    });
  } catch (error) {
    console.error("Error updating location:", error);
  }
};

export const addAdventureToFirebase = async (
  db: Database,
  userId: string,
  friendId: string,
  adventure: Adventure
) => {
  try {
    const adventureRef = ref(
      db,
      `users/${userId}/friends/${friendId}/adventures/${adventure.id}`
    );
    await set(adventureRef, adventure);
  } catch (error) {
    console.error("Error adding adventure:", error);
  }
};

export const logoutUser = async (auth: Auth) => {
  try {
    await signOut(auth);
    currentUser = null;
  } catch (error) {
    console.error("Logout error:", error);
  }
};
