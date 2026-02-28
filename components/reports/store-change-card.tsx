"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  MapPin,
  DollarSign,
  Percent,
  Activity
} from "lucide-react";
import { formatDate } from "@/lib/utils/date-formatter";

interface StoreChangeMetrics {
  storeId: string;
  storeName: string;
  province: string;
  previousStatus: string;
  currentStatus: string;
  changeDate: Date;
  changeType: "status_change" | "rollout_completion" | "training_completion" | "performance_improvement";
  successScore: number;
  revenueImpact?: number;
  performanceMetrics: {
    sellThroughRate: number;
    wasteReduction: number;
    customerSatisfaction?: number;
    operationalEfficiency: number;
  };
  notes?: string;
}

interface StoreChangeCardProps {
  change: StoreChangeMetrics;
}

export function StoreChangeCard({ change }: StoreChangeCardProps) {
  const getSuccessBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'rollout_completion': return <Activity className="w-4 h-4 text-green-600" />;
      case 'training_completion': return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'performance_improvement': return <TrendingUp className="w-4 h-4 text-orange-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatChangeType = (type: string) => {
    return type.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">{change.storeName}</h3>
              <Badge variant="outline" className="text-xs">
                <MapPin className="w-3 h-3 mr-1" />
                {change.province}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              {getChangeTypeIcon(change.changeType)}
              <span className="text-sm font-medium text-gray-700">
                {formatChangeType(change.changeType)}
              </span>
              <Badge className={`text-xs font-semibold ${getSuccessBadgeColor(change.successScore)}`}>
                {change.successScore}% Success
              </Badge>
            </div>
          </div>
          
          <div className="text-right text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDate(change.changeDate)}
            </div>
          </div>
        </div>

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Percent className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Sell Through</span>
            </div>
            <div className="text-lg font-bold text-blue-800">
              {change.performanceMetrics.sellThroughRate}%
            </div>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">Waste Reduced</span>
            </div>
            <div className="text-lg font-bold text-green-800">
              {change.performanceMetrics.wasteReduction}%
            </div>
          </div>

          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-700">Operational</span>
            </div>
            <div className="text-lg font-bold text-orange-800">
              {change.performanceMetrics.operationalEfficiency}%
            </div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">Revenue</span>
            </div>
            <div className="text-lg font-bold text-gray-800">
              R{(change.revenueImpact || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Status Change Information */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
          <span className="text-gray-600">
            Status: <span className="font-medium">{change.previousStatus}</span> 
            <TrendingUp className="w-4 h-4 inline mx-2 text-green-600" />
            <span className="font-medium text-green-700">{change.currentStatus}</span>
          </span>
        </div>

        {/* Notes */}
        {change.notes && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs font-medium text-blue-700 mb-1">Notes:</div>
            <p className="text-sm text-blue-800">{change.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}