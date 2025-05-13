import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext.jsx";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, CheckCircle2, EyeOff, Eye } from "lucide-react";

// Define schema for form validation
const passwordSchema = z.object({
  current_password: z.string().min(6, "Password must be at least 6 characters"),
  new_password: z.string().min(8, "New password must be at least 8 characters"),
  confirm_password: z.string().min(8, "Confirm password must be at least 8 characters")
}).refine(data => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"]
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface PasswordUpdateFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function PasswordUpdateForm({ onSuccess, className }: PasswordUpdateFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema)
  });
  
  const onSubmit = async (data: PasswordFormValues) => {
    setIsLoading(true);
    setUpdateSuccess(false);
    setUpdateError(null);
    
    try {
      if (!user) throw new Error("Not authenticated");
      
      if (!user.isLocalOnly) {
        // First verify current password is correct
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: data.current_password
        });
        
        if (signInError) {
          throw new Error("Current password is incorrect");
        }
        
        // Update password in Supabase
        const { error } = await supabase.auth.updateUser({ 
          password: data.new_password 
        });
        
        if (error) throw error;
        
        // Get a new session 
        try {
          await supabase.auth.refreshSession();
        } catch (refreshError) {
          console.warn("Could not refresh session:", refreshError);
          // This is not critical, so we don't throw an error
        }
      } else {
        // Handle offline mode
        const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
        const index = localUsers.findIndex((u: any) => 
          u.email === user.email && u.password === data.current_password
        );
        
        if (index === -1) {
          throw new Error("Current password is incorrect");
        }
        
        localUsers[index].password = data.new_password;
        localUsers[index].updated_at = new Date().toISOString();
        localStorage.setItem('localUsers', JSON.stringify(localUsers));
      }
      
      setUpdateSuccess(true);
      toast.success("Password updated successfully");
      reset();
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Clear success indicator after 3 seconds
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error('Password update error:', error);
      setUpdateError(error instanceof Error ? error.message : 'Failed to update password');
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">Current Password</Label>
            <div className="relative">
              <Input
                id="current_password"
                type={showCurrentPassword ? "text" : "password"}
                {...register("current_password")}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.current_password && (
              <p className="text-destructive text-sm">{errors.current_password.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showNewPassword ? "text" : "password"}
                {...register("new_password")}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.new_password && (
              <p className="text-destructive text-sm">{errors.new_password.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirm_password")}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.confirm_password && (
              <p className="text-destructive text-sm">{errors.confirm_password.message}</p>
            )}
          </div>
          
          {updateError && (
            <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">
              {updateError}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => reset()} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : updateSuccess ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Updated
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 