"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Store } from "lucide-react";

interface ProvinceBreakdownProps {
  provinceData: Record<string, number>;
  totalStores: number;
}

export function ProvinceBreakdown({ provinceData, totalStores }: ProvinceBreakdownProps) {
  // Sort provinces by store count (descending)
  const sortedProvinces = Object.entries(provinceData)
    .sort(([, a], [, b]) => b - a)
    .filter(([province, count]) => count > 0);

  const getProvinceColor = (count: number) => {
    const percentage = (count / totalStores) * 100;
    if (percentage >= 20) return 'bg-green-100 text-green-800 border-green-200';
    if (percentage >= 10) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (percentage >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRelativeWidth = (count: number) => {
    const maxCount = Math.max(...Object.values(provinceData));
    return Math.max(10, (count / maxCount) * 100);
  };

  if (sortedProvinces.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Province Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Store className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No store data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Province Distribution
        </CardTitle>
        <p className="text-sm text-gray-600">
          Store count and distribution across provinces
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedProvinces.map(([province, count]) => {
            const percentage = Math.round((count / totalStores) * 100);
            const relativeWidth = getRelativeWidth(count);
            
            return (
              <div key={province} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{province}</span>
                    <Badge className={`text-xs ${getProvinceColor(count)}`}>
                      {percentage}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{count} stores</span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${relativeWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {sortedProvinces.length}
              </div>
              <div className="text-sm text-gray-600">Active Provinces</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {totalStores}
              </div>
              <div className="text-sm text-gray-600">Total Stores</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}