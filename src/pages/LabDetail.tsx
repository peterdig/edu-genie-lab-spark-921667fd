import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { LabSimulation } from "@/components/labs/LabSimulation";
import { labs } from "@/data/mockData";
import { Lab } from "@/types/labs";
import { Skeleton } from "@/components/ui/skeleton";
import { Beaker } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LabDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lab, setLab] = useState<Lab | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate('/labs');
      return;
    }
    
    // In a real app, this would fetch from an API
    const foundLab = labs.find(lab => lab.id === id);
    if (!foundLab) {
      navigate('/labs');
      return;
    }
    
    // Simulate API loading
    setTimeout(() => {
      setLab(foundLab);
      setIsLoading(false);
    }, 1000);
  }, [id, navigate]);

  return (
    <Layout>
      {isLoading ? (
        <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
          
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Skeleton className="h-[500px] w-full" />
            </div>
            <Skeleton className="h-[500px]" />
          </div>
        </div>
      ) : lab ? (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <LabSimulation lab={lab} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center p-8 rounded-lg border-opacity-40 bg-opacity-30 backdrop-blur-md bg-gradient-to-br from-white/30 to-white/10 dark:from-gray-900/50 dark:to-gray-900/30 shadow-md">
            <Beaker className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Lab not found</h2>
            <p className="text-muted-foreground mb-6">The lab you're looking for doesn't exist or has been removed.</p>
            <Button 
              onClick={() => navigate('/labs')}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-300"
            >
              Return to Labs
            </Button>
          </div>
        </div>
      )}
    </Layout>
  );
}
