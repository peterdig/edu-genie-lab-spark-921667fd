import { useState, Fragment, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
  CheckCircle2,
  Github,
  Briefcase
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { signUp } from "@/lib/auth";
import { logAuthEvent } from "@/lib/auth-events";
import { cn } from "@/lib/utils";

// Signup form schema
const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string()
    .email("Please enter a valid email address")
    .refine((email) => {
      // Basic email validation - no need to be too strict as zod already handles most cases
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }, "Please enter a valid email address")
    .transform(email => email.toLowerCase().trim()), // Normalize email to lowercase and trim
  role: z.string().optional(),
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
  onEmailChange?: (email: string) => void;
}

export function SignupForm({ onSuccess, className, onEmailChange }: SignupFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFocus, setPasswordFocus] = useState(false);

  // Set up the form with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      role: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  // Watch the password field to calculate strength
  const watchPassword = watch("password");

  // Watch the email field for changes
  const watchEmail = watch("email");
  
  // Notify parent component when email changes
  useEffect(() => {
    if (onEmailChange && watchEmail) {
      onEmailChange(watchEmail);
    }
  }, [watchEmail, onEmailChange]);

  // Calculate password strength
  useEffect(() => {
    if (!watchPassword) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    
    // Length
    if (watchPassword.length >= 8) strength += 20;
    // Uppercase
    if (/[A-Z]/.test(watchPassword)) strength += 20;
    // Lowercase
    if (/[a-z]/.test(watchPassword)) strength += 20;
    // Numbers
    if (/[0-9]/.test(watchPassword)) strength += 20;
    // Special characters
    if (/[^A-Za-z0-9]/.test(watchPassword)) strength += 20;
    
    setPasswordStrength(strength);
  }, [watchPassword]);

  // Get color based on password strength
  const getStrengthColor = () => {
    if (passwordStrength <= 20) return "bg-red-500";
    if (passwordStrength <= 40) return "bg-orange-500";
    if (passwordStrength <= 60) return "bg-yellow-500";
    if (passwordStrength <= 80) return "bg-blue-500";
    return "bg-green-500";
  };

  // Get label based on password strength
  const getStrengthLabel = () => {
    if (passwordStrength <= 20) return "Very Weak";
    if (passwordStrength <= 40) return "Weak";
    if (passwordStrength <= 60) return "Medium";
    if (passwordStrength <= 80) return "Strong";
    return "Very Strong";
  };

  // Handle form submission
  const onSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    // Ensure terms is explicitly true before proceeding
    if (!data.terms) {
      setError("You must accept the terms and conditions");
      setIsSubmitting(false);
      return;
    }

    try {
      // Use the auth module's signUp function instead of direct Supabase call
      const result = await signUp({
        email: data.email,
        password: data.password,
        name: data.fullName,
        terms: data.terms,
        role: data.role || 'teacher' // Default role
      });

      const { success, user, error, needsEmailVerification = true } = result;

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
      localStorage.setItem("lastSignupEmail", data.email);
      
      if (needsEmailVerification) {
        toast({
          title: "Account created successfully!",
          description: "You need to verify your email before logging in. Please check your inbox (and spam folder) for a confirmation link.",
        });
      } else {
        toast({
          title: "Account created successfully!",
          description: "Your account has been created and you can now log in.",
        });
      }
      
      // Redirect after a short delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/login', { 
            state: { 
              message: needsEmailVerification 
                ? "Please verify your email before logging in. Check your inbox for a verification link." 
                : "Your account has been created successfully. You can now log in."
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
        errorMessage = `Terms acceptance error. Please ensure you've checked the terms checkbox.`;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Social login handlers (for future implementation)
  const handleGoogleSignup = () => {
    toast({
      title: "Google signup",
      description: "Google signup will be available soon!",
    });
  };

  const handleGithubSignup = () => {
    toast({
      title: "GitHub signup",
      description: "GitHub signup will be available soon!",
    });
  };

  return (
    <div className={cn("text-foreground", className)}>
      {error && (
        <Alert variant="destructive" className="mb-3 py-2 bg-red-500/10 border border-red-500/30">
          <AlertCircle className="h-3 w-3 text-red-500" />
          <AlertDescription className="text-red-200 text-xs ml-2">{error}</AlertDescription>
        </Alert>
      )}
      
      {signupSuccess && (
        <Alert className="mb-3 py-2 bg-green-500/10 border border-green-500/30">
          <CheckCircle2 className="h-3 w-3 text-green-400" />
          <AlertDescription className="text-green-200 text-xs ml-2">
            Account created! Check your email.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Social signup options - more compact */}
      <div className="space-y-2 mb-4">
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          className="w-full flex items-center justify-center border-gray-700 hover:bg-gray-800 bg-transparent h-8 text-xs"
          onClick={handleGoogleSignup}
          disabled={isSubmitting || signupSuccess}
        >
          <svg className="w-3 h-3 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
            />
          </svg>
          Continue with Google
        </Button>
        
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          className="w-full flex items-center justify-center border-gray-700 hover:bg-gray-800 bg-transparent h-8 text-xs"
          onClick={handleGithubSignup}
          disabled={isSubmitting || signupSuccess}
        >
          <Github className="w-3 h-3 mr-2" />
          Continue with GitHub
        </Button>
      </div>
      
      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full border-gray-700" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-2 text-xs text-muted-foreground">or with email</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="fullName" className="text-xs text-muted-foreground">Full Name</Label>
          <div className="relative">
            <User className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
            <Input
              id="fullName"
              placeholder="John Doe"
              className="pl-7 bg-background/40 h-8 text-sm border-border focus:border-primary/50"
              {...register("fullName")}
              disabled={isSubmitting || signupSuccess}
            />
          </div>
          {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName.message}</p>}
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
          <div className="relative">
            <Mail className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="pl-7 bg-background/40 h-8 text-sm border-border focus:border-primary/50"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              {...register("email")}
              disabled={isSubmitting || signupSuccess}
            />
          </div>
          {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="role" className="text-xs text-muted-foreground">I am a (Optional)</Label>
          <div className="relative">
            <Briefcase className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
            <select
              id="role"
              className="w-full pl-7 py-1 h-8 text-sm bg-background/40 border-border focus:border-primary/50 text-foreground rounded-md"
              {...register("role")}
              disabled={isSubmitting || signupSuccess}
            >
              <option value="" className="bg-background">Select role (Optional)</option>
              <option value="teacher" className="bg-background">Teacher</option>
              <option value="student" className="bg-background">Student</option>
              <option value="admin" className="bg-background">Administrator</option>
              <option value="other" className="bg-background">Other</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
          <div className="relative">
            <Lock className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-7 bg-background/40 h-8 text-sm border-border focus:border-primary/50"
              {...register("password")}
              disabled={isSubmitting || signupSuccess}
              onFocus={() => setPasswordFocus(true)}
              onBlur={() => setPasswordFocus(false)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-8 px-2 py-1 hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting || signupSuccess}
            >
              {showPassword ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
            </Button>
          </div>
          
          {/* Simpler password strength indicator */}
          {(watchPassword || passwordFocus) && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between items-center">
                <Progress value={passwordStrength} className="h-1" indicatorClassName={getStrengthColor()} />
                <span className={`text-xs ml-2 font-medium ${passwordStrength > 60 ? 'text-green-400' : passwordStrength > 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {getStrengthLabel()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-x-2 gap-y-0">
                <div className={`text-[10px] flex items-center ${/[A-Z]/.test(watchPassword || '') ? 'text-green-400' : 'text-muted-foreground'}`}>
                  <CheckCircle2 className={`h-2 w-2 mr-1 ${/[A-Z]/.test(watchPassword || '') ? 'opacity-100' : 'opacity-50'}`} />
                  Uppercase
                </div>
                <div className={`text-[10px] flex items-center ${/[a-z]/.test(watchPassword || '') ? 'text-green-400' : 'text-muted-foreground'}`}>
                  <CheckCircle2 className={`h-2 w-2 mr-1 ${/[a-z]/.test(watchPassword || '') ? 'opacity-100' : 'opacity-50'}`} />
                  Lowercase
                </div>
                <div className={`text-[10px] flex items-center ${/[0-9]/.test(watchPassword || '') ? 'text-green-400' : 'text-muted-foreground'}`}>
                  <CheckCircle2 className={`h-2 w-2 mr-1 ${/[0-9]/.test(watchPassword || '') ? 'opacity-100' : 'opacity-50'}`} />
                  Number
                </div>
                <div className={`text-[10px] flex items-center ${(watchPassword?.length || 0) >= 8 ? 'text-green-400' : 'text-muted-foreground'}`}>
                  <CheckCircle2 className={`h-2 w-2 mr-1 ${(watchPassword?.length || 0) >= 8 ? 'opacity-100' : 'opacity-50'}`} />
                  8+ chars
                </div>
              </div>
            </div>
          )}
          
          {errors.password && !passwordFocus && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-7 bg-background/40 h-8 text-sm border-border focus:border-primary/50"
              {...register("confirmPassword")}
              disabled={isSubmitting || signupSuccess}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-8 px-2 py-1 hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isSubmitting || signupSuccess}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
              <span className="sr-only">
                {showConfirmPassword ? "Hide password" : "Show password"}
              </span>
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>
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
            className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary h-3 w-3"
          />
          <Label htmlFor="terms" className="text-[10px] text-muted-foreground">
            I agree to the{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </Label>
        </div>
        {errors.terms && <p className="text-xs text-red-400 mt-1">{errors.terms.message}</p>}
        
        <Button 
          type="submit" 
          className="w-full mt-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white border-none h-8 text-xs"
          disabled={isSubmitting || signupSuccess}
        >
          {isSubmitting ? (
            <Fragment>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Creating account...
            </Fragment>
          ) : signupSuccess ? (
            <Fragment>
              <CheckCircle2 className="mr-2 h-3 w-3" />
              Account created!
            </Fragment>
          ) : (
            "Create account"
          )}
        </Button>
      
      <div className="mt-3 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
      </form>
    </div>
  );
}