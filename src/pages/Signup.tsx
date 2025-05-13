import { SignupForm } from "@/components/auth/SignupForm";
import { Card } from "@/components/ui/card";
import { MorphingText } from "@/components/ui/morphing-text";

const Signup = () => {
  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Enhanced background with animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-[#0a0a0a] bg-blend-overlay opacity-80 animate-gradient"></div>
      
      {/* Particles/stars effect for depth */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars-container">
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i}
              className="star"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: Math.random() * 0.8 + 0.2
              }}
            />
          ))}
        </div>
      </div>
      
      {/* MorphingText component at the top */}
      <div className="relative z-10 mb-8 mt-12 text-white">
        <MorphingText 
          texts={["Welcome", "to", "EduGenie", "Start Learning", "Sign Up Today"]} 
          className="text-white" 
          textSize="text-6xl md:text-7xl" 
        />
        <p className="mt-3 text-center text-gray-400 max-w-lg mx-auto">
          Your personal AI-powered teaching assistant, designed to make education more engaging and effective
        </p>
      </div>
      
      {/* Centered card with form */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 mb-12">
        <Card className="backdrop-blur-sm bg-black/30 border border-gray-800 p-8 rounded-xl shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-gray-400 mt-2">
              Sign up to start using EdGenie's powerful features
            </p>
          </div>
          
          <SignupForm className="bg-transparent" />
        </Card>
      </div>
      
      {/* Floating shapes for visual interest */}
      <div className="absolute top-1/4 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
    </div>
  );
};

export default Signup;
