import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GraduationCap, Search, MessageSquare, Users } from 'lucide-react';

export function Home() {
  const { currentUser, signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <GraduationCap className="h-16 w-16 text-primary-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AcadMatch AI
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with peers who complement your learning journey. Find study partners based on skills you can teach and skills you need help with.
          </p>
          {currentUser ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Go to Dashboard
            </Link>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Get Started with Google
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="p-3 bg-primary-100 rounded-lg w-fit mb-4">
              <Search className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Matching</h3>
            <p className="text-gray-600">
              Our AI algorithm matches you with peers based on complementary skills and learning needs.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="p-3 bg-blue-100 rounded-lg w-fit mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Peer Learning</h3>
            <p className="text-gray-600">
              Teach what you know and learn what you need. Create a collaborative learning environment.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Chat</h3>
            <p className="text-gray-600">
              Connect instantly with your matched peers through our integrated chat system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

