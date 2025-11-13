/**
 * Notifications Page
 * 
 * Full page view for browsing all notifications with filtering and pagination.
 */

"use client";

import { useState } from "react";
import { RefreshCw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { NotificationCard } from "@/app/components/notifications/NotificationCard";
import { useNotifications, useNotificationCount } from "@/lib/hooks/useNotifications";
import type { NotificationType } from "@/types";
import { useI18n } from "@/app/i18n/I18nProvider";

const NOTIFICATION_TYPES: NotificationType[] = [
  "info",
  "success",
  "warning",
  "error",
  "enrollment",
  "update",
  "conduct",
  "announcement",
  "StatusChange",
  "AddressUpdate",
  "ContactUpdate",
  "TransportationUpdate",
  "DataUpdate",
];

export default function NotificationsPage() {
  const { locale, t } = useI18n();
  const isRTL = locale === "ar";

  const [statusFilter, setStatusFilter] = useState<"all" | "read" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType | undefined>(undefined);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Fetch notifications with filters
  const {
    notifications,
    total,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications({
    status: statusFilter,
    type: typeFilter,
    limit,
    offset,
  });

  // Fetch count for header
  const { unread, refresh: refreshCount } = useNotificationCount();

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    await markAllAsRead();
    refreshCount();
  };

  // Handle refresh
  const handleRefresh = () => {
    refresh();
    refreshCount();
  };

  // Handle load more
  const handleLoadMore = () => {
    setOffset(offset + limit);
  };

  // Reset offset when filters change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value as "all" | "read" | "unread");
    setOffset(0);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value === "all" ? undefined : (value as NotificationType));
    setOffset(0);
  };

  const hasMore = notifications.length + offset < total;

  return (
    <div className={isRTL ? "rtl" : "ltr"}>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t.notifications.title}</h1>
              {unread > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {unread} {t.notifications.unreadStatus}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                <span className={isRTL ? "mr-2" : "ml-2"}>{t.notifications.refresh}</span>
              </Button>

              {unread > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleMarkAllRead}
                >
                  {t.notifications.markAllAsRead}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Status Tabs */}
            <Tabs value={statusFilter} onValueChange={handleStatusChange}>
              <TabsList>
                <TabsTrigger value="all">{t.notifications.all}</TabsTrigger>
                <TabsTrigger value="unread">{t.notifications.unread}</TabsTrigger>
                <TabsTrigger value="read">{t.notifications.read}</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Type Filter */}
            <Select value={typeFilter || "all"} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                <SelectValue placeholder={t.notifications.filterByType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.notifications.allTypes}</SelectItem>
                {NOTIFICATION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t.notifications.types[type as keyof typeof t.notifications.types] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Count */}
          {total > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t.notifications.showing} {Math.min(notifications.length + offset, total)} {t.notifications.of} {total}
            </p>
          )}
        </Card>

        {/* Notifications List */}
        {isLoading && notifications.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">{t.common.loading}</p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <Card className="flex h-64 items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-medium text-muted-foreground">
                {t.notifications.noNotifications}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.notifications.noNotificationsDesc}
              </p>
            </div>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  showFullBody={true}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className={`h-4 w-4 animate-spin ${isRTL ? "ml-2" : "mr-2"}`} />
                      {t.common.loading}
                    </>
                  ) : (
                    t.notifications.loadMore
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
