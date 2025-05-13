import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, X, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext.jsx";
import { updateAvatar } from "@/lib/database";

interface AvatarUploadProps {
  initialUrl?: string;
  onUploadComplete?: (url: string) => void;
  className?: string;
}

export function AvatarUpload({ initialUrl, onUploadComplete, className }: AvatarUploadProps) {
  const { user, updateUserData } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialUrl || null);
  const [uploading, setUploading] = useState(false);
  const [initials, setInitials] = useState("U");

  useEffect(() => {
    if (initialUrl) {
      setAvatarUrl(initialUrl);
    }

    // Set initials based on user full name
    if (user?.full_name) {
      const userInitials = user.full_name
        .split(" ")
        .map(name => name[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
      setInitials(userInitials);
    }
  }, [initialUrl, user]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      if (!user) {
        throw new Error("You must be logged in to upload an avatar.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `avatars/${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("File size must be less than 2MB");
      }

      // Check if Supabase is available or use local storage
      if (user.isLocalOnly) {
        // For local users, convert to data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setAvatarUrl(dataUrl);
          
          // Save to local storage
          if (dataUrl) {
            // Update local user
            const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
            const index = localUsers.findIndex((u: any) => u.email === user.email);
            
            if (index >= 0) {
              localUsers[index].avatar_url = dataUrl;
              localUsers[index].updated_at = new Date().toISOString();
              localStorage.setItem('localUsers', JSON.stringify(localUsers));
              
              // Update current user
              const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
              currentUser.avatar_url = dataUrl;
              localStorage.setItem('user', JSON.stringify(currentUser));
              
              // Update auth context
              if (updateUserData) {
                updateUserData({
                  ...user,
                  avatar_url: dataUrl
                });
              }
            }
            
            if (onUploadComplete) {
              onUploadComplete(dataUrl);
            }
          }
          
          setUploading(false);
          toast.success("Avatar updated successfully");
        };
        reader.readAsDataURL(file);
      } else {
        // For Supabase users, upload to storage
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        const publicUrl = data.publicUrl;

        // Update profile with avatar URL using the database helper
        const { success, error } = await updateAvatar(user.id, publicUrl);
        
        if (!success) {
          throw error || new Error("Failed to update avatar in database");
        }

        setAvatarUrl(publicUrl);
        
        // Update auth context
        if (updateUserData) {
          updateUserData({
            ...user,
            avatar_url: publicUrl
          });
        }
        
        if (onUploadComplete) {
          onUploadComplete(publicUrl);
        }
        
        toast.success("Avatar updated successfully");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(error instanceof Error ? error.message : "Error uploading avatar");
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      setUploading(true);

      if (!user) {
        throw new Error("You must be logged in to remove your avatar.");
      }

      if (user.isLocalOnly) {
        // Update local user
        const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
        const index = localUsers.findIndex((u: any) => u.email === user.email);
        
        if (index >= 0) {
          delete localUsers[index].avatar_url;
          localUsers[index].updated_at = new Date().toISOString();
          localStorage.setItem('localUsers', JSON.stringify(localUsers));
          
          // Update current user
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          delete currentUser.avatar_url;
          localStorage.setItem('user', JSON.stringify(currentUser));
          
          // Update auth context
          if (updateUserData) {
            const updatedUser = { ...user };
            delete updatedUser.avatar_url;
            updateUserData(updatedUser);
          }
        }
      } else {
        // Update profile with null avatar URL using the database helper
        const { success, error } = await updateAvatar(user.id, null);
        
        if (!success) {
          throw error || new Error("Failed to remove avatar from database");
        }
        
        // Update auth context
        if (updateUserData) {
          const updatedUser = { ...user };
          delete updatedUser.avatar_url;
          updateUserData(updatedUser);
        }
      }

      setAvatarUrl(null);
      
      if (onUploadComplete) {
        onUploadComplete("");
      }
      
      toast.success("Avatar removed successfully");
    } catch (error) {
      console.error("Error removing avatar:", error);
      toast.error(error instanceof Error ? error.message : "Error removing avatar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative mb-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatarUrl || ""} alt="Profile picture" />
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>
        
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : (
          <div className="absolute bottom-0 right-0">
            <label htmlFor="avatar-upload" className="cursor-pointer">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center shadow-sm">
                <Camera className="h-4 w-4 text-primary-foreground" />
              </div>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={removeAvatar}
          disabled={uploading || !avatarUrl}
        >
          <X className="h-4 w-4 mr-1" />
          Remove
        </Button>
      </div>
    </div>
  );
} 