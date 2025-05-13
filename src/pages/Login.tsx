import { LoginForm } from "@/components/auth/LoginForm";

const Login = () => {
  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-[#0a0a0a]"></div>
      
      {/* Centered card with form */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <LoginForm className="p-8 rounded-xl shadow-xl" />
      </div>
    </div>
  );
};

export default Login;