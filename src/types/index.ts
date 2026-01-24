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
  description?: string;
  memberIds: string[];
  createdBy: string;
  createdAt: Date;
  isPublic: boolean; // Public groups can be joined by anyone
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
  googleMeetLink?: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  createdAt?: Date;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  skillsRequired: string[];
  tags: string[];
  createdBy: string;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  deadline?: Date;
  maxMembers: number;
  currentMembers: string[];
  createdAt: Date;
}

export interface StudyGroup extends Omit<Group, 'isPublic'> {
  subject: string;
  maxMembers: number;
  isPrivate: boolean; // Inverse of isPublic
  tags: string[];
  meetingSchedule?: {
    frequency: 'weekly' | 'biweekly' | 'monthly';
    dayOfWeek: number;
    time: string;
  };
  // StudyGroupCard uses 'members', but Group uses 'memberIds'. 
  // We'll standardise on memberIds in the interface, component should adapt or we map it.
  // Actually, let's keep it consistent: Group uses memberIds.
}



