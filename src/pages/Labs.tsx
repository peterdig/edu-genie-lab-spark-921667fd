
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { LabCard } from "@/components/labs/LabCard";
import { LabGenerator } from "@/components/labs/LabGenerator";
import { Lab } from "@/types/labs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Labs() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("create");
  const [generatedLab, setGeneratedLab] = useState<Lab | null>(null);
  const [savedLabs, setSavedLabs] = useState<Lab[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLabGenerated = (lab: Lab) => {
    setGeneratedLab(lab);
    // Auto-save generated lab
    setSavedLabs(prev => [lab, ...prev]);
  };
  
  const handleReset = () => {
    setGeneratedLab(null);
  };

  const handleLabClick = (labId: string) => {
    navigate(`/labs/${labId}`);
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Virtual Labs</h1>
          <p className="text-muted-foreground">
            Create and explore interactive virtual lab simulations
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="saved">Saved Labs</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="create" className="space-y-4">
            {generatedLab ? (
              <div className="space-y-4">
                <LabCard lab={generatedLab} onClick={() => handleLabClick(generatedLab.id)} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleReset}>Create New Lab</Button>
                  <Button onClick={() => navigate(`/labs/${generatedLab.id}`)}>
                    Open Lab Simulation
                  </Button>
                </div>
              </div>
            ) : (
              <LabGenerator onLabGenerated={handleLabGenerated} />
            )}
          </TabsContent>
          
          <TabsContent value="saved" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input placeholder="Search labs..." className="sm:max-w-xs" />
              <Select defaultValue="all">
                <SelectTrigger className="sm:max-w-xs">
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="biology">Biology</SelectItem>
                  <SelectItem value="earth">Earth Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : savedLabs.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {savedLabs.map((lab) => (
                  <LabCard key={lab.id} lab={lab} onClick={() => handleLabClick(lab.id)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  No labs saved yet. Create a lab to get started.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab("create")}
                >
                  Create Your First Lab
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
