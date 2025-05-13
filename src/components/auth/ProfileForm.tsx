import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext.jsx";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { upsertProfile, getUserInfo } from "@/lib/database";

// Define schema for form validation
const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  bio: z.string().optional(),
  job_title: z.string().optional(),
  school: z.string().optional(),
  avatar_url: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function ProfileForm({ onSuccess, className }: ProfileFormProps) {
  const { user, updateUserData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  // Profile form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      email: "",
      bio: "",
      job_title: "",
      school: "",
      avatar_url: ""
    }
  });
  
  // Load user data
  useEffect(() => {
    if (user) {
      setValue("full_name", user.full_name || "");
      setValue("email", user.email || "");
      
      // Fetch additional profile data
      const fetchProfile = async () => {
        try {
          if (!user.isLocalOnly) {
            // Get profile from database
            const profileData = await getUserInfo(user.id);
            
            if (profileData) {
              setValue("bio", profileData.bio || "");
              setValue("job_title", profileData.job_title || "");
              setValue("school", profileData.school || "");
              setValue("avatar_url", profileData.avatar_url || "");
            }
          } else {
            // For local users, try to get additional data from localStorage
            try {
              const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
              const localUser = localUsers.find((u: any) => u.email === user.email);
              if (localUser) {
                setValue("bio", localUser.bio || "");
                setValue("job_title", localUser.job_title || "");
                setValue("school", localUser.school || "");
                setValue("avatar_url", localUser.avatar_url || "");
              }
            } catch (err) {
              console.error("Error fetching local profile:", err);
            }
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      };
      
      fetchProfile();
    }
  }, [user, setValue]);
  
  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    setUpdateSuccess(false);
    setUpdateError(null);
    
    try {
      // Update profile in Supabase or localStorage
      if (user && !user.isLocalOnly) {
        // For Supabase users, use the database helper
        const { success, error } = await upsertProfile(user.id, {
          email: data.email,
          full_name: data.full_name,
          bio: data.bio,
          job_title: data.job_title,
          school: data.school,
          avatar_url: data.avatar_url
        });
        
        if (!success) {
          throw error || new Error("Failed to update profile");
        }
        
        // Also update user metadata if available
        try {
          await supabase.auth.updateUser({
            data: {
              full_name: data.full_name
            }
          });
        } catch (metaError) {
          console.warn("Could not update user metadata:", metaError);
        }
      } else if (user && user.isLocalOnly) {
        // Handle offline mode
        const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
        const index = localUsers.findIndex((u: any) => u.email === user.email);
        
        if (index >= 0) {
          localUsers[index] = { 
            ...localUsers[index],
            full_name: data.full_name,
            bio: data.bio,
            job_title: data.job_title,
            school: data.school,
            avatar_url: data.avatar_url,
            updated_at: new Date().toISOString()
          };
          
          localStorage.setItem('localUsers', JSON.stringify(localUsers));
          
          // Update current user
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedUser = { 
            ...currentUser,
            full_name: data.full_name,
            bio: data.bio,
            job_title: data.job_title,
            school: data.school,
            avatar_url: data.avatar_url,
          };
          
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
      
      // Update auth context with new user data - pass ALL updated fields, not just full_name
      if (updateUserData) {
        updateUserData({
          ...user,
          full_name: data.full_name,
          bio: data.bio,
          job_title: data.job_title,
          school: data.school,
          avatar_url: data.avatar_url
        });
      }
      
      setUpdateSuccess(true);
      toast.success("Profile updated successfully");
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Clear success indicator after 3 seconds
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error('Profile update error:', error);
      setUpdateError(error instanceof Error ? error.message : 'Failed to update profile');
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              {...register("full_name")}
              disabled={isLoading}
            />
            {errors.full_name && (
              <p className="text-destructive text-sm">{errors.full_name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              disabled={isLoading || (user && !user.isLocalOnly)}
            />
            {errors.email && (
              <p className="text-destructive text-sm">{errors.email.message}</p>
            )}
            {user && !user.isLocalOnly && (
              <p className="text-muted-foreground text-xs mt-1">
                Email can only be changed in account settings
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="job_title">Job Title/Role</Label>
            <Input
              id="job_title"
              placeholder="e.g. Teacher, Student, Administrator"
              {...register("job_title")}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="school">School/Institution</Label>
            <Input
              id="school"
              placeholder="Your school or institution"
              {...register("school")}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us a bit about yourself"
              className="resize-none min-h-[100px]"
              {...register("bio")}
              disabled={isLoading}
            />
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
                Saving...
              </>
            ) : updateSuccess ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Saved
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 