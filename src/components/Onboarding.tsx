import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createOrUpdateUser } from '../services/firestore';
import { User } from '../types';
import { GraduationCap } from 'lucide-react';

export function Onboarding() {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(userProfile?.name || '');
  const [major, setMajor] = useState(userProfile?.major || '');
  const [skillsOffered, setSkillsOffered] = useState<string[]>(userProfile?.skillsOffered || []);
  const [skillsNeeded, setSkillsNeeded] = useState<string[]>(userProfile?.skillsNeeded || []);
  const [currentSkillOffered, setCurrentSkillOffered] = useState('');
  const [currentSkillNeeded, setCurrentSkillNeeded] = useState('');
  const [loading, setLoading] = useState(false);

  if (!currentUser) {
    return null;
  }

  const handleAddSkillOffered = () => {
    if (currentSkillOffered.trim() && !skillsOffered.includes(currentSkillOffered.trim())) {
      setSkillsOffered([...skillsOffered, currentSkillOffered.trim()]);
      setCurrentSkillOffered('');
    }
  };

  const handleRemoveSkillOffered = (skill: string) => {
    setSkillsOffered(skillsOffered.filter(s => s !== skill));
  };

  const handleAddSkillNeeded = () => {
    if (currentSkillNeeded.trim() && !skillsNeeded.includes(currentSkillNeeded.trim())) {
      setSkillsNeeded([...skillsNeeded, currentSkillNeeded.trim()]);
      setCurrentSkillNeeded('');
    }
  };

  const handleRemoveSkillNeeded = (skill: string) => {
    setSkillsNeeded(skillsNeeded.filter(s => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !major.trim()) {
      alert('Please fill in your name and major');
      return;
    }

    setLoading(true);
    try {
      const updatedUser: User = {
        uid: currentUser.uid,
        name: name.trim(),
        email: currentUser.email || '',
        avatar: currentUser.photoURL || undefined,
        major: major.trim(),
        skillsOffered,
        skillsNeeded,
      };
      
      await createOrUpdateUser(updatedUser);
      console.log('Profile saved successfully!');
      
      // Refresh profile to get latest data
      await refreshProfile();
      
      // Small delay to ensure state updates
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error?.message || 'Failed to update profile. Please try again.';
      alert(`Error: ${errorMessage}\n\nMake sure:\n1. Firestore database is created\n2. Security rules allow writes\n3. You're authenticated`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex items-center justify-center mb-8">
          <GraduationCap className="h-12 w-12 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Welcome to AcadMatch AI
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Let's set up your profile to find the perfect study partners
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-2">
              Major
            </label>
            <input
              type="text"
              id="major"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="e.g., Computer Science, Physics, History"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills I can Teach
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={currentSkillOffered}
                onChange={(e) => setCurrentSkillOffered(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkillOffered();
                  }
                }}
                placeholder="e.g., Calculus, Python, Physics"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddSkillOffered}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillsOffered.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkillOffered(skill)}
                    className="ml-2 text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills I need Help with
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={currentSkillNeeded}
                onChange={(e) => setCurrentSkillNeeded(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkillNeeded();
                  }
                }}
                placeholder="e.g., Statistics, History, Spanish"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddSkillNeeded}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillsNeeded.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkillNeeded(skill)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

