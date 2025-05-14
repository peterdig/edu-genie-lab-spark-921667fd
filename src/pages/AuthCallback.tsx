import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleOAuthCallback } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setIsLoading(true);
        const { success, error } = await handleOAuthCallback();

        if (success) {
          toast({
            title: "Email verified successfully",
            description: "Your account has been verified. Welcome to EduGenie!",
          });
          
          // Force redirect to production dashboard
          const isProd = window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1';
          
          if (isProd) {
            // Use absolute URL for production
            window.location.href = 'https://edu-genie-lab--five.vercel.app/dashboard';
          } else {
            // Use react-router for local development
            navigate('/dashboard', { replace: true });
          }
        } else {
          console.error('Auth callback error:', error);
          setError('Authentication failed. Please try signing in again.');
          
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        setError('An unexpected error occurred. Please try again.');
        
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [navigate, toast]);

  // Show a fallback UI that doesn't depend on any contexts that might not be available
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center p-6 max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-800 shadow-md bg-white dark:bg-gray-900">
        <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
          {isLoading ? "Verifying your email..." : error ? "Verification Failed" : "Verification Successful"}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          {isLoading 
            ? "Please wait while we complete the verification process." 
            : error 
              ? error
              : "Your email has been verified. Redirecting to dashboard..."}
        </p>
        {isLoading && (
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}
 