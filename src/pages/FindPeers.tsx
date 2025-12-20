import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getAllUsers, createMatch } from '../services/firestore';
import { calculateMatchScore, calculateMatchPercentage } from '../utils/matching';
import { User } from '../types';
import { User as UserIcon, MessageSquare } from 'lucide-react';

interface PeerWithScore extends User {
  matchScore: number;
  matchPercentage: number;
}

export function FindPeers() {
  const { currentUser, userProfile } = useAuth();
  const [peers, setPeers] = useState<PeerWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile) return;

    const fetchPeers = async () => {
      try {
        const allUsers = await getAllUsers();
        // Filter out current user and users without complete profiles
        const otherUsers = allUsers.filter(
          (user) => user.uid !== currentUser?.uid && user.major && user.major.length > 0
        );

        // Calculate match scores
        const peersWithScores: PeerWithScore[] = otherUsers.map((user) => {
          const score = calculateMatchScore(userProfile, user);
          const percentage = calculateMatchPercentage(userProfile, user);
          return {
            ...user,
            matchScore: score,
            matchPercentage: percentage,
          };
        });

        // Sort by match percentage (highest first)
        peersWithScores.sort((a, b) => b.matchPercentage - a.matchPercentage);

        setPeers(peersWithScores);
      } catch (error) {
        console.error('Error fetching peers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPeers();
  }, [currentUser, userProfile]);

  const handleConnect = async (peerId: string) => {
    if (!currentUser || !userProfile) return;

    setConnecting(peerId);
    try {
      const peer = peers.find((p) => p.uid === peerId);
      if (peer) {
        const score = calculateMatchScore(userProfile, peer);
        await createMatch(currentUser.uid, peerId, score);
        alert('Connection request sent! Check your Chat to start messaging.');
      }
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Failed to connect. Please try again.');
    } finally {
      setConnecting(null);
    }
  };

  if (!userProfile || !userProfile.major) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Please complete your profile to find peers.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading potential study partners...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Find Study Partners</h1>
        <p className="text-gray-600">
          Discover students who match your learning needs based on your skills
        </p>
      </div>

      {peers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-600">No peers found. Try updating your skills!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {peers.map((peer) => (
            <div
              key={peer.uid}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {peer.avatar ? (
                    <img
                      src={peer.avatar}
                      alt={peer.name}
                      className="h-12 w-12 rounded-full"
                    />
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
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">
                    {peer.matchPercentage}%
                  </div>
                  <div className="text-xs text-gray-500">Match</div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Can Teach:</p>
                  <div className="flex flex-wrap gap-1">
                    {peer.skillsOffered.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {peer.skillsOffered.length > 3 && (
                      <span className="px-2 py-0.5 text-gray-500 text-xs">
                        +{peer.skillsOffered.length - 3}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Needs Help:</p>
                  <div className="flex flex-wrap gap-1">
                    {peer.skillsNeeded.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {peer.skillsNeeded.length > 3 && (
                      <span className="px-2 py-0.5 text-gray-500 text-xs">
                        +{peer.skillsNeeded.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleConnect(peer.uid)}
                disabled={connecting === peer.uid}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{connecting === peer.uid ? 'Connecting...' : 'Connect'}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

