import { useState, useEffect } from 'react';
import { X, UserPlus, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getAllUsers, addGroupMembers } from '../services/firestore';
import { User, Group } from '../types';

interface AddMemberModalProps {
    group: Group;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddMemberModal({ group, onClose, onSuccess }: AddMemberModalProps) {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const allUsers = await getAllUsers();
            // Filter out current members and current user
            const availableUsers = allUsers.filter(
                user => !group.memberIds.includes(user.uid) && user.uid !== currentUser?.uid
            );
            setUsers(availableUsers);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.major.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedUsers.length === 0) return;

        setSubmitting(true);
        try {
            await addGroupMembers(group.id, selectedUsers);
            onSuccess();
        } catch (error) {
            console.error('Error adding members:', error);
            alert('Failed to add members. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Add Members</h2>
                        <p className="text-sm text-gray-600 mt-1">Add members to {group.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-6 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users by name, major, or email..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {searchQuery ? 'No users found matching your search' : 'No available users to add'}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredUsers.map(user => (
                                <button
                                    key={user.uid}
                                    onClick={() => toggleUserSelection(user.uid)}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${selectedUsers.includes(user.uid)
                                            ? 'border-primary-600 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            {user.avatar ? (
                                                <img
                                                    src={user.avatar}
                                                    alt={user.name}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                    <UserPlus className="w-5 h-5 text-primary-600" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-600">{user.major}</div>
                                            </div>
                                        </div>
                                        {selectedUsers.includes(user.uid) && (
                                            <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={selectedUsers.length === 0 || submitting}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>{submitting ? 'Adding...' : 'Add Members'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
