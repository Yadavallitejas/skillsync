import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Search, MessageSquare } from 'lucide-react';

export function Dashboard() {
  const { currentUser, userProfile } = useAuth();

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please sign in to access your dashboard.</p>
      </div>
    );
  }

  if (!userProfile || !userProfile.major) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Please complete your profile to get started.</p>
        <Link
          to="/onboarding"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Complete Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {userProfile.name}!
        </h1>
        <p className="text-gray-600">
          {userProfile.major} • Ready to find your perfect study partner
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/find-peers"
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Search className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Find Peers</h2>
              <p className="text-gray-600">Discover students who match your learning needs</p>
            </div>
          </div>
        </Link>

        <Link
          to="/chat"
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chat</h2>
              <p className="text-gray-600">Connect with your matched study partners</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Profile</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Skills I can Teach</h3>
            <div className="flex flex-wrap gap-2">
              {userProfile.skillsOffered.length > 0 ? (
                userProfile.skillsOffered.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No skills added yet</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Skills I need Help with</h3>
            <div className="flex flex-wrap gap-2">
              {userProfile.skillsNeeded.length > 0 ? (
                userProfile.skillsNeeded.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No skills added yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

