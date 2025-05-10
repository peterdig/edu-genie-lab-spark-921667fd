
import { SignupForm } from "@/components/auth/SignupForm";
import { Button } from "@/components/ui/button";
import { Book } from "lucide-react";

export default function Signup() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 md:p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-primary/10 w-16 h-16 rounded-full">
            <Book className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mt-4">Create an account</h1>
          <p className="text-muted-foreground">Sign up for EduCompanion</p>
        </div>
        
        <div className="bg-card rounded-lg p-6 shadow-md border">
          <SignupForm />
        </div>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>By signing up, you agree to our</p>
          <div className="flex justify-center gap-1 mt-1">
            <Button variant="link" className="p-0 h-auto text-sm">Terms of Service</Button>
            <span>and</span>
            <Button variant="link" className="p-0 h-auto text-sm">Privacy Policy</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
