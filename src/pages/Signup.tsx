import { SignupForm } from "@/components/auth/SignupForm";
import { Card } from "@/components/ui/card";

const Signup = () => {
  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-[#0a0a0a]"></div>
      
      {/* Centered card with form */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <Card className="p-8 rounded-xl shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-muted-foreground mt-2">
              Sign up to start using EdGenie
            </p>
        </div>
        
          <SignupForm />
        </Card>
      </div>
    </div>
  );
};

export default Signup;
