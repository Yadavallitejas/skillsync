import { useState, useEffect } from 'react';
import { Plus, BookOpen, Users, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getPublicStudyGroups, getUserStudyGroups, joinStudyGroup, leaveStudyGroup } from '../services/firestore';
import { StudyGroup } from '../types';
import { StudyGroupCard } from '../components/StudyGroupCard';
import { CreateStudyGroupModal } from '../components/CreateStudyGroupModal';

export function StudyGroups() {
  const { currentUser } = useAuth();
  const [publicGroups, setPublicGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'public' | 'my'>('public');

  const fetchStudyGroups = async () => {
    if (!currentUser) return;

    try {
      const [publicGroupsData, myGroupsData] = await Promise.all([
        getPublicStudyGroups(),
        getUserStudyGroups(currentUser.uid)
      ]);

      setPublicGroups(publicGroupsData);
      setMyGroups(myGroupsData);
    } catch (error) {
      console.error('Error fetching study groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyGroups();
  }, [currentUser]);

  const handleJoinGroup = async (groupId: string) => {
    if (!currentUser) return;

    try {
      await joinStudyGroup(groupId, currentUser.uid);
      await fetchStudyGroups(); // Refresh groups
    } catch (error) {
      console.error('Error joining study group:', error);
      alert(error instanceof Error ? error.message : 'Failed to join study group');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!currentUser) return;

    try {
      await leaveStudyGroup(groupId, currentUser.uid);
      await fetchStudyGroups(); // Refresh groups
    } catch (error) {
      console.error('Error leaving study group:', error);
      alert('Failed to leave study group');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading study groups...</p>
        </div>
      </div>
    );
  }

  const displayGroups = activeTab === 'public' ? publicGroups : myGroups;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Groups</h1>
          <p className="mt-2 text-gray-600">
            Join subject-specific groups for collaborative learning and exam prep
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('public')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'public'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Public Groups ({publicGroups.length})
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Groups ({myGroups.length})
          </button>
        </nav>
      </div>

      {displayGroups.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'public' ? 'No public groups available' : 'No groups yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {activeTab === 'public' 
              ? 'Be the first to create a study group!'
              : 'Create or join study groups to start collaborative learning.'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Study Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayGroups.map((group) => (
            <StudyGroupCard
              key={group.id}
              studyGroup={group}
              currentUserId={currentUser?.uid || ''}
              onJoin={() => group.id && handleJoinGroup(group.id)}
              onLeave={() => group.id && handleLeaveGroup(group.id)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateStudyGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchStudyGroups();
          }}
        />
      )}
    </div>
  );
}