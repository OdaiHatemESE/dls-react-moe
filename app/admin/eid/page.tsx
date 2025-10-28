"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Calendar, Settings, Loader2, AlertCircle, Database, FileText, BarChart3, Home } from "lucide-react";
import { AdminUsersManager } from "./components/AdminUsersManager";
import { UpdatePeriodsManager } from "./components/UpdatePeriodsManager";
import { StudentActionsManager } from "./components/StudentActionsManager";
import { AdminStats } from "./components/AdminStats";
import { SystemStats } from "./components/SystemStats";
import { StudentsTable } from "./components/StudentsTable";
import { UpdateLogsTable } from "./components/UpdateLogsTable";
import { Toaster } from "@/components/ui/toaster";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type AdminAccess = {
  hasAccess: boolean;
  reason?: string;
  user?: {
    id: number;
    name: string;
    email?: string;
    emirateId: string;
  };
};

type NavigationItem = {
  id: string;
  label: string;
  icon: typeof BarChart3;
  description: string;
};

const navigationItems: NavigationItem[] = [
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    description: "System overview and statistics",
  },
  {
    id: "students",
    label: "Students",
    icon: Database,
    description: "Student directory and information",
  },
  {
    id: "logs",
    label: "Update Logs",
    icon: FileText,
    description: "Activity and update tracking",
  },
  {
    id: "users",
    label: "Admin Users",
    icon: Users,
    description: "Manage admin access",
  },
  {
    id: "periods",
    label: "Update Periods",
    icon: Calendar,
    description: "Configure update windows",
  },
  {
    id: "actions",
    label: "Student Actions",
    icon: Settings,
    description: "Manage student actions",
  },
];

export default function AdminConfigPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState("analytics");
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [accessData, setAccessData] = useState<AdminAccess | null>(null);

  useEffect(() => {
    async function checkAccess() {
      try {
        const res = await fetch("/api/admin/check-access");
        const data: AdminAccess = await res.json();
        setAccessData(data);

        if (!data.hasAccess) {
          // Redirect after a delay if no access
          setTimeout(() => {
            router.push("/dashboard");
          }, 3000);
        }
      } catch (error) {
        console.error("Error checking access:", error);
        setAccessData({ hasAccess: false, reason: "Failed to verify access" });
      } finally {
        setIsCheckingAccess(false);
      }
    }

    checkAccess();
  }, [router]);

  if (isCheckingAccess) {
    return (
      <div className="container mx-auto py-16 px-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!accessData?.hasAccess) {
    return (
      <div className="container mx-auto py-16 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            {accessData?.reason || "You do not have permission to access this page."}
            <br />
            <span className="text-sm">Redirecting to dashboard...</span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeView) {
      case "analytics":
        return (
          <>
            {/* Stats - Only shown in analytics view */}
            <div className="mb-8">
              <SystemStats />
              <AdminStats />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">System Analytics Overview</h2>
                <p className="text-gray-600 dark:text-gray-400">Comprehensive view of system data, demographics, and activity</p>
              </div>
              <UpdateLogsTable />
            </div>
          </>
        );
      case "students":
        return (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <StudentsTable />
          </div>
        );
      case "logs":
        return (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <UpdateLogsTable />
          </div>
        );
      case "users":
        return (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <AdminUsersManager />
          </div>
        );
      case "periods":
        return (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <UpdatePeriodsManager />
          </div>
        );
      case "actions":
        return (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <StudentActionsManager />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-aegold-50 via-gray-50 to-aegold-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Left Sidebar Navigation */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo/Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-aegold-500 to-aegold-600 rounded-xl">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Admin Panel</h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">Configuration</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          {accessData?.user && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-aegold-50 dark:bg-gray-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Logged in as</p>
              <p className="font-semibold text-sm text-foreground">{accessData.user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                {accessData.user.emirateId}
              </p>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 rounded-lg transition-all text-left",
                    isActive
                      ? "bg-aegold-600 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", isActive ? "text-white" : "text-gray-500 dark:text-gray-400")} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium text-sm", isActive ? "text-white" : "text-gray-900 dark:text-gray-100")}>
                      {item.label}
                    </p>
                    <p className={cn("text-xs mt-0.5", isActive ? "text-aegold-100" : "text-gray-500 dark:text-gray-400")}>
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Back to Portal */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <a
              href="/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-all text-gray-700 dark:text-gray-300"
            >
              <Home className="w-4 h-4" />
              <span className="font-medium text-sm">Back to Portal</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gradient-to-r from-aegold-600 via-aegold-500 to-aegold-400 text-white">
          <div className="px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Admin Panel</h1>
                  <p className="text-xs text-aegold-100">Configuration</p>
                </div>
              </div>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/20 transition-all text-sm"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Portal</span>
              </a>
            </div>
            {accessData?.user && (
              <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20">
                <p className="text-xs text-aegold-100">Logged in as</p>
                <p className="font-semibold text-sm">{accessData.user.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block bg-gradient-to-r from-aegold-600 via-aegold-500 to-aegold-400 text-white">
          <div className="px-8 py-8">
            <h1 className="text-3xl font-bold mb-2">
              {navigationItems.find(item => item.id === activeView)?.label}
            </h1>
            <p className="text-aegold-100">
              {navigationItems.find(item => item.id === activeView)?.description}
            </p>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <select
            value={activeView}
            onChange={(e) => setActiveView(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-foreground"
          >
            {navigationItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="px-4 lg:px-8 py-6 pb-8">
          {renderContent()}
        </div>

        <Toaster />
      </div>
    </div>
  );
}
