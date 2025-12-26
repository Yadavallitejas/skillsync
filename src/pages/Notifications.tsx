import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { subscribeToNotifications, markNotificationAsRead } from '../services/firestore';
import { Notification } from '../types';
import { Bell, Calendar, Users, MessageSquare, Briefcase, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Notifications() {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = subscribeToNotifications(currentUser.uid, (updatedNotifications) => {
            setNotifications(updatedNotifications);
            setLoading(false);
        });

        return unsubscribe;
    }, [currentUser]);

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await markNotificationAsRead(notificationId);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read && notification.id) {
            await handleMarkAsRead(notification.id);
        }

        // Navigate based on type
        if (notification.type === 'new_message' || notification.type === 'connection_accepted' || notification.type === 'connection_request') {
            navigate('/chat');
        }
        // Add other navigations if needed
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'connection_request':
            case 'connection_accepted':
                return <Users className="w-6 h-6 text-blue-500" />;
            case 'meeting_scheduled':
            case 'meeting_accepted':
            case 'meeting_rejected':
                return <Calendar className="w-6 h-6 text-green-500" />;
            case 'project_invitation':
                return <Briefcase className="w-6 h-6 text-purple-500" />;
            case 'study_group_invitation':
                return <BookOpen className="w-6 h-6 text-orange-500" />;
            case 'new_message':
                return <MessageSquare className="w-6 h-6 text-indigo-500" />;
            default:
                return <Bell className="w-6 h-6 text-gray-500" />;
        }
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-gray-500">Loading notifications...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600 mt-1">Stay updated with your requests, messages, and meetings</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden min-h-[500px]">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Bell className="w-12 h-12 mb-4 text-gray-300" />
                        <p className="text-lg">No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer flex items-start space-x-4 ${!notification.read ? 'bg-blue-50/50' : ''
                                    }`}
                            >
                                <div className="flex-shrink-0 mt-1">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className={`text-base text-gray-900 ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-gray-600 mt-1">{notification.message}</p>
                                        </div>
                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                                            {notification.createdAt && formatTimeAgo(notification.createdAt)}
                                        </span>
                                    </div>
                                </div>
                                {!notification.read && (
                                    <div className="flex-shrink-0 self-center">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
