"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Store, 
  CheckCircle, 
  DollarSign, 
  TrendingUp,
  Users,
  Calendar,
  Target,
  Activity
} from "lucide-react";

interface ReportSummary {
  totalStores: number;
  activeStores: number;
  completedRollouts: number;
  trainingSessions: number;
  totalRevenue: number;
  averageSuccessScore: number;
  provinceBreakdown: Record<string, number>;
}

interface SummaryMetricsProps {
  summary: ReportSummary;
}

export function SummaryMetrics({ summary }: SummaryMetricsProps) {
  const completionRate = summary.totalStores > 0 
    ? Math.round((summary.completedRollouts / summary.totalStores) * 100)
    : 0;

  const metrics = [
    {
      title: "Total Stores",
      value: summary.totalStores.toLocaleString(),
      subtitle: `${summary.activeStores} active`,
      icon: Store,
      color: "blue",
      trend: null
    },
    {
      title: "Completed Rollouts", 
      value: summary.completedRollouts.toLocaleString(),
      subtitle: `${completionRate}% completion rate`,
      icon: CheckCircle,
      color: "green",
      trend: completionRate > 50 ? "up" : completionRate > 25 ? "stable" : "down"
    },
    {
      title: "Training Sessions",
      value: summary.trainingSessions.toLocaleString(), 
      subtitle: "Successfully completed",
      icon: Users,
      color: "purple",
      trend: null
    },
    {
      title: "Total Revenue",
      value: `R${summary.totalRevenue.toLocaleString()}`,
      subtitle: "Period revenue", 
      icon: DollarSign,
      color: "green",
      trend: "up"
    },
    {
      title: "Average Success Score",
      value: `${summary.averageSuccessScore}%`,
      subtitle: "Across all changes",
      icon: Target,
      color: "orange", 
      trend: summary.averageSuccessScore > 70 ? "up" : summary.averageSuccessScore > 50 ? "stable" : "down"
    },
    {
      title: "Active Provinces",
      value: Object.keys(summary.provinceBreakdown).length.toString(),
      subtitle: "With store presence",
      icon: Activity,
      color: "blue",
      trend: null
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string; text: string }> = {
      blue: { bg: "bg-blue-50", icon: "text-blue-600", text: "text-blue-800" },
      green: { bg: "bg-green-50", icon: "text-green-600", text: "text-green-800" },
      purple: { bg: "bg-purple-50", icon: "text-purple-600", text: "text-purple-800" },
      orange: { bg: "bg-orange-50", icon: "text-orange-600", text: "text-orange-800" },
      red: { bg: "bg-red-50", icon: "text-red-600", text: "text-red-800" }
    };
    return colors[color] || colors.blue;
  };

  const getTrendIcon = (trend: string | null) => {
    if (!trend) return null;
    
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down": 
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((metric, index) => {
        const colors = getColorClasses(metric.color);
        const Icon = metric.icon;
        
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${colors.bg}`}>
                <Icon className={`h-4 w-4 ${colors.icon}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {metric.value}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {metric.subtitle}
                  </p>
                </div>
                {getTrendIcon(metric.trend)}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}