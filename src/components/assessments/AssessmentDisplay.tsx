
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssessmentResult, Question } from "@/types/assessments";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, Edit, FileText, Loader, Printer } from "lucide-react";

interface AssessmentDisplayProps {
  assessment: AssessmentResult;
  onReset: () => void;
}

export function AssessmentDisplay({ assessment, onReset }: AssessmentDisplayProps) {
  const [activeTab, setActiveTab] = useState("preview");
  const [isPrinting, setIsPrinting] = useState(false);
  
  const handlePrint = () => {
    setIsPrinting(true);
    toast.info("Preparing document for printing...");
    
    // Simulating print preparation delay
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 1500);
  };
  
  const handleDownload = () => {
    // In a real app, this would generate a PDF or other download format
    toast.info("Downloading assessment...");
    
    // Creating a text version of the assessment
    const assessmentText = `
      ${assessment.title}
      
      Instructions: ${assessment.instructions}
      
      Questions:
      ${assessment.questions.map((q, i) => {
        let questionText = `${i + 1}. ${q.text} [${q.bloomsLevel}]\n`;
        
        if (q.type === 'multiple-choice' && q.options) {
          q.options.forEach((opt, j) => {
            const optionLetter = String.fromCharCode(97 + j); // a, b, c, ...
            questionText += `   ${optionLetter}) ${opt}\n`;
          });
        }
        
        return questionText;
      }).join('\n')}
      
      Answer Key:
      ${assessment.questions.map((q, i) => {
        if (q.answer) {
          return `${i + 1}. ${q.answer}`;
        }
        return `${i + 1}. [Requires manual grading]`;
      }).join('\n')}
    `;
    
    // Create a blob and download it
    const blob = new Blob([assessmentText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assessment.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Assessment downloaded!");
  };
  
  const renderQuestion = (question: Question, index: number) => {
    return (
      <div key={index} className="mb-8">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{index + 1}.</span>
            <span>{question.text}</span>
          </div>
          <Badge variant="outline" className="ml-2 text-xs">
            {question.bloomsLevel}
          </Badge>
        </div>
        
        {question.type === 'multiple-choice' && question.options && (
          <div className="ml-6 mt-3 space-y-2">
            {question.options.map((option, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border flex items-center justify-center text-sm">
                  {String.fromCharCode(97 + i)}
                </div>
                <span>{option}</span>
                {activeTab === 'answer-key' && option === question.answer && (
                  <CheckCircle className="h-4 w-4 text-primary ml-1" />
                )}
              </div>
            ))}
          </div>
        )}
        
        {question.type === 'true-false' && (
          <div className="ml-6 mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border flex items-center justify-center text-sm">
                A
              </div>
              <span>True</span>
              {activeTab === 'answer-key' && question.answer === 'True' && (
                <CheckCircle className="h-4 w-4 text-primary ml-1" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border flex items-center justify-center text-sm">
                B
              </div>
              <span>False</span>
              {activeTab === 'answer-key' && question.answer === 'False' && (
                <CheckCircle className="h-4 w-4 text-primary ml-1" />
              )}
            </div>
          </div>
        )}
        
        {(question.type === 'short-answer' || question.type === 'essay') && (
          <div className="ml-6 mt-3">
            {activeTab === 'preview' ? (
              <div className="h-12 border-b border-dashed" />
            ) : (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm italic">Sample answer: {question.answer}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-2xl">{assessment.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handlePrint} disabled={isPrinting}>
              {isPrinting ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary">Grade {assessment.gradeLevel}</Badge>
          <Badge variant="outline">{assessment.questions.length} Questions</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-0">
        <div className="bg-muted p-4 rounded-md mb-6">
          <div className="font-medium mb-1">Instructions:</div>
          <p className="text-muted-foreground">{assessment.instructions}</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="preview">Student View</TabsTrigger>
            <TabsTrigger value="answer-key">Answer Key</TabsTrigger>
            <TabsTrigger value="export">Export Options</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview">
            <div className="space-y-1">
              {assessment.questions.map((question, index) => renderQuestion(question, index))}
            </div>
          </TabsContent>
          
          <TabsContent value="answer-key">
            <div className="space-y-1">
              {assessment.questions.map((question, index) => renderQuestion(question, index))}
            </div>
          </TabsContent>
          
          <TabsContent value="export">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Export as PDF</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    Download the assessment as a PDF file, ready for printing or digital distribution.
                  </p>
                  <Button className="w-full" onClick={handleDownload}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Print Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    Send directly to your printer with optimized formatting for classroom use.
                  </p>
                  <Button className="w-full" variant="outline" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6 mt-6">
        <Button variant="outline" onClick={onReset}>
          Create New Assessment
        </Button>
        <Button className="flex items-center gap-2">
          <Edit className="h-4 w-4" />
          <span>Edit Assessment</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
