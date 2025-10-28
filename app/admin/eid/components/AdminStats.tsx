"use client";

import { Users, Calendar, Settings } from "lucide-react";
import useSWR from "swr";
import { jsonFetcher } from "@/lib/swr";

export function AdminStats() {
  const { data: users } = useSWR("/api/admin/config/users", jsonFetcher);
  const { data: periods } = useSWR("/api/admin/config/periods", jsonFetcher);
  const { data: actions } = useSWR("/api/admin/config/actions", jsonFetcher);

  const activeUsers = users?.filter((u: any) => u.isActive).length || 0;
  const activePeriods = periods?.filter((p: any) => p.isEnabled).length || 0;
  const enabledActions = actions?.filter((a: any) => a.isEnabled).length || 0;

  const stats = [
    {
      name: "Active Admin Users",
      value: activeUsers,
      total: users?.length || 0,
      icon: Users,
      gradient: "from-aegold-500 to-aegold-600",
      bgColor: "bg-aegold-50",
      darkBgColor: "dark:bg-gray-800",
      iconBg: "bg-aegold-600",
    },
    {
      name: "Enabled Periods",
      value: activePeriods,
      total: periods?.length || 0,
      icon: Calendar,
      gradient: "from-aegold-400 to-aegold-500",
      bgColor: "bg-aegold-50",
      darkBgColor: "dark:bg-gray-800",
      iconBg: "bg-aegold-500",
    },
    {
      name: "Active Actions",
      value: enabledActions,
      total: actions?.length || 0,
      icon: Settings,
      gradient: "from-aegold-500 to-aegold-700",
      bgColor: "bg-aegold-50",
      darkBgColor: "dark:bg-gray-800",
      iconBg: "bg-aegold-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className={`relative overflow-hidden rounded-2xl ${stat.bgColor} ${stat.darkBgColor} p-6 border border-gray-200 dark:border-gray-700`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {stat.name}
              </p>
              <div className="flex items-baseline gap-2">
                <p className={`text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
                <p className="text-lg text-gray-500 dark:text-gray-400">
                  / {stat.total}
                </p>
              </div>
            </div>
            <div className={`p-4 rounded-xl ${stat.iconBg}`}>
              <stat.icon className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="mt-4 h-2 bg-white/50 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full transition-all duration-500`}
              style={{ width: `${stat.total > 0 ? (stat.value / stat.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
