import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { subscribeToUserMatches, subscribeToChat, sendMessage, getOrCreateChat, updateMatchStatus } from '../services/firestore';
import { Match, ChatMessage, User } from '../types';
import { getUser } from '../services/firestore';
import { MessageSquare, Send, Calendar } from 'lucide-react';

export function Chat() {
  const { currentUser } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [peerUser, setPeerUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToUserMatches(currentUser.uid, (updatedMatches) => {
      setMatches(updatedMatches);
      setLoading(false);
      
      // Auto-select first match if none selected
      if (!selectedMatch && updatedMatches.length > 0) {
        setSelectedMatch(updatedMatches[0]);
      }
    });

    return unsubscribe;
  }, [currentUser, selectedMatch]);

  useEffect(() => {
    if (!selectedMatch || !currentUser) return;

    // Get the peer user ID
    const peerId = selectedMatch.userIds.find((id) => id !== currentUser.uid);
    if (!peerId) return;

    // Fetch peer user info
    getUser(peerId).then(setPeerUser);

    // Subscribe to chat messages
    const unsubscribe = subscribeToChat(selectedMatch.id, (updatedMessages) => {
      setMessages(updatedMessages);
    });

    // Ensure chat document exists
    getOrCreateChat(selectedMatch.id);

    return unsubscribe;
  }, [selectedMatch, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedMatch || !currentUser) return;

    try {
      await sendMessage(selectedMatch.id, currentUser.uid, messageText.trim());
      setMessageText('');
      
      // Activate match if it's still pending
      if (selectedMatch.status === 'pending') {
        await updateMatchStatus(selectedMatch.id, 'active');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please sign in to access chat.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading your matches...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
      <div className="flex h-full">
        {/* Sidebar - Matches List */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Matches</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {matches.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No matches yet. Go to Find Peers to connect!
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {matches.map((match) => {
                  return (
                    <button
                      key={match.id}
                      onClick={() => setSelectedMatch(match)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedMatch?.id === match.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">
                          Match #{match.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-gray-500">Score: {match.score}</span>
                      </div>
                      <p className="text-sm text-gray-600 capitalize">{match.status}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedMatch && peerUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {peerUser.avatar ? (
                    <img
                      src={peerUser.avatar}
                      alt={peerUser.name}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-primary-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{peerUser.name}</h3>
                    <p className="text-sm text-gray-600">{peerUser.major}</p>
                  </div>
                </div>
                <button
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center space-x-2"
                  onClick={() => alert('Schedule Session feature coming soon!')}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Schedule Session</span>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.senderId === currentUser.uid;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwn
                              ? 'bg-primary-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? 'text-primary-100' : 'text-gray-500'
                            }`}
                          >
                            {new Date(message.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              {matches.length === 0 ? (
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No matches yet. Go to Find Peers to connect!</p>
                </div>
              ) : (
                <p>Select a match to start chatting</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

