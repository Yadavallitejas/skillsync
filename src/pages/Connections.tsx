import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserMatches, getUser, deleteMatch } from '../services/firestore';
import { Match, User } from '../types';
import { Link } from 'react-router-dom';
import { MessageSquare, User as UserIcon, UserMinus } from 'lucide-react';

export function Connections() {
    const { currentUser } = useAuth();
    const [connections, setConnections] = useState<{ match: Match; peer: User }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConnections = async () => {
            if (!currentUser) return;

            try {
                const matches = await getUserMatches(currentUser.uid);
                const activeMatches = matches.filter(m => m.status === 'active');

                const connectionsData = await Promise.all(
                    activeMatches.map(async (match) => {
                        const peerId = match.userIds.find(id => id !== currentUser.uid);
                        if (!peerId) return null;
                        const peer = await getUser(peerId);
                        return peer ? { match, peer } : null;
                    })
                );

                setConnections(connectionsData.filter(Boolean) as { match: Match; peer: User }[]);
            } catch (error) {
                console.error('Error fetching connections:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConnections();
    }, [currentUser]);

    const handleRemoveConnection = async (matchId: string, peerName: string) => {
        if (window.confirm(`Are you sure you want to remove ${peerName} from your connections?`)) {
            try {
                await deleteMatch(matchId);
                setConnections(connections.filter(c => c.match.id !== matchId));
            } catch (error) {
                console.error('Error removing connection:', error);
                alert('Failed to remove connection.');
            }
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-gray-500">Loading connections...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">My Connections</h1>
                <p className="text-gray-600 mt-1">People you are connected with</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connections.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl">
                        <p className="text-gray-500">No connections yet. Find peers to connect!</p>
                        <Link to="/find-peers" className="mt-4 inline-block text-primary-600 font-medium">Find Peers &rarr;</Link>
                    </div>
                ) : (
                    connections.map(({ match, peer }) => (
                        <div key={match.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                {peer.avatar ? (
                                    <img src={peer.avatar} alt={peer.name} className="h-12 w-12 rounded-full" />
                                ) : (
                                    <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                                        <UserIcon className="h-6 w-6 text-primary-600" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-gray-900">{peer.name}</h3>
                                    <p className="text-sm text-gray-600">{peer.major}</p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <Link to="/chat" className="p-2 text-gray-400 hover:text-primary-600 transition-colors" title="Chat">
                                    <MessageSquare className="h-5 w-5" />
                                </Link>
                                <button
                                    onClick={() => handleRemoveConnection(match.id, peer.name)}
                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Remove Connection"
                                >
                                    <UserMinus className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
