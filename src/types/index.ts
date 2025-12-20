export interface User {
  uid: string;
  name: string;
  email: string;
  avatar?: string;
  major: string;
  skillsOffered: string[];
  skillsNeeded: string[];
  createdAt?: Date;
}

export interface Match {
  id: string;
  userIds: [string, string];
  score: number;
  status: 'pending' | 'active';
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

