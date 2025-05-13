import { useState, Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Lock, 
  Mail, 
  User, 
  CheckCircle2 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { signUp } from "@/lib/auth";
import { logAuthEvent } from "@/lib/auth-events";
import { cn } from "@/lib/utils";

// Signup form schema
const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  terms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

// Add validation for password confirmation
const signupFormSchema = signupSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
);

type SignupFormValues = z.infer<typeof signupFormSchema>;

interface SignupFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function SignupForm({ onSuccess, className }: SignupFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Set up the form with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  // Handle form submission
  const onSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    // Log form data to verify terms value
    console.log("Form submission data:", data);
    
    // Ensure terms is explicitly true before proceeding
    if (!data.terms) {
      setError("You must accept the terms and conditions");
      setIsSubmitting(false);
      return;
    }

    try {
      // Use the auth module's signUp function instead of direct Supabase call
      const { success, user, error } = await signUp({
        email: data.email,
        password: data.password,
        name: data.fullName,
        terms: data.terms
      });

      if (!success) {
        console.error("Signup error details:", error);
        throw error;
      }

      // Log signup event in Supabase if successful
      if (user?.id) {
        await logAuthEvent(user.id, 'signup', {
          provider: 'email',
          terms_accepted: true,
          timestamp: new Date().toISOString()
        });
      }

      setSignupSuccess(true);
      
      // Store the email to help with error handling during login
      localStorage.setItem("recentSignup", data.email);
      
      toast({
        title: "Account created successfully!",
        description: "You need to verify your email before logging in. Please check your inbox for a confirmation link.",
      });
      
      console.log("Signup successful. User data:", user);
      
      // Redirect after a short delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/login', { 
            state: { 
              message: "Please verify your email before logging in. Check your inbox for a verification link." 
            }
          });
        }
      }, 2000);
      
    } catch (error) {
      console.error("Signup error:", error);
      
      let errorMessage = (error as Error).message || "Failed to create account. Please try again.";
      
      // Make error messages more user-friendly
      if (errorMessage.includes("already registered")) {
        errorMessage = "This email is already registered. Please use a different email or try logging in.";
      } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (errorMessage.includes("Password should be")) {
        errorMessage = "Password should be at least 8 characters with one uppercase letter, one lowercase letter, and one number.";
      } else if (errorMessage.includes("policy") || errorMessage.includes("terms")) {
        errorMessage = `Terms acceptance error: ${errorMessage}. Please try again and ensure you've checked the terms checkbox.`;
        console.warn("Terms error details:", error);
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("text-white", className)}>
      {error && (
        <Alert variant="destructive" className="mb-4 bg-red-500/20 border border-red-500/50">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      )}
      
      {signupSuccess && (
        <Alert className="mb-4 bg-green-500/20 border border-green-500/50">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-200">
            Account created successfully! {supabase.auth.getUserIdentities ? 
              "Please check your email to confirm your account." : 
              "You can now sign in with your credentials."}
          </AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="fullName"
              placeholder="John Doe"
              className="pl-10 bg-gray-900/40 backdrop-blur-sm border-gray-700 focus:border-blue-500/50 text-white placeholder:text-gray-500"
              {...register("fullName")}
              disabled={isSubmitting || signupSuccess}
            />
          </div>
          {errors.fullName && <p className="text-sm text-red-400">{errors.fullName.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-300">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="pl-10 bg-gray-900/40 backdrop-blur-sm border-gray-700 focus:border-blue-500/50 text-white placeholder:text-gray-500"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              {...register("email")}
              disabled={isSubmitting || signupSuccess}
            />
          </div>
          {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-300">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-10 bg-gray-900/40 backdrop-blur-sm border-gray-700 focus:border-blue-500/50 text-white placeholder:text-gray-500"
              {...register("password")}
              disabled={isSubmitting || signupSuccess}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting || signupSuccess}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
            </Button>
          </div>
          {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
          <p className="text-xs text-gray-500">
            Password must be at least 8 characters and include uppercase, lowercase, and numbers
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-10 bg-gray-900/40 backdrop-blur-sm border-gray-700 focus:border-blue-500/50 text-white placeholder:text-gray-500"
              {...register("confirmPassword")}
              disabled={isSubmitting || signupSuccess}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isSubmitting || signupSuccess}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showConfirmPassword ? "Hide password" : "Show password"}
              </span>
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="terms" 
            {...register("terms")} 
            defaultChecked={false}
            onCheckedChange={(checked) => {
              // Force the checkbox to be true/false, not indeterminate
              const value = checked === true;
              register("terms").onChange({
                target: { name: "terms", value },
                type: "change"
              });
            }}
            disabled={isSubmitting || signupSuccess}
            className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <Label htmlFor="terms" className="text-sm text-gray-300">
            I agree to the{" "}
            <Link to="/terms" className="text-blue-400 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-blue-400 hover:underline">
              Privacy Policy
            </Link>
          </Label>
        </div>
        {errors.terms && <p className="text-sm text-red-400">{errors.terms.message}</p>}
        
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none mt-2"
          disabled={isSubmitting || signupSuccess}
        >
          {isSubmitting ? (
            <Fragment>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </Fragment>
          ) : signupSuccess ? (
            <Fragment>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Account created!
            </Fragment>
          ) : (
            "Create account"
          )}
        </Button>
      
      <div className="mt-4 text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-400 hover:underline">
          Sign in
        </Link>
      </div>
      </form>
    </div>
  );
}