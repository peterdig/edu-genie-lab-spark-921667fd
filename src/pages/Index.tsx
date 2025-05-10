
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Set to true for demo purposes
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would check authentication status
    // For this demo, we'll just simulate a loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if authenticated, otherwise to login
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export default Index;
