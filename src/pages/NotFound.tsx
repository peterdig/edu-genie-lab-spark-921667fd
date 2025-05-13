import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { useTheme } from "@/lib/theme-provider";
import { FuzzyText } from "@/components/ui/fuzzy-text";
import { useAuth } from "@/lib/AuthContext.jsx";

const NotFound = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Determine where to redirect based on authentication status
  const redirectPath = isAuthenticated ? "/dashboard" : "/";
  const buttonText = isAuthenticated ? "Return to Dashboard" : "Return to Home";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center max-w-xl p-6">
        <div className="mb-6">
          <FuzzyText
            fontSize="clamp(6rem, 15vw, 15rem)"
            fontWeight={900}
            baseIntensity={0.2}
            hoverIntensity={0.5}
            className="mx-auto"
          >
            404
          </FuzzyText>
        </div>
        <p className="text-2xl font-medium mb-4">Page Not Found</p>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild size="lg" className="font-medium">
          <Link to={redirectPath}>{buttonText}</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
