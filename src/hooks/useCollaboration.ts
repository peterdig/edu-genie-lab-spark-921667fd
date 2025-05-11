import { useSupabaseData } from './useSupabaseData';
import { Team, TeamMember, SharedResource } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useState } from 'react';

// Mock user for demo purposes
const CURRENT_USER_ID = 'current-user-id';

// Sample default data
const DEFAULT_TEAMS: Team[] = [
  {
    id: '1',
    name: 'Science Department',
    description: 'Collaboration team for science teachers',
    created_by: CURRENT_USER_ID,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Grade 9 Teachers',
    description: 'Team for all Grade 9 subject teachers',
    created_by: CURRENT_USER_ID,
    created_at: new Date().toISOString()
  }
];

const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  {
    id: '1',
    team_id: '1',
    user_id: CURRENT_USER_ID,
    role: 'owner',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    team_id: '2',
    user_id: CURRENT_USER_ID,
    role: 'admin',
    created_at: new Date().toISOString()
  }
];

const DEFAULT_SHARED_RESOURCES: SharedResource[] = [
  {
    id: '1',
    resource_id: 'lesson-1',
    resource_type: 'lesson',
    shared_by: CURRENT_USER_ID,
    shared_with: '2', // Team ID
    permission: 'edit',
    created_at: new Date().toISOString()
  }
];

// Mock users for demo purposes
const MOCK_USERS = [
  { id: 'user-1', name: 'John Smith', email: 'john@example.com', role: 'Science Teacher' },
  { id: 'user-2', name: 'Maria Garcia', email: 'maria@example.com', role: 'Math Teacher' },
  { id: 'user-3', name: 'David Johnson', email: 'david@example.com', role: 'English Teacher' },
  { id: 'user-4', name: 'Sarah Lee', email: 'sarah@example.com', role: 'History Teacher' },
  { id: 'user-5', name: 'James Wilson', email: 'james@example.com', role: 'Art Teacher' },
];

export function useCollaboration() {
  const { 
    data: teams, 
    loading: teamsLoading, 
    error: teamsError,
    addItem: addTeam,
    updateItem: updateTeam,
    deleteItem: deleteTeam,
    isUsingFallback: usingFallback
  } = useSupabaseData<Team>('teams', 'edgenie_teams', DEFAULT_TEAMS);

  const { 
    data: teamMembers, 
    loading: membersLoading, 
    error: membersError,
    addItem: addTeamMember,
    deleteItem: deleteTeamMember,
    queryByField: queryTeamMembers
  } = useSupabaseData<TeamMember>('team_members', 'edgenie_team_members', DEFAULT_TEAM_MEMBERS);

  const { 
    data: sharedResources, 
    loading: resourcesLoading, 
    error: resourcesError,
    addItem: addSharedResource,
    deleteItem: deleteSharedResource,
    queryByField: querySharedResources
  } = useSupabaseData<SharedResource>('shared_resources', 'edgenie_shared_resources', DEFAULT_SHARED_RESOURCES);

  const [searchResults, setSearchResults] = useState(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');

  // Get teams for current user
  const getUserTeams = () => {
    return teams.filter(team => {
      const memberEntry = teamMembers.find(
        member => member.team_id === team.id && member.user_id === CURRENT_USER_ID
      );
      return !!memberEntry;
    });
  };

  // Get team members for a specific team
  const getTeamMembers = (teamId: string) => {
    return teamMembers.filter(member => member.team_id === teamId);
  };

  // Get shared resources for a specific team
  const getTeamSharedResources = (teamId: string) => {
    return sharedResources.filter(resource => resource.shared_with === teamId);
  };

  // Search for users (mock implementation)
  const searchUsers = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(MOCK_USERS);
      return;
    }
    
    const filteredUsers = MOCK_USERS.filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) || 
      user.email.toLowerCase().includes(query.toLowerCase()) ||
      user.role.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(filteredUsers);
  };

  // Create a new team
  const createTeam = async (name: string, description: string) => {
    // First create the team
    const newTeam = await addTeam({
      name,
      description,
      created_by: CURRENT_USER_ID
    });

    // Then add current user as owner
    if (newTeam) {
      await addTeamMember({
        team_id: newTeam.id,
        user_id: CURRENT_USER_ID,
        role: 'owner'
      });

      return newTeam;
    }
  };

  // Add a member to team
  const inviteToTeam = async (teamId: string, userId: string, role: 'admin' | 'member') => {
    return await addTeamMember({
      team_id: teamId,
      user_id: userId,
      role
    });
  };

  // Share a resource with a team
  const shareResource = async (
    resourceId: string, 
    resourceType: 'lesson' | 'assessment' | 'template' | 'rubric',
    teamId: string,
    permission: 'view' | 'edit'
  ) => {
    return await addSharedResource({
      resource_id: resourceId,
      resource_type: resourceType,
      shared_by: CURRENT_USER_ID,
      shared_with: teamId,
      permission
    });
  };

  // Remove sharing
  const unshareResource = (shareId: string) => {
    return deleteSharedResource(shareId);
  };

  // Remove team member
  const removeTeamMember = (memberId: string) => {
    return deleteTeamMember(memberId);
  };

  return {
    teams,
    teamMembers,
    sharedResources,
    loading: teamsLoading || membersLoading || resourcesLoading,
    error: teamsError || membersError || resourcesError,
    searchResults,
    searchQuery,
    searchUsers,
    getUserTeams,
    getTeamMembers,
    getTeamSharedResources,
    createTeam,
    updateTeam,
    deleteTeam,
    inviteToTeam,
    shareResource,
    unshareResource,
    removeTeamMember,
    usingFallback
  };
} 