import { useState, useEffect, useCallback, memo, useMemo } from "react";
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

// Add useMemo for key derived data
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

  // Memoize key data to prevent re-renders
  const memoizedStudentEngagement = useMemo(() => data?.studentEngagement || [], [data?.studentEngagement]);
  const memoizedContentUsage = useMemo(() => data?.contentUsage || [], [data?.contentUsage]);
  const memoizedAssessmentPerformance = useMemo(() => data?.assessmentPerformance || [], [data?.assessmentPerformance]);
  const memoizedContentDistribution = useMemo(() => data?.contentDistribution || [], [data?.contentDistribution]);

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

  // Create placeholder content for loading states
  const renderLoadingPlaceholder = useCallback((height: string, type: 'bar' | 'line' | 'pie' = 'bar') => (
    <div className={`w-full ${height} flex items-center justify-center`}>
      <div className={`w-full h-full bg-gray-100 dark:bg-gray-800 ${type === 'pie' ? 'rounded-full' : 'rounded-md'} animate-pulse opacity-70`} />
    </div>
  ), []);

  return (
    <Layout>
      <div className="space-y-6 w-full max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Track student performance and content usage metrics
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select 
              value={filters.timeRange} 
              onValueChange={handleTimeRangeChange}
              disabled={loading}
            >
              <SelectTrigger className="w-[140px] sm:w-[180px] h-9">
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
                    "w-full sm:w-[240px] justify-start text-left font-normal h-9",
                    !date && "text-muted-foreground"
                  )}
                  disabled={loading}
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
              className="h-9 w-9"
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

        <div className="overflow-x-auto -mx-4 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="h-10">
              <TabsTrigger value="overview" className="text-xs sm:text-sm h-8">Overview</TabsTrigger>
              <TabsTrigger value="engagement" className="text-xs sm:text-sm h-8">Student Engagement</TabsTrigger>
              <TabsTrigger value="content" className="text-xs sm:text-sm h-8">Content Analytics</TabsTrigger>
              <TabsTrigger value="assessments" className="text-xs sm:text-sm h-8">Assessment Results</TabsTrigger>
              <TabsTrigger value="insights" className="text-xs sm:text-sm h-8">Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg">Student Engagement</CardTitle>
                    <LineChartIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardDescription className="text-xs sm:text-sm">Daily active students over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-72 sm:h-80">
                    {loading ? (
                      renderLoadingPlaceholder('h-64', 'line')
                    ) : (
                      <MemoizedLineChart 
                        data={memoizedStudentEngagement} 
                        key={`student-engagement-${filters.timeRange}`}
                      />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg">Content Usage</CardTitle>
                    <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardDescription className="text-xs sm:text-sm">Distribution by content type</CardDescription>
                  </CardHeader>
                  <CardContent className="h-72 sm:h-80">
                    {loading ? (
                      renderLoadingPlaceholder('h-64', 'pie')
                    ) : (
                      <MemoizedPieChart 
                        data={memoizedContentUsage} 
                        key={`content-usage-${filters.timeRange}`}
                      />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg">Assessment Performance</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardDescription className="text-xs sm:text-sm">Average scores by subject</CardDescription>
                  </CardHeader>
                  <CardContent className="h-72 sm:h-80">
                    {loading ? (
                      renderLoadingPlaceholder('h-64', 'bar')
                    ) : (
                      <MemoizedBarChart 
                        data={memoizedAssessmentPerformance} 
                        key={`assessment-performance-${filters.timeRange}`}
                      />
                  )}
                </CardContent>
              </Card>

              <InsightsCard 
                insights={insights} 
                isLoading={loading} 
                timestamp={data?.lastUpdated}
                  key={`insights-${filters.timeRange}`}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="engagement" className="space-y-4">
            <Card>
              <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Student Engagement Metrics</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                  Detailed analysis of student engagement over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                    renderLoadingPlaceholder('h-96', 'line')
                  ) : (
                    <MemoizedLineChart 
                      data={memoizedStudentEngagement} 
                      height={400} 
                      key={`student-engagement-detailed-${filters.timeRange}`}
                    />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="content" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Content Usage Distribution</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                    Usage breakdown by content type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                      renderLoadingPlaceholder('h-72 sm:h-80', 'pie')
                    ) : (
                      <MemoizedPieChart 
                        data={memoizedContentUsage} 
                        height={300} 
                        outerRadius={100}
                        key={`content-usage-detailed-${filters.timeRange}`}
                      />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Content Distribution by Subject</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                    Subject area breakdown of content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                      renderLoadingPlaceholder('h-72 sm:h-80', 'bar')
                    ) : (
                      <MemoizedBarChart 
                        data={memoizedContentDistribution} 
                        height={300} 
                        vertical 
                        key={`content-distribution-${filters.timeRange}`}
                      />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="assessments" className="space-y-4">
            <Card>
              <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Assessment Performance by Subject</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                  Average assessment scores across different subjects
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                    renderLoadingPlaceholder('h-96', 'bar')
                  ) : (
                    <MemoizedBarChart 
                      data={memoizedAssessmentPerformance} 
                      height={400}
                      key={`assessment-performance-detailed-${filters.timeRange}`}
                    />
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
                  key={`insights-detailed-${filters.timeRange}`}
              />
              
              <Card>
                <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Key Metrics Summary</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                    Overview of the most important metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading ? (
                      <>
                          <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse opacity-70" />
                          <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse opacity-70" />
                          <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse opacity-70" />
                      </>
                    ) : data ? (
                      <>
                        {Object.values(data.metrics).map((metric, index) => (
                            <div key={`metric-${index}-${filters.timeRange}`} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full bg-primary/10`}>
                                  {metric.icon === "Users" && <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
                                  {metric.icon === "Clock" && <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
                                  {metric.icon === "BookOpen" && <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
                                  {metric.icon === "GraduationCap" && <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
                              </div>
                              <div>
                                  <p className="font-medium text-sm sm:text-base">{metric.title}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <p className="font-bold text-lg sm:text-xl">{metric.value}</p>
                                <div className="ml-2 flex items-center text-xs sm:text-sm">
                                  <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 mr-1" />
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
      </div>
    </Layout>
  );
} 