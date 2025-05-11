import { useState, useEffect, useCallback, memo } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  BarChart, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  Users, 
  Clock, 
  BookOpen, 
  GraduationCap, 
  ArrowUpRight, 
  RefreshCw
} from "lucide-react";
import { 
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/use-analytics";
import { ExportMenu } from "@/components/analytics/ExportMenu";
import { RealTimeStatus } from "@/components/analytics/RealTimeStatus";
import { InsightsCard } from "@/components/analytics/InsightsCard";
import { TimeRange, AnalyticsData } from "@/types/analytics";

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#8DD1E1'];

// Memoized charts to prevent unnecessary re-renders
const MemoizedLineChart = memo(function MemoizedLineChart({ 
  data, 
  height = "100%"
}: { 
  data: any[], 
  height?: string | number 
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date"
          tickFormatter={(date) => {
            const dateObj = new Date(date);
            return format(dateObj, "MMM d");
          }}
        />
        <YAxis />
        <Tooltip 
          formatter={(value, name) => [value, 'Active Students']}
          labelFormatter={(date) => format(new Date(date), "MMMM d, yyyy")}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="active"
          name="Active Students"
          stroke="#0088FE"
          activeDot={{ r: 8 }}
          strokeWidth={2}
        />
        {data[0]?.previousActive && (
          <Line
            type="monotone"
            dataKey="previousActive"
            name="Previous Period"
            stroke="#FF8042"
            strokeDasharray="5 5"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
});

const MemoizedPieChart = memo(function MemoizedPieChart({ 
  data, 
  height = "100%",
  outerRadius = 80
}: { 
  data: any[], 
  height?: string | number,
  outerRadius?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={outerRadius}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value, name, props) => [`${value} items`, props.payload.name]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
});

const MemoizedBarChart = memo(function MemoizedBarChart({ 
  data, 
  height = "100%",
  vertical = false
}: { 
  data: any[], 
  height?: string | number,
  vertical?: boolean
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
        layout={vertical ? "vertical" : "horizontal"}
      >
        <CartesianGrid strokeDasharray="3 3" />
        {vertical ? (
          <>
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" />
          </>
        ) : (
          <>
            <XAxis dataKey="subject" />
            <YAxis domain={[0, 100]} />
          </>
        )}
        <Tooltip formatter={(value) => [`${value}${!vertical ? '%' : ''}`, vertical ? 'Content Items' : 'Score']} />
        <Legend />
        <Bar 
          dataKey={vertical ? "value" : "score"} 
          name={vertical ? "Content Items" : "Current Score"} 
          fill="#0088FE" 
          radius={vertical ? [0, 4, 4, 0] : undefined}
        />
        {!vertical && data[0]?.previousScore && (
          <Bar dataKey="previousScore" name="Previous Score" fill="#FF8042" />
        )}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
});

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  changePercentage: number;
  icon: React.ReactNode;
  timeframe: string;
  isLoading?: boolean;
}

const MetricCard = memo(function MetricCard({ 
  title, 
  value, 
  changePercentage, 
  icon, 
  timeframe, 
  isLoading = false 
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-500 font-medium">+{changePercentage}%</span> {timeframe}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
});

const MetricCards = memo(function MetricCards({ 
  data, 
  loading 
}: { 
  data: AnalyticsData | null, 
  loading: boolean 
}) {
  if (!data) return null;
  const { metrics } = data;
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title={metrics.totalStudents.title}
        value={metrics.totalStudents.value}
        changePercentage={metrics.totalStudents.changePercentage}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        timeframe={metrics.totalStudents.timeframe}
        isLoading={loading}
      />
      <MetricCard
        title={metrics.avgEngagementTime.title}
        value={metrics.avgEngagementTime.value}
        changePercentage={metrics.avgEngagementTime.changePercentage}
        icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        timeframe={metrics.avgEngagementTime.timeframe}
        isLoading={loading}
      />
      <MetricCard
        title={metrics.contentCreated.title}
        value={metrics.contentCreated.value}
        changePercentage={metrics.contentCreated.changePercentage}
        icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
        timeframe={metrics.contentCreated.timeframe}
        isLoading={loading}
      />
      <MetricCard
        title={metrics.avgAssessmentScore.title}
        value={metrics.avgAssessmentScore.value}
        changePercentage={metrics.avgAssessmentScore.changePercentage}
        icon={<GraduationCap className="h-4 w-4 text-muted-foreground" />}
        timeframe={metrics.avgAssessmentScore.timeframe}
        isLoading={loading}
      />
    </div>
  );
});

export default function Analytics() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("overview");
  
  // Use our custom analytics hook
  const {
    data,
    loading,
    error,
    filters,
    insights,
    isRealTimeEnabled,
    setTimeRange,
    setDate: updateDateFilter,
    fetchData,
    toggleRealTime,
    exportData
  } = useAnalytics();

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    if (isRealTimeEnabled) return;
    
    toast.info("Refreshing analytics data...");
    await fetchData();
    toast.success("Analytics data refreshed");
  }, [isRealTimeEnabled, fetchData]);

  // Handle time range change
  const handleTimeRangeChange = useCallback((value: string) => {
    setTimeRange(value as TimeRange);
  }, [setTimeRange]);

  // Handle date selection
  const handleDateSelect = useCallback((newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      updateDateFilter(newDate);
    }
  }, [setDate, updateDateFilter]);

  // Handle export
  const handleExport = useCallback((format: 'csv' | 'json') => {
    exportData(format);
  }, [exportData]);

  return (
    <Layout>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track student performance and content usage metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filters.timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRealTimeEnabled || loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <ExportMenu onExport={handleExport} disabled={!data || loading} />
          </div>
        </div>
        
        <div className="flex justify-end">
          <RealTimeStatus 
            isRealTimeEnabled={isRealTimeEnabled} 
            toggleRealTime={toggleRealTime} 
            lastUpdated={data?.lastUpdated}
          />
        </div>
        
        <MetricCards data={data} loading={loading} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="engagement">Student Engagement</TabsTrigger>
            <TabsTrigger value="content">Content Analytics</TabsTrigger>
            <TabsTrigger value="assessments">Assessment Results</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Student Engagement</CardTitle>
                    <LineChartIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardDescription>Daily active students over time</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {loading ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
                    </div>
                  ) : data?.studentEngagement && (
                    <MemoizedLineChart data={data.studentEngagement} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Content Usage</CardTitle>
                    <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardDescription>Distribution by content type</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {loading ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
                    </div>
                  ) : data?.contentUsage && (
                    <MemoizedPieChart data={data.contentUsage} />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Assessment Performance</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardDescription>Average scores by subject</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {loading ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
                    </div>
                  ) : data?.assessmentPerformance && (
                    <MemoizedBarChart data={data.assessmentPerformance} />
                  )}
                </CardContent>
              </Card>

              <InsightsCard 
                insights={insights} 
                isLoading={loading} 
                timestamp={data?.lastUpdated}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="engagement" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Engagement Metrics</CardTitle>
                <CardDescription>
                  Detailed analysis of student engagement over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
                ) : data?.studentEngagement && (
                  <MemoizedLineChart data={data.studentEngagement} height={400} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="content" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Content Usage Distribution</CardTitle>
                  <CardDescription>
                    Usage breakdown by content type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="w-full h-80 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
                  ) : data?.contentUsage && (
                    <MemoizedPieChart data={data.contentUsage} height={300} outerRadius={100} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Distribution by Subject</CardTitle>
                  <CardDescription>
                    Subject area breakdown of content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="w-full h-80 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
                  ) : data?.contentDistribution && (
                    <MemoizedBarChart data={data.contentDistribution} height={300} vertical />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="assessments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Performance by Subject</CardTitle>
                <CardDescription>
                  Average assessment scores across different subjects
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
                ) : data?.assessmentPerformance && (
                  <MemoizedBarChart data={data.assessmentPerformance} height={400} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <InsightsCard 
                insights={insights} 
                isLoading={loading} 
                timestamp={data?.lastUpdated}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics Summary</CardTitle>
                  <CardDescription>
                    Overview of the most important metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading ? (
                      <>
                        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
                        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
                        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
                      </>
                    ) : data ? (
                      <>
                        {Object.values(data.metrics).map((metric, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full bg-primary/10`}>
                                {metric.icon === "Users" && <Users className="h-5 w-5 text-primary" />}
                                {metric.icon === "Clock" && <Clock className="h-5 w-5 text-primary" />}
                                {metric.icon === "BookOpen" && <BookOpen className="h-5 w-5 text-primary" />}
                                {metric.icon === "GraduationCap" && <GraduationCap className="h-5 w-5 text-primary" />}
                              </div>
                              <div>
                                <p className="font-medium">{metric.title}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <p className="font-bold text-xl">{metric.value}</p>
                              <div className="ml-2 flex items-center text-sm">
                                <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                                <span className="text-emerald-500">{metric.changePercentage}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-center py-8 text-muted-foreground">No metrics available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
} 