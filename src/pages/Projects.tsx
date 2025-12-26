import { useState, useEffect } from 'react';
import { Plus, Briefcase, Users, Calendar, Tag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getAllProjects, getUserProjects, joinProject, leaveProject, getUser } from '../services/firestore';
import { Project, User } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { CreateProjectModal } from '../components/CreateProjectModal';

export function Projects() {
  const { currentUser } = useAuth();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  const fetchProjects = async () => {
    if (!currentUser) return;

    try {
      const [allProjectsData, myProjectsData] = await Promise.all([
        getAllProjects(),
        getUserProjects(currentUser.uid)
      ]);

      // Filter out completed/cancelled projects from "all" view
      const openProjects = allProjectsData.filter(project => 
        project.status === 'open' || project.status === 'in-progress'
      );

      setAllProjects(openProjects);
      setMyProjects(myProjectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [currentUser]);

  const handleJoinProject = async (projectId: string) => {
    if (!currentUser) return;

    try {
      await joinProject(projectId, currentUser.uid);
      await fetchProjects(); // Refresh projects
    } catch (error) {
      console.error('Error joining project:', error);
      alert(error instanceof Error ? error.message : 'Failed to join project');
    }
  };

  const handleLeaveProject = async (projectId: string) => {
    if (!currentUser) return;

    try {
      await leaveProject(projectId, currentUser.uid);
      await fetchProjects(); // Refresh projects
    } catch (error) {
      console.error('Error leaving project:', error);
      alert('Failed to leave project');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  const displayProjects = activeTab === 'all' ? allProjects : myProjects;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Collaborative Projects</h1>
          <p className="mt-2 text-gray-600">
            Find teammates for your projects or join exciting collaborations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Project
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Projects ({allProjects.length})
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Projects ({myProjects.length})
          </button>
        </nav>
      </div>

      {displayProjects.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'all' ? 'No projects available' : 'No projects yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {activeTab === 'all' 
              ? 'Be the first to create a collaborative project!'
              : 'Create your first project to start collaborating with peers.'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              currentUserId={currentUser?.uid || ''}
              onJoin={() => project.id && handleJoinProject(project.id)}
              onLeave={() => project.id && handleLeaveProject(project.id)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchProjects();
          }}
        />
      )}
    </div>
  );
}