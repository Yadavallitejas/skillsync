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
          Welcome to SkillSync
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
              Major / Course
            </label>
            <div className="space-y-2">
              <select
                id="major-select"
                value={major && !major.startsWith('BTech') && !major.startsWith('BSc') && !major.startsWith('BA') && !major.startsWith('MBA') && !major.startsWith('MCA') && !major.startsWith('MSc') && !major.startsWith('MTech') && major !== 'PhD' ? 'custom' : major || ''}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setMajor('');
                  } else if (e.target.value !== '') {
                    setMajor(e.target.value);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required={!major || major === ''}
              >
                <option value="">Select your major/course</option>
                <option value="BTech - Computer Science">BTech - Computer Science</option>
                <option value="BTech - Electronics">BTech - Electronics</option>
                <option value="BTech - Mechanical">BTech - Mechanical</option>
                <option value="BTech - Civil">BTech - Civil</option>
                <option value="BTech - Electrical">BTech - Electrical</option>
                <option value="BTech - Chemical">BTech - Chemical</option>
                <option value="BTech - Aerospace">BTech - Aerospace</option>
                <option value="BTech - Biotechnology">BTech - Biotechnology</option>
                <option value="BSc - Computer Science">BSc - Computer Science</option>
                <option value="BSc - Mathematics">BSc - Mathematics</option>
                <option value="BSc - Physics">BSc - Physics</option>
                <option value="BSc - Chemistry">BSc - Chemistry</option>
                <option value="BSc - Biology">BSc - Biology</option>
                <option value="BA - English">BA - English</option>
                <option value="BA - History">BA - History</option>
                <option value="BA - Psychology">BA - Psychology</option>
                <option value="BA - Economics">BA - Economics</option>
                <option value="MBA">MBA</option>
                <option value="MCA">MCA</option>
                <option value="MSc - Computer Science">MSc - Computer Science</option>
                <option value="MSc - Mathematics">MSc - Mathematics</option>
                <option value="MTech - Computer Science">MTech - Computer Science</option>
                <option value="MTech - Electronics">MTech - Electronics</option>
                <option value="PhD">PhD</option>
                <option value="custom">Other (Enter custom)</option>
              </select>
              {(major === '' || (!major.startsWith('BTech') && !major.startsWith('BSc') && !major.startsWith('BA') && !major.startsWith('MBA') && !major.startsWith('MCA') && !major.startsWith('MSc') && !major.startsWith('MTech') && major !== 'PhD')) && (
                <input
                  type="text"
                  id="major"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="Enter your major/course"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mt-2"
                  required
                />
              )}
            </div>
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

