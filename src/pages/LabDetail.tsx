
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { LabSimulation } from "@/components/labs/LabSimulation";
import { labs } from "@/data/mockData";
import { Lab } from "@/types/labs";
import { Skeleton } from "@/components/ui/skeleton";

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
        <div className="space-y-6">
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
        <LabSimulation lab={lab} />
      ) : (
        <div className="text-center py-16">
          <p>Lab not found. Please select a different lab.</p>
        </div>
      )}
    </Layout>
  );
}
