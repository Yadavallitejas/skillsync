import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getAllUsers, createMatch, getUserMatches, matchExists } from '../services/firestore';
import { calculateMatchScore, calculateMatchPercentage } from '../utils/matching';
import { User } from '../types';
import { User as UserIcon, MessageSquare, Check } from 'lucide-react';
import { ConnectRequestModal } from '../components/ConnectRequestModal';

interface PeerWithScore extends User {
  matchScore: number;
  matchPercentage: number;
}

export function FindPeers() {
  const { currentUser, userProfile } = useAuth();
  const [peers, setPeers] = useState<PeerWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  // Change existingMatches type to map peerId -> matchStatus
  const [matchStatuses, setMatchStatuses] = useState<Map<string, 'active' | 'pending' | 'requested'>>(new Map());
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<PeerWithScore | null>(null);

  useEffect(() => {
    if (!userProfile || !currentUser) return;

    const fetchPeers = async () => {
      try {
        setLoading(true);
        // Fetch matches to determine status
        const matches = await getUserMatches(currentUser.uid);
        const statuses = new Map<string, 'active' | 'pending' | 'requested'>();

        matches.forEach(match => {
          const peerId = match.userIds.find(id => id !== currentUser.uid);
          if (peerId) {
            if (match.status === 'active') {
              statuses.set(peerId, 'active');
            } else if (match.status === 'pending') {
              // Check who requested
              if (match.requestedBy === currentUser.uid) {
                statuses.set(peerId, 'requested'); // Sent request
              } else {
                statuses.set(peerId, 'pending'); // Received request
              }
            }
          }
        });
        setMatchStatuses(statuses);

        const allUsers = await getAllUsers();
        // Filter out current user and users without complete profiles
        const otherUsers = allUsers.filter(
          (user) => user.uid !== currentUser.uid && user.major && user.major.length > 0
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

    // Add focus listener to refresh data
    const handleFocus = () => {
      fetchPeers();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentUser, userProfile]);

  const handleConnectClick = (peer: PeerWithScore) => {
    const status = matchStatuses.get(peer.uid);
    if (status === 'active') {
      alert('You are already connected with this person! Check your Chat.');
      return;
    }
    if (status === 'requested') {
      alert('You have already sent a request to this person.');
      return;
    }
    if (status === 'pending') {
      alert('This peer has already sent you a request! Check your notifications or chat to accept.');
      return;
    }

    setSelectedPeer(peer);
    setShowRequestModal(true);
  };

  const handleSendRequest = async (message: string) => {
    if (!currentUser || !userProfile || !selectedPeer) return;

    setConnecting(selectedPeer.uid);
    try {
      // Check if match already exists (double-check)
      const existingMatch = await matchExists(currentUser.uid, selectedPeer.uid);
      if (existingMatch) {
        // Re-fetch or simplistic update?
        // Optimistically update to 'active' if we can't tell, usually 'requested' or 'active'
        // Better to alert user to separate existing active vs pending
        alert('A connection already exists!');
        setShowRequestModal(false);
        return;
      }

      const score = calculateMatchScore(userProfile, selectedPeer);
      await createMatch(currentUser.uid, selectedPeer.uid, score, message || undefined);

      setMatchStatuses(prev => new Map(prev).set(selectedPeer.uid, 'requested'));

      setShowRequestModal(false);
      setSelectedPeer(null);
      alert('Connection request sent! The other user will be notified.');
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Failed to send request. Please try again.');
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

  const getButtonContent = (peerId: string) => {
    const status = matchStatuses.get(peerId);
    switch (status) {
      case 'active':
        return (
          <div className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center justify-center space-x-2 cursor-default">
            <Check className="h-4 w-4" />
            <span>Connected</span>
          </div>
        );
      case 'requested':
        return (
          <div className="w-full px-4 py-2 bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center space-x-2 cursor-default">
            <span>Request Sent</span>
          </div>
        );
      case 'pending':
        return (
          <div className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium flex items-center justify-center space-x-2 cursor-default">
            <span>Has Requested You</span>
          </div>
        );
      default:
        return (
          <button
            onClick={() => handleConnectClick(peers.find(p => p.uid === peerId)!)}
            disabled={connecting === peerId}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{connecting === peerId ? 'Sending...' : 'Send Request'}</span>
          </button>
        );
    }
  };

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

              {getButtonContent(peer.uid)}
            </div>
          ))}
        </div>
      )}

      {/* Connect Request Modal */}
      {showRequestModal && selectedPeer && (
        <ConnectRequestModal
          peerName={selectedPeer.name}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedPeer(null);
          }}
          onSend={handleSendRequest}
          loading={connecting === selectedPeer.uid}
        />
      )}
    </div>
  );
}

