import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getAllUsers, createMatch, getUserMatches, matchExists } from '../services/firestore';
import { calculateAIMatchScore } from '../services/aiMatching';
import { User } from '../types';
import { User as UserIcon, MessageSquare, Check, RefreshCw, Sparkles } from 'lucide-react';
import { ConnectRequestModal } from '../components/ConnectRequestModal';

interface PeerWithScore extends User {
  matchScore: number;
  matchPercentage: number;
  isAi?: boolean;
}

export function FindPeers() {
  const { currentUser, userProfile } = useAuth();
  const [peers, setPeers] = useState<PeerWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
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
        const peersWithScores = await Promise.all(otherUsers.map(async (user) => {
          // calculateAIMatchScore now returns { score: number, isAi: boolean }
          const result = await calculateAIMatchScore(userProfile, user);
          return {
            ...user,
            matchScore: result.score,
            matchPercentage: result.score,
            isAi: result.isAi
          };
        }));

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

    const handleFocus = () => {
      if (!loading) fetchPeers();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !loading) fetchPeers();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
      const existingMatch = await matchExists(currentUser.uid, selectedPeer.uid);
      if (existingMatch) {
        alert('A connection already exists!');
        setShowRequestModal(false);
        return;
      }

      // Re-calculate or use existing score
      const result = await calculateAIMatchScore(userProfile, selectedPeer);
      await createMatch(currentUser.uid, selectedPeer.uid, result.score, message || undefined);

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

  const renderPeerCard = (peer: PeerWithScore) => (
    <div
      key={peer.uid}
      className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all ${peer.isAi ? 'border border-primary-100 ring-2 ring-primary-50' : ''}`}
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
          <div className="flex items-center justify-end space-x-1 text-xs text-gray-500">
            {peer.isAi && <Sparkles className="w-3 h-3 text-amber-500" />}
            <span>Match</span>
          </div>
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
  );

  const aiMatches = peers.filter(p => p.isAi);
  const otherMatches = peers.filter(p => !p.isAi);

  // If no AI matches found (fallback mode), treat everything as "suggested"
  const showSeparated = aiMatches.length > 0;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Find Study Partners</h1>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh connection statuses"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
        <p className="text-gray-600">
          Discover students who match your learning needs based on your skills
        </p>
      </div>

      {peers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-600">No peers found. Try updating your skills!</p>
        </div>
      ) : (
        <>
          {showSeparated ? (
            <>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h2 className="text-xl font-bold text-gray-900">AI Recommended Matches</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {aiMatches.map(renderPeerCard)}
                </div>
              </div>

              {otherMatches.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900">Other Peers</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {otherMatches.map(renderPeerCard)}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {peers.map(renderPeerCard)}
            </div>
          )}
        </>
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
