import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getPublicGroups, joinGroup } from '../services/firestore';
import { Group } from '../types';
import { Users, Globe, UserPlus, Plus } from 'lucide-react';
import { CreateGroupModal } from '../components/CreateGroupModal';

export function PublicGroups() {
    const { currentUser } = useAuth();
    const [publicGroups, setPublicGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
    const [showCreateGroup, setShowCreateGroup] = useState(false);

    useEffect(() => {
        loadPublicGroups();
    }, []);

    const loadPublicGroups = async () => {
        try {
            const groups = await getPublicGroups();
            setPublicGroups(groups);
        } catch (error) {
            console.error('Error loading public groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinGroup = async (groupId: string) => {
        if (!currentUser) return;

        setJoiningGroupId(groupId);
        try {
            await joinGroup(groupId, currentUser.uid);
            await loadPublicGroups();
            alert('Successfully joined the group!');
        } catch (error: any) {
            console.error('Error joining group:', error);
            alert(error.message || 'Failed to join group');
        } finally {
            setJoiningGroupId(null);
        }
    };

    if (!currentUser) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Please sign in to view public groups.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Loading public groups...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <Globe className="w-8 h-8 text-primary-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Public Groups</h1>
                    </div>
                    <p className="text-gray-600">
                        Join public groups to connect with peers who share your interests
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateGroup(true)}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create New Group</span>
                </button>
            </div>

            {publicGroups.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No Public Groups Yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Be the first to create a public group!
                    </p>
                    <button
                        onClick={() => setShowCreateGroup(true)}
                        className="inline-flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create Group</span>
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {publicGroups.map((group) => {
                        const isMember = group.memberIds.includes(currentUser.uid);

                        return (
                            <div
                                key={group.id}
                                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-lg">
                                                {group.name}
                                            </h3>
                                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                <Users className="w-4 h-4" />
                                                <span>{group.memberIds.length} members</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1 text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                                        <Globe className="w-3 h-3" />
                                        <span>Public</span>
                                    </div>
                                </div>

                                {group.description && (
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {group.description}
                                    </p>
                                )}

                                {group.lastMessage && (
                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Last message:</p>
                                        <p className="text-sm text-gray-700 line-clamp-1">
                                            {group.lastMessage.text}
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={() => handleJoinGroup(group.id)}
                                    disabled={isMember || joiningGroupId === group.id}
                                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${isMember
                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                        : 'bg-primary-600 text-white hover:bg-primary-700'
                                        }`}
                                >
                                    {joiningGroupId === group.id ? (
                                        <span>Joining...</span>
                                    ) : isMember ? (
                                        <>
                                            <Users className="w-4 h-4" />
                                            <span>Already a Member</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            <span>Join Group</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {showCreateGroup && (
                <CreateGroupModal
                    onClose={() => setShowCreateGroup(false)}
                    onSuccess={() => {
                        // Refresh the list immediately if the new group is public
                        loadPublicGroups();
                        setShowCreateGroup(false);
                    }}
                />
            )}
        </div>
    );
}
