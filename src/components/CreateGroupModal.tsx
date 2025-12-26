import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserMatches, getUser, createGroup } from '../services/firestore';
import { User } from '../types';
import { X, Check, Search, User as UserIcon } from 'lucide-react';

interface CreateGroupModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateGroupModal({ onClose, onSuccess }: CreateGroupModalProps) {
    const { currentUser } = useAuth();
    const [connections, setConnections] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchConnections = async () => {
            if (!currentUser) return;
            try {
                const matches = await getUserMatches(currentUser.uid);
                const activeMatches = matches.filter(m => m.status === 'active');

                const peers = await Promise.all(
                    activeMatches.map(async (match) => {
                        const peerId = match.userIds.find(id => id !== currentUser.uid);
                        if (!peerId) return null;
                        return await getUser(peerId);
                    })
                );

                setConnections(peers.filter((p): p is User => p !== null));
            } catch (error) {
                console.error('Error fetching connections:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConnections();
    }, [currentUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !groupName.trim() || selectedUsers.length === 0) return;

        setSubmitting(true);
        try {
            await createGroup(groupName.trim(), selectedUsers, currentUser.uid);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Failed to create group. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleUser = (userId: string) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const filteredConnections = connections.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.major.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] flex flex-col">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Create New Group</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col p-4 space-y-4">
                    <div>
                        <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">
                            Group Name
                        </label>
                        <input
                            type="text"
                            id="groupName"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="e.g. Study Group A"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            required
                        />
                    </div>

                    <div className="flex-1 flex flex-col h-full min-h-0">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Members ({selectedUsers.length})
                        </label>

                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search connections..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-200">
                            {loading ? (
                                <div className="p-4 text-center text-gray-500">Loading connections...</div>
                            ) : filteredConnections.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">No connections found</div>
                            ) : (
                                filteredConnections.map(user => (
                                    <div
                                        key={user.uid}
                                        onClick={() => toggleUser(user.uid)}
                                        className={`p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${selectedUsers.includes(user.uid) ? 'bg-primary-50' : ''}`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                                                    <UserIcon className="w-4 h-4 text-primary-600" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.major}</p>
                                            </div>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedUsers.includes(user.uid) ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                                            {selectedUsers.includes(user.uid) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || !groupName.trim() || selectedUsers.length === 0}
                        className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {submitting ? 'Creating...' : 'Create Group'}
                    </button>
                </form>
            </div>
        </div>
    );
}
