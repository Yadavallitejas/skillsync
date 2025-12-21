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
import { User, Match, ChatMessage, ScheduledMeeting, Notification } from '../types';

// Users collection
export const usersCollection = collection(db, 'users');
export const matchesCollection = collection(db, 'matches');
export const chatsCollection = collection(db, 'chats');
export const meetingsCollection = collection(db, 'meetings');
export const notificationsCollection = collection(db, 'notifications');

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
 * Check if a match already exists between two users
 */
export async function matchExists(userId1: string, userId2: string): Promise<Match | null> {
  const q = query(
    matchesCollection,
    where('userIds', 'array-contains', userId1)
  );
  const snapshot = await getDocs(q);
  
  const existingMatch = snapshot.docs.find(doc => {
    const data = doc.data();
    return data.userIds.includes(userId1) && data.userIds.includes(userId2);
  });
  
  if (existingMatch) {
    return { id: existingMatch.id, ...existingMatch.data() } as Match;
  }
  return null;
}

/**
 * Create a match between two users (only if it doesn't already exist)
 */
export async function createMatch(
  userId1: string, 
  userId2: string, 
  score: number, 
  requestMessage?: string
): Promise<string | null> {
  // Check if match already exists
  const existingMatch = await matchExists(userId1, userId2);
  if (existingMatch) {
    return existingMatch.id; // Return existing match ID
  }
  
  const matchRef = doc(matchesCollection);
  const matchData: Omit<Match, 'id'> = {
    userIds: [userId1, userId2],
    score,
    status: 'pending',
    requestedBy: userId1,
    requestMessage: requestMessage || undefined,
    createdAt: new Date(),
  };
  await setDoc(matchRef, matchData);
  
  // Create notification for the recipient
  await createNotification({
    userId: userId2,
    type: 'connection_request',
    title: 'New Connection Request',
    message: requestMessage || 'Someone wants to connect with you!',
    matchId: matchRef.id,
    read: false,
  });
  
  return matchRef.id;
}

/**
 * Accept a connection request
 */
export async function acceptMatch(matchId: string): Promise<void> {
  const matchRef = doc(db, 'matches', matchId);
  const matchDoc = await getDoc(matchRef);
  
  if (!matchDoc.exists()) {
    throw new Error('Match not found');
  }
  
  const matchData = matchDoc.data() as Match;
  const requestingUserId = matchData.requestedBy;
  
  // Update match status to active
  await updateDoc(matchRef, { status: 'active' });
  
  // Create notification for the requester
  await createNotification({
    userId: requestingUserId,
    type: 'connection_accepted',
    title: 'Connection Accepted',
    message: 'Your connection request has been accepted!',
    matchId: matchId,
    read: false,
  });
}

/**
 * Reject a connection request
 */
export async function rejectMatch(matchId: string): Promise<void> {
  await updateDoc(doc(db, 'matches', matchId), { status: 'rejected' });
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

/**
 * Create a scheduled meeting
 */
export async function createScheduledMeeting(
  meeting: Omit<ScheduledMeeting, 'id' | 'createdAt'>,
  peerUserId: string,
  peerName: string
): Promise<string> {
  const meetingRef = doc(meetingsCollection);
  await setDoc(meetingRef, {
    ...meeting,
    scheduledFor: meeting.scheduledFor,
    createdAt: serverTimestamp(),
  });
  
  // Create notification for the peer
  const meetingDate = meeting.scheduledFor.toLocaleDateString();
  const meetingTime = meeting.scheduledFor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  await createNotification({
    userId: peerUserId,
    type: 'meeting_scheduled',
    title: 'New Meeting Scheduled',
    message: `${peerName} scheduled a ${meeting.meetingType} meeting for ${meetingDate} at ${meetingTime}`,
    matchId: meeting.matchId,
    meetingId: meetingRef.id,
    read: false,
  });
  
  return meetingRef.id;
}

/**
 * Get scheduled meetings for a match
 */
export async function getMatchMeetings(matchId: string): Promise<ScheduledMeeting[]> {
  const q = query(
    meetingsCollection,
    where('matchId', '==', matchId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    scheduledFor: doc.data().scheduledFor?.toDate ? doc.data().scheduledFor.toDate() : new Date(doc.data().scheduledFor),
    createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
  })) as ScheduledMeeting[];
}

/**
 * Create a notification
 */
export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
  const notificationRef = doc(notificationsCollection);
  await setDoc(notificationRef, {
    ...notification,
    createdAt: serverTimestamp(),
  });
  return notificationRef.id;
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const q = query(
    notificationsCollection,
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
  })) as Notification[];
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
}

/**
 * Subscribe to user notifications (real-time)
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): () => void {
  const q = query(
    notificationsCollection,
    where('userId', '==', userId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
    })) as Notification[];
    // Sort by createdAt (newest first)
    notifications.sort((a, b) => {
      const aTime = a.createdAt?.getTime() || 0;
      const bTime = b.createdAt?.getTime() || 0;
      return bTime - aTime;
    });
    callback(notifications);
  });
}

