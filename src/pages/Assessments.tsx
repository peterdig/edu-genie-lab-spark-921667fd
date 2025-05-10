
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { AssessmentGenerator } from "@/components/assessments/AssessmentGenerator";
import { AssessmentDisplay } from "@/components/assessments/AssessmentDisplay";
import { AssessmentResult } from "@/types/assessments";
import { ContentCard } from "@/components/dashboard/ContentCard";
import { assessments } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

export default function Assessments() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("create");
  const [generatedAssessment, setGeneratedAssessment] = useState<AssessmentResult | null>(null);
  const [savedAssessments] = useState(assessments);
  
  const handleAssessmentGenerated = (assessment: AssessmentResult) => {
    setGeneratedAssessment(assessment);
  };
  
  const handleReset = () => {
    setGeneratedAssessment(null);
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
          <p className="text-muted-foreground">
            Create and manage AI-generated assessments and quizzes
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="saved">Saved Assessments</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="create" className="space-y-4">
            {generatedAssessment ? (
              <AssessmentDisplay assessment={generatedAssessment} onReset={handleReset} />
            ) : (
              <AssessmentGenerator onAssessmentGenerated={handleAssessmentGenerated} />
            )}
          </TabsContent>
          
          <TabsContent value="saved" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input placeholder="Search assessments..." className="sm:max-w-xs" />
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedAssessments.map((assessment) => (
                <ContentCard
                  key={assessment.id}
                  title={assessment.title}
                  description={`Grade ${assessment.gradeLevel} • ${assessment.questions.length} Questions`}
                  tags={assessment.tags || []}
                  onClick={() => navigate(`/assessments/${assessment.id}`)}
                >
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {assessment.questions.length} questions covering various levels of Bloom's taxonomy.
                  </p>
                </ContentCard>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
