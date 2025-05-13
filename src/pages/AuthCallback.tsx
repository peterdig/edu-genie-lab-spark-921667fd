import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleOAuthCallback } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const { success, error } = await handleOAuthCallback();

      if (success) {
        toast({
          title: "Email verified successfully",
          description: "You can now sign in with your credentials.",
        });
        navigate('/login');
      } else {
        console.error('Auth callback error:', error);
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: "Please try signing in again.",
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
 