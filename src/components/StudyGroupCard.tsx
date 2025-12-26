import { useState, useEffect } from 'react';
import { Users, Clock, Tag, User, BookOpen, Lock } from 'lucide-react';
import { StudyGroup, User as UserType } from '../types';
import { getUser } from '../services/firestore';

interface StudyGroupCardProps {
  studyGroup: StudyGroup;
  currentUserId: string;
  onJoin: () => void;
  onLeave: () => void;
}

export function StudyGroupCard({ studyGroup, currentUserId, onJoin, onLeave }: StudyGroupCardProps) {
  const [creator, setCreator] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCreator = async () => {
      try {
        const creatorData = await getUser(studyGroup.createdBy);
        setCreator(creatorData);
      } catch (error) {
        console.error('Error fetching study group creator:', error);
      }
    };

    fetchCreator();
  }, [studyGroup.createdBy]);

  const isCreator = studyGroup.createdBy === currentUserId;
  const isMember = studyGroup.members.includes(currentUserId);
  const canJoin = !isCreator && !isMember && studyGroup.members.length < studyGroup.maxMembers;

  const formatMeetingSchedule = () => {
    if (!studyGroup.meetingSchedule) return 'No regular meetings';
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[studyGroup.meetingSchedule.dayOfWeek];
    const frequency = studyGroup.meetingSchedule.frequency;
    const time = studyGroup.meetingSchedule.time;
    
    return `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} on ${dayName}s at ${time}`;
  };

  const handleAction = async () => {
    setLoading(true);
    try {
      if (isMember) {
        onLeave();
      } else if (canJoin) {
        onJoin();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{studyGroup.name}</h3>
            {studyGroup.isPrivate && (
              <Lock className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <div className="flex items-center text-sm text-blue-600 mb-2">
            <BookOpen className="w-4 h-4 mr-1" />
            {studyGroup.subject}
          </div>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{studyGroup.description}</p>

      {/* Tags */}
      {studyGroup.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {studyGroup.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600"
              >
                #{tag}
              </span>
            ))}
            {studyGroup.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                +{studyGroup.tags.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Group Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-500">
          <User className="w-4 h-4 mr-2" />
          Created by {creator?.name || 'Loading...'}
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <Users className="w-4 h-4 mr-2" />
          {studyGroup.members.length}/{studyGroup.maxMembers} members
        </div>

        <div className="flex items-center text-sm text-gray-500">
          <Clock className="w-4 h-4 mr-2" />
          {formatMeetingSchedule()}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {/* Show member avatars (placeholder) */}
          {studyGroup.members.slice(0, 3).map((memberId, index) => (
            <div
              key={memberId}
              className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600"
            >
              {index + 1}
            </div>
          ))}
          {studyGroup.members.length > 3 && (
            <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
              +{studyGroup.members.length - 3}
            </div>
          )}
        </div>

        {!isCreator && (
          <button
            onClick={handleAction}
            disabled={loading || (!canJoin && !isMember)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isMember
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : canJoin
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Loading...' : isMember ? 'Leave' : canJoin ? 'Join' : 'Full'}
          </button>
        )}

        {isCreator && (
          <span className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md">
            Your Group
          </span>
        )}
      </div>
    </div>
  );
}