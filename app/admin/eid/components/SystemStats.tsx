"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileCheck, Database, Activity, TrendingUp, CheckCircle } from "lucide-react";
import useSWR from "swr";
import { jsonFetcher } from "@/lib/swr";

export function SystemStats() {
  const { data, isLoading } = useSWR("/api/admin/analytics/stats", jsonFetcher);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-0 bg-card">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Total Students",
      value: data?.overview?.students?.total || 0,
      subtitle: `${data?.overview?.students?.active || 0} active`,
      icon: Users,
      color: "text-aegold-600",
      bgColor: "bg-aegold-50 dark:bg-gray-800",
    },
    {
      title: "Update Requests",
      value: data?.overview?.updates?.total || 0,
      subtitle: `${data?.overview?.updates?.completionRate || 0}% completed`,
      icon: FileCheck,
      color: "text-aegreen-600",
      bgColor: "bg-aegreen-50 dark:bg-gray-800",
    },
    {
      title: "Database Records",
      value: data?.counts?.totalEnrollments || 0,
      subtitle: "Total enrollments",
      icon: Database,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-gray-800",
    },
    {
      title: "System Health",
      value: data?.overview?.system?.admins?.active || 0,
      subtitle: "Active admins",
      icon: Activity,
      color: "text-aegold-600",
      bgColor: "bg-aegold-50 dark:bg-gray-800",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-aegreen-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {stat.title}
              </p>
              <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.subtitle}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
