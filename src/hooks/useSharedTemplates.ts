import { useState } from 'react';
import { useTemplates } from './useTemplates';
import { useCollaboration } from './useCollaboration';
import { Template } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

// Mock user for demo purposes - using a proper UUID format
const CURRENT_USER_ID = '00000000-0000-0000-0000-000000000000'; // Using a nil UUID for demo

export function useSharedTemplates() {
  const { templates, isUsingFallback } = useTemplates();
  const { shareResource, sharedResources, usingFallback } = useCollaboration();
  const { toast } = useToast();
  
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [templateToShare, setTemplateToShare] = useState<Template | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState<"view" | "edit">("view");
  
  // Get templates shared with the current user
  const getSharedTemplates = () => {
    // In a real app, this would filter by the current user's ID
    return templates.filter(template => {
      return sharedResources.some(
        resource => 
          resource.resource_id === template.id && 
          resource.resource_type === 'template' && 
          resource.shared_with === CURRENT_USER_ID
      );
    });
  };
  
  // Handle template sharing UI
  const handleShareTemplate = (template: Template) => {
    setTemplateToShare(template);
    setShareDialogOpen(true);
  };
  
  // Share template with user or team
  const handleShareSubmit = async () => {
    if (!templateToShare) return;
    
    try {
      // In a real app, this would look up the user by email
      // For demo, we'll just use the email as the ID
      const targetId = shareEmail.trim();
      
      if (!targetId) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return;
      }
      
      await shareResource(
        templateToShare.id,
        'template',
        targetId,
        sharePermission
      );
      
      toast({
        title: "Template Shared",
        description: `"${templateToShare.name}" has been shared successfully.`,
      });
      
      // Reset and close dialog
      setShareEmail("");
      setSharePermission("view");
      setShareDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error Sharing Template",
        description: "There was an error sharing the template. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return {
    shareDialogOpen,
    setShareDialogOpen,
    templateToShare,
    shareEmail,
    setShareEmail,
    sharePermission,
    setSharePermission,
    getSharedTemplates,
    handleShareTemplate,
    handleShareSubmit,
    isUsingFallback: isUsingFallback || usingFallback
  };
} 