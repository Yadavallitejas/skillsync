import { useState, useEffect } from 'react';
import { Match, User } from '../types';
import { getUser } from '../services/firestore';
import { MessageSquare } from 'lucide-react';

interface ChatSidebarItemProps {
    match: Match;
    currentUserId: string;
    isSelected: boolean;
    onClick: () => void;
}

export function ChatSidebarItem({ match, currentUserId, isSelected, onClick }: ChatSidebarItemProps) {
    const [peer, setPeer] = useState<User | null>(null);

    useEffect(() => {
        const peerId = match.userIds.find(id => id !== currentUserId);
        if (peerId) {
            getUser(peerId).then(setPeer);
        }
    }, [match, currentUserId]);

    const displayName = peer ? peer.name : `User ${match.userIds.find(id => id !== currentUserId)?.slice(0, 5)}`;

    return (
        <button
            onClick={onClick}
            className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${isSelected ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                }`}
        >
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2 overflow-hidden">
                    {peer?.avatar ? (
                        <img src={peer.avatar} alt={displayName} className="h-6 w-6 rounded-full flex-shrink-0" />
                    ) : (
                        <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="h-3 w-3 text-primary-600" />
                        </div>
                    )}
                    <span className="font-medium text-gray-900 truncate">
                        {displayName}
                    </span>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">Score: {match.score}</span>
            </div>
            <p className="text-sm text-gray-600 capitalize pl-8 truncate">{match.status === 'pending' ? (match.requestedBy === currentUserId ? 'Sent Request' : 'Received Request') : match.status}</p>
        </button>
    );
}
