export interface User {
  uid: string;
  name: string;
  email: string;
  avatar?: string;
  major: string;
  collegeName?: string;
  skillsOffered: string[];
  skillsNeeded: string[];
  createdAt?: Date;
}

export interface Match {
  id: string;
  userIds: [string, string];
  score: number;
  status: 'pending' | 'active';
  requestedBy: string; // User who sent the request
  requestMessage?: string; // Optional message with the request
  createdAt?: Date;
}

export interface Group {
  id: string;
  name: string;
  memberIds: string[];
  createdBy: string;
  createdAt: Date;
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
  };
}

export interface Notification {
  id?: string;
  userId: string; // User who receives the notification
  type: 'connection_request' | 'connection_accepted' | 'meeting_scheduled' | 'meeting_accepted' | 'meeting_rejected' | 'new_message';
  title: string;
  message: string;
  matchId?: string;
  meetingId?: string;
  read: boolean;
  createdAt?: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export interface Chat {
  matchId: string;
  messages: ChatMessage[];
}

export interface ScheduledMeeting {
  id?: string;
  matchId: string;
  requestedBy: string;
  scheduledFor: Date;
  duration: number; // in minutes
  meetingType: 'video' | 'in-person' | 'text';
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  createdAt?: Date;
}

