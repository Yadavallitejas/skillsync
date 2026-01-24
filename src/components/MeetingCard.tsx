import { useState } from 'react';
import { Calendar, Clock, Video, MapPin, MessageSquare, Check, X, ExternalLink } from 'lucide-react';
import { ScheduledMeeting, User } from '../types';
import { acceptMeeting, rejectMeeting } from '../services/firestore';
import { useAuth } from '../hooks/useAuth';

interface MeetingCardProps {
  meeting: ScheduledMeeting;
  peerUser: User;
  onUpdate: () => void;
}

export function MeetingCard({ meeting, peerUser, onUpdate }: MeetingCardProps) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const isRequester = meeting.requestedBy === currentUser?.uid;
  const canRespond = !isRequester && meeting.status === 'pending';

  const handleAccept = async () => {
    if (!currentUser || !meeting.id) return;
    
    setLoading(true);
    try {
      await acceptMeeting(meeting.id, currentUser.uid);
      onUpdate();
    } catch (error) {
      console.error('Error accepting meeting:', error);
      alert('Failed to accept meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!currentUser || !meeting.id) return;
    
    setLoading(true);
    try {
      await rejectMeeting(meeting.id, currentUser.uid);
      onUpdate();
    } catch (error) {
      console.error('Error rejecting meeting:', error);
      alert('Failed to reject meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const getMeetingTypeIcon = () => {
    switch (meeting.meetingType) {
      case 'video':
        return <Video className="w-5 h-5 text-blue-500" />;
      case 'in-person':
        return <MapPin className="w-5 h-5 text-green-500" />;
      case 'text':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (meeting.status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const { date, time } = formatDateTime(meeting.scheduledFor);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          {getMeetingTypeIcon()}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Meeting with {isRequester ? peerUser.name : 'You'}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
                {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
              </span>
            </div>
            
            <div className="mt-2 space-y-1">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                {date}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                {time} ({meeting.duration} minutes)
              </div>
            </div>

            {meeting.notes && (
              <div className="mt-3">
                <p className="text-sm text-gray-700">
                  <strong>Notes:</strong> {meeting.notes}
                </p>
              </div>
            )}

            {meeting.googleMeetLink && meeting.status === 'accepted' && (
              <div className="mt-3">
                <a
                  href={meeting.googleMeetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Join Google Meet
                </a>
              </div>
            )}
          </div>
        </div>

        {canRespond && (
          <div className="flex space-x-2">
            <button
              onClick={handleAccept}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <Check className="w-4 h-4 mr-1" />
              Accept
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              <X className="w-4 h-4 mr-1" />
              Decline
            </button>
          </div>
        )}
      </div>

      {isRequester && meeting.status === 'pending' && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-md">
          <p className="text-sm text-yellow-800">
            Waiting for {peerUser.name} to respond to your meeting request.
          </p>
        </div>
      )}
    </div>
  );
}