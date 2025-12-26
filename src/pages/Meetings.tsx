import { useState, useEffect } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getUserMatches, getMatchMeetings, getUser } from '../services/firestore';
import { Match, ScheduledMeeting, User } from '../types';
import { MeetingCard } from '../components/MeetingCard';

export function Meetings() {
  const { currentUser } = useAuth();
  const [meetings, setMeetings] = useState<(ScheduledMeeting & { peerUser: User })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeetings = async () => {
    if (!currentUser) return;

    try {
      // Get all user matches
      const matches = await getUserMatches(currentUser.uid);
      const activeMatches = matches.filter(match => match.status === 'active');

      // Get meetings for each match
      const allMeetings: (ScheduledMeeting & { peerUser: User })[] = [];
      
      for (const match of activeMatches) {
        const matchMeetings = await getMatchMeetings(match.id);
        
        // Get peer user info
        const peerId = match.userIds.find(id => id !== currentUser.uid);
        if (!peerId) continue;
        
        const peerUser = await getUser(peerId);
        if (!peerUser) continue;

        // Add peer user info to each meeting
        const meetingsWithPeer = matchMeetings.map(meeting => ({
          ...meeting,
          peerUser
        }));

        allMeetings.push(...meetingsWithPeer);
      }

      // Sort meetings by date (upcoming first)
      allMeetings.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
      
      setMeetings(allMeetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [currentUser]);

  const upcomingMeetings = meetings.filter(meeting => 
    meeting.scheduledFor > new Date() && 
    (meeting.status === 'pending' || meeting.status === 'accepted')
  );

  const pastMeetings = meetings.filter(meeting => 
    meeting.scheduledFor <= new Date() || 
    meeting.status === 'completed' || 
    meeting.status === 'cancelled' || 
    meeting.status === 'rejected'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading meetings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Meetings</h1>
          <p className="mt-2 text-gray-600">
            Manage your scheduled learning sessions and meetings
          </p>
        </div>
        <Calendar className="w-8 h-8 text-primary-600" />
      </div>

      {meetings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings scheduled</h3>
          <p className="text-gray-600 mb-6">
            Start by connecting with peers and scheduling learning sessions in the Chat section.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Meetings */}
          {upcomingMeetings.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Upcoming Meetings ({upcomingMeetings.length})
              </h2>
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    peerUser={meeting.peerUser}
                    onUpdate={fetchMeetings}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Meetings */}
          {pastMeetings.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Past Meetings ({pastMeetings.length})
              </h2>
              <div className="space-y-4">
                {pastMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    peerUser={meeting.peerUser}
                    onUpdate={fetchMeetings}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}