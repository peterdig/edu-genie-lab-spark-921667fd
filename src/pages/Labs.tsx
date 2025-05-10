
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { LabCard } from "@/components/labs/LabCard";
import { labs } from "@/data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Labs() {
  const [activeTab, setActiveTab] = useState("all");
  const [allLabs] = useState(labs);
  
  // Filter labs based on active tab
  const filteredLabs = allLabs.filter(lab => {
    if (activeTab === 'all') return true;
    return lab.category === activeTab;
  });
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Virtual Labs</h1>
          <p className="text-muted-foreground">
            Interactive simulations for hands-on learning
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Input placeholder="Search labs..." className="sm:max-w-xs" />
          <Select defaultValue="all-grades">
            <SelectTrigger className="sm:max-w-xs">
              <SelectValue placeholder="Filter by grade level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-grades">All Grades</SelectItem>
              <SelectItem value="elementary">Elementary</SelectItem>
              <SelectItem value="middle">Middle School</SelectItem>
              <SelectItem value="high">High School</SelectItem>
              <SelectItem value="college">College</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Labs</TabsTrigger>
            <TabsTrigger value="physics">Physics</TabsTrigger>
            <TabsTrigger value="chemistry">Chemistry</TabsTrigger>
            <TabsTrigger value="biology">Biology</TabsTrigger>
            <TabsTrigger value="earth">Earth Science</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredLabs.map((lab) => (
                <LabCard key={lab.id} lab={lab} />
              ))}
            </div>
            
            {filteredLabs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No labs found for this category.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
