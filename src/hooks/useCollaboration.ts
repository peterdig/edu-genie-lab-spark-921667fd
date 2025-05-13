import { useSupabaseData } from './useSupabaseHook';
import { Team, TeamMember, SharedResource } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect } from 'react';
import { supabase, useLocalStorageFallback } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext.jsx';

// Get current user ID from localStorage or use a placeholder
const getCurrentUserId = () => {
  try {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.id;
    }
  } catch (error) {
    console.error('Error getting current user ID:', error);
  }
  return '00000000-0000-0000-0000-000000000000'; // Fallback ID
};

const CURRENT_USER_ID = getCurrentUserId();

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
  const [userId, setUserId] = useState(CURRENT_USER_ID);
  const { isAuthenticated: authStatus, user: authUser } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [dataInitError, setDataInitError] = useState<Error | null>(null);
  // Force localStorage mode for collaboration features
  const [forceLocalStorage, setForceLocalStorage] = useState(true);

  // Use AuthContext to get authentication status
  useEffect(() => {
    if (authStatus && authUser) {
      console.log('User is authenticated via AuthContext:', authUser.id);
      setUserId(authUser.id);
      setIsAuthenticated(true);
    } else {
      // Fallback to direct Supabase check
      const checkAuth = async () => {
        try {
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            console.log('User is authenticated:', data.user.id);
            setUserId(data.user.id);
            setIsAuthenticated(true);
            
            // Store user info in localStorage
            localStorage.setItem('user', JSON.stringify({
              id: data.user.id,
              email: data.user.email
            }));
          } else {
            console.log('No authenticated user found');
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error checking authentication:', error);
          setIsAuthenticated(false);
        }
      };
      
      checkAuth();
    }
  }, [authStatus, authUser]);

  // Override the fallback flag for all hooks to force using localStorage
  const baseFallback = useLocalStorageFallback() || forceLocalStorage;

  const { 
    data: teams, 
    loading: teamsLoading, 
    error: teamsError,
    addItem: addTeam,
    updateItem: updateTeam,
    deleteItem: deleteTeam,
    isUsingFallback: usingFallback,
    forceLocalStorageSave: saveTeams
  } = useSupabaseData<Team>('teams', 'edgenie_teams', DEFAULT_TEAMS, baseFallback);

  const { 
    data: teamMembers, 
    loading: membersLoading, 
    error: membersError,
    addItem: addTeamMember,
    deleteItem: deleteTeamMember,
    queryByField: queryTeamMembers,
    forceLocalStorageSave: saveMembers
  } = useSupabaseData<TeamMember>('team_members', 'edgenie_team_members', DEFAULT_TEAM_MEMBERS, baseFallback);

  const { 
    data: sharedResources, 
    loading: resourcesLoading, 
    error: resourcesError,
    addItem: addSharedResource,
    deleteItem: deleteSharedResource,
    queryByField: querySharedResources,
    forceLocalStorageSave: saveResources
  } = useSupabaseData<SharedResource>('shared_resources', 'edgenie_shared_resources', DEFAULT_SHARED_RESOURCES, baseFallback);

  const [searchResults, setSearchResults] = useState(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');

  // Force save all data to localStorage on mount and when user ID changes
  useEffect(() => {
    const initCollaborationData = async () => {
      if (!teamsLoading && !membersLoading && !resourcesLoading && !isInitialized) {
        console.log("Initializing collaboration data in localStorage");
        try {
          // Make sure the default teams are associated with the current user
          const defaultTeamMembers = [...DEFAULT_TEAM_MEMBERS];
          if (userId !== CURRENT_USER_ID) {
            defaultTeamMembers.forEach(member => {
              if (member.user_id === CURRENT_USER_ID) {
                member.user_id = userId;
              }
            });
          }
          
          // Check if we need to save default data
          const teamsInStorage = localStorage.getItem('edgenie_teams');
          if (!teamsInStorage || JSON.parse(teamsInStorage).length === 0) {
            localStorage.setItem('edgenie_teams', JSON.stringify(DEFAULT_TEAMS));
          }
          
          const membersInStorage = localStorage.getItem('edgenie_team_members');
          if (!membersInStorage || JSON.parse(membersInStorage).length === 0) {
            localStorage.setItem('edgenie_team_members', JSON.stringify(defaultTeamMembers));
          }
          
          const resourcesInStorage = localStorage.getItem('edgenie_shared_resources');
          if (!resourcesInStorage || JSON.parse(resourcesInStorage).length === 0) {
            localStorage.setItem('edgenie_shared_resources', JSON.stringify(DEFAULT_SHARED_RESOURCES));
          }
          
          // Save any data currently in state
          saveTeams();
          saveMembers();
          saveResources();
          
          setIsInitialized(true);
        } catch (error) {
          console.error("Error initializing collaboration data:", error);
          setDataInitError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    };
    
    initCollaborationData();
  }, [teamsLoading, membersLoading, resourcesLoading, userId, isInitialized, saveTeams, saveMembers, saveResources]);

  // Get teams for current user
  const getUserTeams = () => {
    console.log("Getting user teams with data:", { teams, teamMembers, currentUser: userId });
    
    // If teams or teamMembers are empty, use default values from localStorage
    const teamsToUse = teams?.length ? teams : DEFAULT_TEAMS;
    const membersToUse = teamMembers?.length ? teamMembers : DEFAULT_TEAM_MEMBERS;
    
    // Use current user ID or default if not available yet
    const currentUserId = userId || CURRENT_USER_ID;
    
    // In case we don't find any teams for the current user, add default teams
    // This ensures the user always has teams to work with
    let userTeams = teamsToUse.filter(team => {
      const memberEntry = membersToUse.find(
        member => member.team_id === team.id && (member.user_id === currentUserId || member.user_id === CURRENT_USER_ID)
      );
      return !!memberEntry;
    });
    
    // If no teams found after filtering, use the default teams
    if (userTeams.length === 0 && isAuthenticated) {
      console.log("No teams found for user, using default teams");
      
      // Update members in localStorage to include current user
      DEFAULT_TEAM_MEMBERS.forEach(member => {
        if (member.user_id === CURRENT_USER_ID) {
          // Replace default ID with current user ID
          member.user_id = currentUserId;
        }
      });
      
      // Save updated members to localStorage
      localStorage.setItem('edgenie_team_members', JSON.stringify(DEFAULT_TEAM_MEMBERS));
      
      userTeams = DEFAULT_TEAMS;
    }
    
    console.log("Filtered user teams:", userTeams);
    return userTeams;
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
    console.log("Creating new team:", { name, description });
    
    if (!isAuthenticated && !usingFallback) {
      console.error("Authentication required to create a team");
      throw new Error("You must be signed in to create a team");
    }
    
    try {
      // First create the team
      const newTeam = await addTeam({
        name,
        description,
        created_by: userId
      });

      console.log("Team created:", newTeam);

      // Then add current user as owner
      if (newTeam) {
        const newMember = await addTeamMember({
          team_id: newTeam.id,
          user_id: userId,
          role: 'owner'
        });

        console.log("Team member added:", newMember);
        
        // Force save to localStorage in case there were any issues
        saveTeams();
        saveMembers();
        
        return newTeam;
      }
    } catch (error) {
      console.error("Error in createTeam:", error);
      
      // Try to create team locally even if Supabase fails
      try {
        const localTeamId = uuidv4();
        const localTeam = {
          id: localTeamId,
          name,
          description,
          created_by: userId,
          created_at: new Date().toISOString()
        } as Team;
        
        // Save team to localStorage
        const storedTeams = localStorage.getItem('edgenie_teams');
        const teams = storedTeams ? JSON.parse(storedTeams) : [];
        teams.push(localTeam);
        localStorage.setItem('edgenie_teams', JSON.stringify(teams));
        
        // Save team member to localStorage
        const storedMembers = localStorage.getItem('edgenie_team_members');
        const members = storedMembers ? JSON.parse(storedMembers) : [];
        members.push({
          id: uuidv4(),
          team_id: localTeamId,
          user_id: userId,
          role: 'owner',
          created_at: new Date().toISOString()
        });
        localStorage.setItem('edgenie_team_members', JSON.stringify(members));
        
        console.log("Created team locally due to API failure:", localTeam);
        return localTeam;
      } catch (localError) {
        console.error("Failed to create team even locally:", localError);
        throw error; // Throw the original error
      }
    }
  };

  // Add a member to team
  const inviteToTeam = async (teamId: string, userId: string, role: 'admin' | 'member') => {
    if (!isAuthenticated && !usingFallback) {
      console.error("Authentication required to invite team members");
      throw new Error("You must be signed in to invite team members");
    }
    
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
    if (!isAuthenticated && !usingFallback) {
      console.error("Authentication required to share resources");
      throw new Error("You must be signed in to share resources");
    }
    
    return await addSharedResource({
      resource_id: resourceId,
      resource_type: resourceType,
      shared_by: userId,
      shared_with: teamId,
      permission
    });
  };

  // Remove sharing
  const unshareResource = (shareId: string) => {
    if (!isAuthenticated && !usingFallback) {
      console.error("Authentication required to unshare resources");
      throw new Error("You must be signed in to unshare resources");
    }
    
    return deleteSharedResource(shareId);
  };

  // Remove team member
  const removeTeamMember = (memberId: string) => {
    if (!isAuthenticated && !usingFallback) {
      console.error("Authentication required to remove team members");
      throw new Error("You must be signed in to remove team members");
    }
    
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
    usingFallback,
    isAuthenticated
  };
} 