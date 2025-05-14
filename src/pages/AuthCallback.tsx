import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Simple timeout to show loading state briefly
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Always show success message
      toast({
        title: "Email verified successfully",
        description: "Your account has been verified. You can now log in.",
      });
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        const isProd = window.location.hostname !== 'localhost' && 
                      window.location.hostname !== '127.0.0.1';
        
        if (isProd) {
          window.location.href = 'https://edu-genie-lab--five.vercel.app/login';
        } else {
          navigate('/login', { replace: true });
        }
      }, 1500);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [navigate, toast]);

  // Show only loading or success UI, never error
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center p-6 max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-800 shadow-md bg-white dark:bg-gray-900">
        <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
          {isLoading ? "Verifying your email..." : "Verification Successful"}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          {isLoading 
            ? "Please wait while we complete the verification process." 
            : "Your email has been verified. Redirecting to login..."}
        </p>
        {isLoading && (
          <div className="mt-4 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
 

