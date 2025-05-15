import { SignupForm } from "@/components/auth/SignupForm";
import { Card } from "@/components/ui/card";
import { ShimmerLogo } from "@/components/ShimmerLogo";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { resendVerificationEmail } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  
  // Check for stored email on component mount
  useEffect(() => {
    const storedEmail = localStorage.getItem("lastSignupEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  // Function to resend confirmation email
  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      const { success, error } = await resendVerificationEmail(email);

      if (!success) {
        if (error instanceof Error) {
          throw error;
        } else if (typeof error === 'string') {
          throw new Error(error);
        } else if (error) {
          throw new Error(error.message || "Failed to send verification email");
        } else {
          throw new Error("Unknown error");
        }
      }

      toast({
        title: "Confirmation email sent",
        description: "Please check your inbox (and spam folder) for the confirmation link",
      });
      
      // Store this email to help with future resends
      localStorage.setItem("lastSignupEmail", email);
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      let errorMessage = "An unknown error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Failed to send email",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  // Track the email entered in the SignupForm
  const handleEmailChange = (email: string) => {
    setEmail(email);
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-background dark:from-blue-600/15 dark:via-purple-600/5 dark:to-background bg-blend-overlay"></div>
      
      {/* Minimal header */}
      <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center z-20">
        <ShimmerLogo variant="header" size="sm" className="ml-2" />
      </div>
      
      {/* Compact centered signup form */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-4">
        <motion.div 
          className="w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="backdrop-blur-sm bg-card/90 border border-border p-4 rounded-lg shadow-md">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-foreground">Create account</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Sign up to start using EdGenie
                <p  style={{color: "red"}} className="text-l text-foreground font-bold ">
                **Mail rate limit reached. Please use the following credentials to sign in:, 
                Email: raazi4722@gmail.com 
                Password: Raazi@234**
                
              </p>
              </p>
            </div>
            
            <SignupForm className="bg-transparent" onEmailChange={handleEmailChange} />
            
            {/* Email troubleshooting section */}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">
                Not receiving the confirmation email? Try these steps:
              </p>
              <ul className="text-xs text-muted-foreground list-disc pl-4 mb-3 space-y-1">
                <li>Check your spam/junk folder</li>
                <li>Add noreply@mail.app.supabase.io to your contacts</li>
                <li>Use the resend button below</li>
              </ul>
              <div className="flex items-center">
                <input 
                  type="email" 
                  placeholder="Confirm your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-8 rounded-l-md border border-r-0 border-border bg-background text-xs px-2"
                />
                <Button 
                  onClick={handleResendEmail} 
                  disabled={isSending} 
                  className="h-8 rounded-l-none text-xs px-2"
                >
                  {isSending ? "Sending..." : "Resend Email"}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
      
      {/* Minimal background elements */}
      <div className="absolute top-1/4 -right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 -left-20 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl"></div>
    </div>
  );
};

export default Signup;
