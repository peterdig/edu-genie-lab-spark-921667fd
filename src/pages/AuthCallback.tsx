import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleOAuthCallback } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
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
          toast({
            variant: "destructive",
            title: "Authentication failed",
            description: "Please try signing in again.",
          });
          navigate('/login');
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "An unexpected error occurred. Please try again.",
        });
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Verifying your email...</h2>
        <p className="text-muted-foreground">Please wait while we complete the verification process.</p>
      </div>
    </div>
  );
}
 