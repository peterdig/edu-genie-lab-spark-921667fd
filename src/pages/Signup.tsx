import { SignupForm } from "@/components/auth/SignupForm";
import { Card } from "@/components/ui/card";
import { ShimmerLogo } from "@/components/ShimmerLogo";
import { motion } from "framer-motion";

const Signup = () => {
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
              </p>
            </div>
            
            <SignupForm className="bg-transparent" />
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
