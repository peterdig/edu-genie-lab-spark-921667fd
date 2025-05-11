export interface StudentEngagementData {
  date: string;
  active: number;
  previousActive?: number;
}

export interface ContentUsageData {
  name: string;
  value: number;
  percentage?: number;
}

export interface AssessmentPerformanceData {
  subject: string;
  score: number;
  previousScore?: number;
  change?: number;
}

export interface ContentDistributionData {
  name: string;
  value: number;
  percentage?: number;
}

export interface MetricCard {
  title: string;
  value: string | number;
  changePercentage: number;
  icon: string;
  timeframe: string;
}

export interface AnalyticsData {
  studentEngagement: StudentEngagementData[];
  contentUsage: ContentUsageData[];
  assessmentPerformance: AssessmentPerformanceData[];
  contentDistribution: ContentDistributionData[];
  metrics: {
    totalStudents: MetricCard;
    avgEngagementTime: MetricCard;
    contentCreated: MetricCard;
    avgAssessmentScore: MetricCard;
  };
  lastUpdated: string;
}

export type TimeRange = '7d' | '30d' | '90d' | '1y';

export interface AnalyticsFilters {
  timeRange: TimeRange;
  date?: Date;
  subject?: string;
  gradeLevel?: string;
} 