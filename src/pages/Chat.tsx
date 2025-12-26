import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { subscribeToUserMatches, subscribeToChat, sendMessage, getOrCreateChat, acceptMatch, rejectMatch, createNotification, subscribeToUserGroups, sendGroupMessage } from '../services/firestore';
import { Match, ChatMessage, User, Group } from '../types';
import { getUser } from '../services/firestore';
import { MessageSquare, Send, Calendar, Plus, Users as UsersIcon } from 'lucide-react';
import { ScheduleMeeting } from '../components/ScheduleMeeting';
import { ChatSidebarItem } from '../components/ChatSidebarItem';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { AddGroupMemberModal } from '../components/AddGroupMemberModal';

export function Chat() {
  const { currentUser, userProfile } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [viewMode, setViewMode] = useState<'chats' | 'groups'>('chats');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [peerUser, setPeerUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showScheduleMeeting, setShowScheduleMeeting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToUserMatches(currentUser.uid, (updatedMatches) => {
      // Deduplicate matches by peer ID
      const uniqueMatchesMap = new Map<string, Match>();

      updatedMatches.forEach(match => {
        const peerId = match.userIds.find(id => id !== currentUser.uid);
        if (peerId) {
          const existing = uniqueMatchesMap.get(peerId);
          if (!existing) {
            uniqueMatchesMap.set(peerId, match);
          } else {
            // If we have duplicate, prefer 'active' over 'pending'
            if (existing.status === 'pending' && match.status === 'active') {
              uniqueMatchesMap.set(peerId, match);
            }
          }
        }
      });

      const uniqueMatches = Array.from(uniqueMatchesMap.values());
      setMatches(uniqueMatches);
      setLoading(false);

      // Auto-select first match if none selected
      if (!selectedMatch && uniqueMatches.length > 0) {
        setSelectedMatch(uniqueMatches[0]);
      }
    });



    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToUserGroups(currentUser.uid, (updatedGroups) => {
      setGroups(updatedGroups);
    });
    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    const activeId = viewMode === 'chats' ? selectedMatch?.id : selectedGroup?.id;
    if (!activeId || !currentUser) return;

    if (viewMode === 'chats' && selectedMatch) {
      // Get peer user for 1:1
      const peerId = selectedMatch.userIds.find((id) => id !== currentUser.uid);
      if (peerId) getUser(peerId).then(setPeerUser);
    }

    // Subscribe to chat messages
    const unsubscribe = subscribeToChat(activeId, (updatedMessages) => {
      setMessages(updatedMessages);
    });

    // Ensure chat document exists (handled by getOrCreateChat on server/client side usually, calling here to be safe)
    getOrCreateChat(activeId);

    return unsubscribe;
  }, [selectedMatch, selectedGroup, currentUser, viewMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser) return;

    // Group Chat
    if (viewMode === 'groups' && selectedGroup) {
      try {
        await sendGroupMessage(
          selectedGroup.id,
          currentUser.uid,
          userProfile?.name || currentUser.displayName || 'User',
          messageText.trim()
        );
        setMessageText('');
      } catch (error) {
        console.error('Error sending group message:', error);
        alert('Failed to send message.');
      }
      return;
    }

    // Direct Match Chat
    if (!selectedMatch) return;

    // Only allow messaging if match is active
    if (selectedMatch.status !== 'active') {
      alert('This connection is still pending. Please wait for the other user to accept your request.');
      return;
    }

    try {
      await sendMessage(selectedMatch.id, currentUser.uid, messageText.trim());

      // Create notification for peer
      if (peerUser) {
        await createNotification({
          userId: peerUser.uid,
          type: 'new_message',
          title: `New message from ${userProfile?.name || currentUser.displayName || 'User'}`,
          message: messageText.trim().substring(0, 50) + (messageText.trim().length > 50 ? '...' : ''),
          matchId: selectedMatch.id,
          read: false
        });
      }

      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleAcceptMatch = async () => {
    if (!selectedMatch) return;
    try {
      await acceptMatch(selectedMatch.id);
      // Manually update selected match status to immediately reflect change in UI
      // while we wait for subscription to update the full list
      setSelectedMatch(prev => prev ? ({ ...prev, status: 'active' } as Match) : null);

      alert('Connection accepted! You can now chat.');
    } catch (error) {
      console.error('Error accepting match:', error);
      alert('Failed to accept connection.');
    }
  };

  const handleRejectMatch = async () => {
    if (!selectedMatch) return;
    if (window.confirm('Are you sure you want to decline this connection?')) {
      try {
        await rejectMatch(selectedMatch.id);
        setSelectedMatch(null);
      } catch (error) {
        console.error('Error rejecting match:', error);
      }
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
            <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('chats')}
                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${viewMode === 'chats' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                Direct
              </button>
              <button
                onClick={() => setViewMode('groups')}
                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${viewMode === 'groups' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                Groups
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {viewMode === 'chats' ? (
              matches.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No matches yet. Go to Find Peers to connect!
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {matches.map((match) => (
                    <ChatSidebarItem
                      key={match.id}
                      match={match}
                      currentUserId={currentUser.uid}
                      isSelected={selectedMatch?.id === match.id}
                      onClick={() => {
                        setSelectedMatch(match);
                        setSelectedGroup(null);
                      }}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  {groups.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No groups yet. Create one!
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {groups.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => {
                            setSelectedGroup(group);
                            setSelectedMatch(null);
                          }}
                          className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedGroup?.id === group.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                            }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <UsersIcon className="h-5 w-5 text-indigo-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{group.name}</div>
                                <div className="text-xs text-gray-500">{group.memberIds.length} members</div>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Group</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {(selectedMatch && peerUser) || selectedGroup ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedGroup ? (
                    <>
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <UsersIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedGroup.name}</h3>
                        <p className="text-sm text-gray-600">{selectedGroup.memberIds.length} members</p>
                      </div>
                      <button
                        onClick={() => setShowAddMember(true)}
                        className="ml-2 p-1 text-primary-600 hover:bg-primary-50 rounded-full"
                        title="Add Member"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </>
                  ) : peerUser ? (
                    <>
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
                    </>
                  ) : null}
                </div>
                {selectedMatch && (
                  <button
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center space-x-2"
                    onClick={() => setShowScheduleMeeting(true)}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Schedule Meeting</span>
                  </button>
                )}
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
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isOwn
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                        >
                          {selectedGroup && !isOwn && (
                            <p className="text-xs text-gray-500 mb-1">{message.senderId === currentUser.uid ? 'You' : 'Member ' + message.senderId.slice(0, 4)}</p>
                          )}
                          <p className="text-sm">{message.text}</p>
                          <p
                            className={`text-xs mt-1 ${isOwn ? 'text-primary-100' : 'text-gray-500'
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
              {selectedMatch && selectedMatch.status === 'pending' ? (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  {selectedMatch.requestedBy === currentUser.uid ? (
                    <div className="text-center text-gray-500 py-2">
                      <p>Waiting for {peerUser?.name} to accept your request.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-3">
                      <p className="text-gray-900 font-medium">
                        {peerUser?.name} wants to connect with you.
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedMatch.requestMessage}
                      </p>
                      <div className="flex space-x-3 w-full max-w-sm justify-center">
                        <button
                          onClick={handleRejectMatch}
                          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          onClick={handleAcceptMatch}
                          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors shadow-sm"
                        >
                          Accept Request
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
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
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              {viewMode === 'chats' ? (
                matches.length === 0 ? (
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No matches yet. Go to Find Peers to connect!</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Select a match to start chatting</p>
                  </div>
                )
              ) : (
                groups.length === 0 ? (
                  <div className="text-center">
                    <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No groups created yet.</p>
                    <button onClick={() => setShowCreateGroup(true)} className="mt-2 text-primary-600 font-medium">Create one now</button>
                  </div>
                ) : (
                  <div className="text-center">
                    <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Select a group to start chatting</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {
        showScheduleMeeting && selectedMatch && peerUser && (
          <ScheduleMeeting
            matchId={selectedMatch.id}
            peerName={peerUser.name}
            peerUserId={peerUser.uid}
            onClose={() => setShowScheduleMeeting(false)}
            onSuccess={() => {
              alert('Meeting scheduled successfully! The other user has been notified.');
              setShowScheduleMeeting(false);
            }}
          />
        )
      }

      {/* Create Group Modal */}
      {
        showCreateGroup && (
          <CreateGroupModal
            onClose={() => setShowCreateGroup(false)}
            onSuccess={() => {
              // Groups will auto-update via subscription
              setShowCreateGroup(false);
            }}
          />
        )
      }
    </div >
  );
}

