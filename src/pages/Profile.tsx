import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { User as UserIcon, Edit } from 'lucide-react';

export function Profile() {
  const { currentUser, userProfile } = useAuth();

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please sign in to view your profile.</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <Link
            to="/onboarding"
            className="inline-flex items-center px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Link>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          {userProfile.avatar ? (
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="h-20 w-20 rounded-full"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
              <UserIcon className="h-10 w-10 text-primary-600" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{userProfile.name}</h2>
            <p className="text-gray-600">{userProfile.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Major</h3>
            <p className="text-gray-900">{userProfile.major || 'Not specified'}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">College / University</h3>
            <p className="text-gray-900">{userProfile.collegeName || 'Not specified'}</p>
          </div>


          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Skills I can Teach</h3>
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
            <h3 className="text-sm font-medium text-gray-700 mb-3">Skills I need Help with</h3>
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

