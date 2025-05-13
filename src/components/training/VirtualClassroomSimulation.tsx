import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Award } from "lucide-react";
import { ClassroomSimulation } from "./ClassroomSimulation";

export default function TeacherTraining() {
  const [activeTab, setActiveTab] = useState("classroom");

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Teacher Training</h1>
          <p className="text-muted-foreground">
            Practice teaching scenarios and improve your classroom management skills
          </p>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="classroom">
              <Users className="h-4 w-4 mr-2" />
              Virtual Classroom
            </TabsTrigger>
            <TabsTrigger value="techniques">
              <BookOpen className="h-4 w-4 mr-2" />
              Teaching Techniques
            </TabsTrigger>
            <TabsTrigger value="certificates">
              <Award className="h-4 w-4 mr-2" />
              Certificates
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="classroom" className="space-y-4">
            <ClassroomSimulation />
          </TabsContent>
          
          <TabsContent value="techniques">
            <Card>
              <CardHeader>
                <CardTitle>Teaching Techniques</CardTitle>
                <CardDescription>
                  Learn and practice various teaching methodologies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  This section is under development. Check back soon for interactive
                  teaching technique tutorials and practice exercises.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center" disabled>
                    <BookOpen className="h-8 w-8 mb-2" />
                    <span>Inquiry-Based Learning</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center" disabled>
                    <BookOpen className="h-8 w-8 mb-2" />
                    <span>Project-Based Learning</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <CardTitle>Training Certificates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  This section is under development. Check back soon for information
                  on earning and managing your training certificates.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center" disabled>
                    <Award className="h-8 w-8 mb-2" />
                    <span>View Certificates</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center" disabled>
                    <Award className="h-8 w-8 mb-2" />
                    <span>Download Certificates</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}






