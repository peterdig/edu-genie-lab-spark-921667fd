import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext.jsx';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthGuardProps {
  children: ReactNode;
  fallbackPath?: string;
  requiredRole?: string | string[];
}

export function AuthGuard({ 
  children, 
  fallbackPath = '/login', 
  requiredRole 
}: AuthGuardProps) {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      setIsChecking(true);
      
      // Double-check the session first - important for email verification flows
      const { data: { session } } = await supabase.auth.getSession();
      
      // If we have a session but isAuthenticated is false, force auth check
      if (session && !isAuthenticated) {
        await checkAuth();
      }
      
      // If already authenticated, check role requirements
      if (isAuthenticated && user) {
        if (requiredRole) {
          // Check if user has required role
          const userRole = user.role || 'user';
          
          if (Array.isArray(requiredRole)) {
            // Multiple roles allowed
            setHasAccess(requiredRole.includes(userRole));
          } else {
            // Single role required
            setHasAccess(userRole === requiredRole);
          }
        } else {
          // No role requirement, just authentication
          setHasAccess(true);
        }
        setIsChecking(false);
        return;
      }
      
      // If not authenticated yet, check auth status
      const isAuth = await checkAuth();
      if (isAuth && user) {
        if (requiredRole) {
          // Check role after auth verification
          const userRole = user.role || 'user';
          
          if (Array.isArray(requiredRole)) {
            setHasAccess(requiredRole.includes(userRole));
          } else {
            setHasAccess(userRole === requiredRole);
          }
        } else {
          setHasAccess(true);
        }
      } else {
        setHasAccess(false);
      }
      
      setIsChecking(false);
    };
    
    verifyAuth();
  }, [isAuthenticated, user, checkAuth, requiredRole]);
  
  // Show loading state
  if (isLoading || isChecking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated || !hasAccess) {
    // Use Navigate component to redirect
    return (
      <Navigate 
        to={fallbackPath} 
        replace 
        state={{ from: location }} // Save the location we were trying to access
      />
    );
  }
  
  // Render children if authenticated
  return <>{children}</>;
} 