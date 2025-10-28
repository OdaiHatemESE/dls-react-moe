"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, Settings, Loader2, AlertCircle } from "lucide-react";
import { AdminUsersManager } from "./components/AdminUsersManager";
import { UpdatePeriodsManager } from "./components/UpdatePeriodsManager";
import { StudentActionsManager } from "./components/StudentActionsManager";
import { AdminStats } from "./components/AdminStats";
import { Toaster } from "@/components/ui/toaster";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

export default function AdminConfigPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("users");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-aegold-50 via-gray-50 to-aegold-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-r from-aegold-600 via-aegold-500 to-aegold-400 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Settings className="w-8 h-8" />
                </div>
                Admin Configuration
              </h1>
              <p className="text-aegold-100 text-lg">
                Manage system settings, users, and permissions
              </p>
            </div>
            <div className="flex items-center gap-4">
              {accessData.user && (
                <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-4 border border-white/20">
                  <p className="text-sm text-aegold-100 mb-1">Logged in as</p>
                  <p className="font-semibold text-lg">{accessData.user.name}</p>
                  <p className="text-xs text-aegold-200 font-mono mt-1">{accessData.user.emirateId}</p>
                </div>
              )}
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/20 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Portal
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8">
        {/* Stats Cards */}
        <AdminStats />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-2">
          <TabsList className="grid w-full grid-cols-3 bg-aegold-50 dark:bg-gray-800 rounded-xl p-1">
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-2 data-[state=active]:bg-aegold-600 data-[state=active]:text-white dark:data-[state=active]:bg-aegold-600 rounded-lg transition-all"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Admin Users</span>
              <span className="sm:hidden font-medium">Users</span>
            </TabsTrigger>
            <TabsTrigger 
              value="periods" 
              className="flex items-center gap-2 data-[state=active]:bg-aegold-600 data-[state=active]:text-white dark:data-[state=active]:bg-aegold-600 rounded-lg transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Update Periods</span>
              <span className="sm:hidden font-medium">Periods</span>
            </TabsTrigger>
            <TabsTrigger 
              value="actions" 
              className="flex items-center gap-2 data-[state=active]:bg-aegold-600 data-[state=active]:text-white dark:data-[state=active]:bg-aegold-600 rounded-lg transition-all"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Student Actions</span>
              <span className="sm:hidden font-medium">Actions</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users" className="mt-0">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <AdminUsersManager />
          </div>
        </TabsContent>

        <TabsContent value="periods" className="mt-0">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <UpdatePeriodsManager />
          </div>
        </TabsContent>

        <TabsContent value="actions" className="mt-0">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <StudentActionsManager />
          </div>
        </TabsContent>
      </Tabs>

      <Toaster />
      </div>
    </div>
  );
}
