import { useState, useEffect } from 'react';
import { Users, Calendar, Tag, User, Clock } from 'lucide-react';
import { Project, User as UserType } from '../types';
import { getUser } from '../services/firestore';

interface ProjectCardProps {
  project: Project;
  currentUserId: string;
  onJoin: () => void;
  onLeave: () => void;
}

export function ProjectCard({ project, currentUserId, onJoin, onLeave }: ProjectCardProps) {
  const [creator, setCreator] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCreator = async () => {
      try {
        const creatorData = await getUser(project.createdBy);
        setCreator(creatorData);
      } catch (error) {
        console.error('Error fetching project creator:', error);
      }
    };

    fetchCreator();
  }, [project.createdBy]);

  const isCreator = project.createdBy === currentUserId;
  const isMember = project.currentMembers.includes(currentUserId);
  const canJoin = !isCreator && !isMember && project.currentMembers.length < project.maxMembers;

  const getStatusColor = () => {
    switch (project.status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDeadline = (deadline: Date) => {
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    return deadline.toLocaleDateString();
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </span>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{project.description}</p>

      {/* Skills Required */}
      {project.skillsRequired.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Tag className="w-4 h-4 mr-1" />
            Skills needed:
          </div>
          <div className="flex flex-wrap gap-1">
            {project.skillsRequired.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
              >
                {skill}
              </span>
            ))}
            {project.skillsRequired.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                +{project.skillsRequired.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Project Tags */}
      {project.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600"
              >
                #{tag}
              </span>
            ))}
            {project.tags.length > 2 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                +{project.tags.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Project Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-500">
          <User className="w-4 h-4 mr-2" />
          Created by {creator?.name || 'Loading...'}
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <Users className="w-4 h-4 mr-2" />
          {project.currentMembers.length}/{project.maxMembers} members
        </div>

        {project.deadline && (
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-2" />
            {formatDeadline(project.deadline)}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {/* Show member avatars (placeholder) */}
          {project.currentMembers.slice(0, 3).map((memberId, index) => (
            <div
              key={memberId}
              className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600"
            >
              {index + 1}
            </div>
          ))}
          {project.currentMembers.length > 3 && (
            <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
              +{project.currentMembers.length - 3}
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
            Your Project
          </span>
        )}
      </div>
    </div>
  );
}