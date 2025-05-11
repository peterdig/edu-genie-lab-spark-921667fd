import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface InsightsCardProps {
  insights: string[];
  isLoading?: boolean;
  timestamp?: string;
}

export function InsightsCard({ insights, isLoading = false, timestamp }: InsightsCardProps) {
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    if (expandedInsight === index) {
      setExpandedInsight(null);
    } else {
      setExpandedInsight(index);
    }
  };

  const getInsightIcon = (insight: string) => {
    if (insight.includes("increased")) {
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    } else if (insight.includes("decreased")) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    } else if (insight.includes("highest") || insight.includes("most")) {
      return <TrendingUp className="h-4 w-4 text-blue-500" />;
    } else if (insight.includes("lowest")) {
      return <TrendingDown className="h-4 w-4 text-amber-500" />;
    } else {
      return <Lightbulb className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xl font-bold">Analytics Insights</CardTitle>
        <Lightbulb className="h-5 w-5 text-amber-500" />
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ) : insights.length > 0 ? (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg ${
                  insight.includes("decreased") 
                    ? "bg-red-50 dark:bg-red-900/20" 
                    : insight.includes("increased") 
                      ? "bg-emerald-50 dark:bg-emerald-900/20" 
                      : "bg-amber-50 dark:bg-amber-900/20"
                } cursor-pointer transition-all hover:shadow-md`}
                onClick={() => toggleExpand(index)}
              >
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight)}
                  <div className="flex-1">
                    <p className={`text-sm ${expandedInsight === index ? "" : "line-clamp-2"}`}>
                      {insight}
                    </p>
                    {expandedInsight === index && (
                      <Badge variant="outline" className="mt-2">
                        Key Insight
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <AlertTriangle className="h-10 w-10 mb-3 text-amber-500" />
            <p>No insights available for the selected time period.</p>
          </div>
        )}
        
        {timestamp && (
          <p className="text-xs text-muted-foreground mt-4">
            Last updated: {new Date(timestamp).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
} 