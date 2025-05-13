import { useState, Fragment, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext.jsx";
import { Loader2, Eye, EyeOff, AlertCircle, Lock, Mail, InfoIcon } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false)
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function LoginForm({ onSuccess, className }: LoginFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailForResend, setEmailForResend] = useState<string>("");
  const [showEmailInstructions, setShowEmailInstructions] = useState(false);

  // Get redirect location if any
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";
  
  // Display message if passed from another page (like signup)
  const message = (location.state as { message?: string })?.message;
  
  useEffect(() => {
    if (message) {
      toast({
        description: message,
      });
    }
  }, [message, toast]);

  // Set up the form with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: localStorage.getItem('rememberedEmail') || "",
      password: "",
      rememberMe: Boolean(localStorage.getItem('rememberedEmail'))
    },
  });

  // Show email verification instructions
  const showVerificationInstructions = () => {
    setShowEmailInstructions(true);
    toast({
      title: "Check your email",
      description: "Please check your inbox for the verification link sent during signup"
    });
  };

  // Handle form submission
  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setError(null);
    setEmailForResend(data.email);  // Save email for potential instructions
    
    // Handle remember me functionality
    if (data.rememberMe) {
      localStorage.setItem('rememberedEmail', data.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    // Show initial feedback immediately
    toast({
      title: "Signing in",
      description: "Authenticating your account...",
      duration: 3000
    });

    // Set timeouts for progressive feedback during long login processes
    const loginTimeouts = [
      setTimeout(() => {
        if (isSubmitting) {
          toast({
            title: "Still signing in...",
            description: "This is taking longer than expected. Please wait...",
            duration: 5000
          });
        }
      }, 8000),
      
      setTimeout(() => {
        if (isSubmitting) {
          toast({
            title: "Login in progress",
            description: "Our servers are processing your request. This can take up to a minute on desktop browsers.",
            duration: 8000
          });
        }
      }, 20000),
      
      setTimeout(() => {
        if (isSubmitting) {
          toast({
            title: "Almost there",
            description: "Final verification steps in progress. Thank you for your patience...",
            duration: 10000
          });
        }
      }, 35000)
    ];

    try {
      // Use the login function from AuthContext
      const { success, error } = await login(data.email, data.password);
      
      // Clear all timeouts since we got a response
      loginTimeouts.forEach(clearTimeout);
      
      if (success) {
        toast({
          title: "Signed in successfully!",
          description: "Welcome back to EdGenie.",
        });
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        } else {
          // Otherwise redirect to the dashboard page or original destination
          navigate(from);
        }
      } else {
        console.error("Login error details:", error);
        
        if (error?.message?.includes("Email not confirmed") || 
            error?.message?.includes("not confirmed") || 
            error?.message?.includes("not verified")) {
          setError("Please verify your email address before logging in. Check your inbox for a verification link.");
        } else if (error?.message?.includes("timeout")) {
          setError("Login request timed out. This can happen on desktop browsers. Please try refreshing the page and trying again.");
        } else if (error?.message?.includes("session wasn't established")) {
          // Handle the special case where auth succeeded but session wasn't established
          setError("Your login was processed but the session couldn't be established. Please try refreshing the page.");
        } else {
          setError(error?.message || "Authentication failed. Please try again.");
        }
      }
    } catch (error) {
      // Clear all timeouts since we got a response
      loginTimeouts.forEach(clearTimeout);
      
        console.error("Login error:", error);
      
      let errorMessage = (error as Error).message || "Authentication failed. Please try again.";
      
      // Provide more user-friendly error messages
      if (errorMessage.includes("Invalid login credentials")) {
        if (localStorage.getItem("recentSignup") === data.email) {
          // This is likely a recently created account that needs email verification
          errorMessage = "Please confirm your email before signing in. Check your inbox for a verification link.";
        } else {
          errorMessage = "Invalid email or password. Please try again.";
        }
      } else if (errorMessage.includes("Email not confirmed") || 
                errorMessage.includes("not confirmed") || 
                errorMessage.includes("not verified")) {
        errorMessage = "Please confirm your email before signing in. Check your inbox for a verification link.";
      } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (errorMessage.includes("timeout")) {
        errorMessage = "Login timed out. This sometimes happens on desktop browsers. Please try refreshing the page or try again in a few moments.";
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {(error.includes("confirm your email") || error.includes("verify your email")) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2 mt-2" 
                  onClick={showVerificationInstructions}
                >
                  <InfoIcon className="mr-2 h-3 w-3" />
                  Need help?
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {showEmailInstructions && (
          <Alert className="mb-4 bg-blue-500/10 border-blue-500/50 text-blue-700 dark:text-blue-400">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <p><strong>Email verification instructions:</strong></p>
              <ol className="list-decimal pl-5 mt-2 space-y-1">
                <li>Check your email inbox for the verification link sent when you signed up</li>
                <li>Check your spam/junk folder if you can't find it</li>
                <li>Click the link in the email to verify your account</li>
                <li>After verification, return to this page to log in</li>
              </ol>
              <p className="mt-2">If you still can't find the email, try signing up again with the same email address.</p>
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link 
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10"
                autoComplete="current-password"
                {...register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="rememberMe" 
              {...register("rememberMe")}
              onCheckedChange={(checked) => {
                setValue("rememberMe", checked === true);
              }}
          />
            <Label htmlFor="rememberMe" className="text-sm">Remember me</Label>
          </div>
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Fragment>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="animate-pulse">Signing in... Please be patient</span>
              </Fragment>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
        
        <div className="mt-4 text-center text-sm">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
      </div>
      </CardContent>
    </Card>
  );
}
