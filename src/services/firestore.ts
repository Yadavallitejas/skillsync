import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, Match, ChatMessage } from '../types';

// Users collection
export const usersCollection = collection(db, 'users');
export const matchesCollection = collection(db, 'matches');
export const chatsCollection = collection(db, 'chats');

/**
 * Get user document by UID
 */
export async function getUser(uid: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    return { uid: userDoc.id, ...userDoc.data() } as User;
  }
  return null;
}

/**
 * Create or update user document
 */
export async function createOrUpdateUser(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    // Update existing user - preserve createdAt
    await updateDoc(userRef, {
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      major: user.major,
      skillsOffered: user.skillsOffered,
      skillsNeeded: user.skillsNeeded,
      updatedAt: serverTimestamp(),
    });
  } else {
    // Create new user
    await setDoc(userRef, {
      ...user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Subscribe to user profile changes (real-time)
 */
export function subscribeToUserProfile(
  uid: string,
  callback: (user: User | null) => void
): () => void {
  const userRef = doc(db, 'users', uid);
  
  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const userData = { uid: snapshot.id, ...snapshot.data() } as User;
      callback(userData);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error subscribing to user profile:', error);
    callback(null);
  });
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
}

/**
 * Create a match between two users
 */
export async function createMatch(userId1: string, userId2: string, score: number): Promise<string> {
  const matchRef = doc(matchesCollection);
  const matchData: Omit<Match, 'id'> = {
    userIds: [userId1, userId2],
    score,
    status: 'pending',
    createdAt: new Date(),
  };
  await setDoc(matchRef, matchData);
  return matchRef.id;
}

/**
 * Get matches for a user
 */
export async function getUserMatches(userId: string): Promise<Match[]> {
  const q = query(
    matchesCollection,
    where('userIds', 'array-contains', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
}

/**
 * Update match status
 */
export async function updateMatchStatus(matchId: string, status: 'pending' | 'active'): Promise<void> {
  await updateDoc(doc(db, 'matches', matchId), { status });
}

/**
 * Get or create chat for a match
 */
export async function getOrCreateChat(matchId: string): Promise<string> {
  const chatRef = doc(db, 'chats', matchId);
  const chatDoc = await getDoc(chatRef);
  
  if (!chatDoc.exists()) {
    await setDoc(chatRef, {
      matchId,
      messages: [],
      createdAt: serverTimestamp(),
    });
  }
  
  return chatRef.id;
}

/**
 * Send a message in a chat
 */
export async function sendMessage(matchId: string, senderId: string, text: string): Promise<void> {
  const chatRef = doc(db, 'chats', matchId);
  const chatDoc = await getDoc(chatRef);
  
  const message: ChatMessage = {
    id: Date.now().toString(),
    senderId,
    text,
    timestamp: new Date(),
  };
  
  if (chatDoc.exists()) {
    const currentMessages = chatDoc.data().messages || [];
    await updateDoc(chatRef, {
      messages: [...currentMessages, message],
    });
  } else {
    await setDoc(chatRef, {
      matchId,
      messages: [message],
      createdAt: serverTimestamp(),
    });
  }
}

/**
 * Subscribe to chat messages (real-time)
 */
export function subscribeToChat(
  matchId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  const chatRef = doc(db, 'chats', matchId);
  
  return onSnapshot(chatRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      const messages = (data.messages || []).map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp),
      })) as ChatMessage[];
      callback(messages);
    } else {
      callback([]);
    }
  });
}

/**
 * Subscribe to user matches (real-time)
 */
export function subscribeToUserMatches(
  userId: string,
  callback: (matches: Match[]) => void
): () => void {
  const q = query(
    matchesCollection,
    where('userIds', 'array-contains', userId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const matches = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
    })) as Match[];
    callback(matches);
  });
}

