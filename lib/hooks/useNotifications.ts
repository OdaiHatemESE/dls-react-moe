/**
 * useNotifications Hook
 * 
 * React hooks for fetching and managing notifications with SWR.
 * Supports auto-refresh, optimistic updates, and filtering.
 */

import useSWR from "swr";
import { jsonFetcher } from "@/lib/swr";
import type {
  Notification,
  NotificationCount,
  NotificationFilter,
} from "@/types";

/**
 * Hook to fetch and manage notifications
 * 
 * @param filter - Filter options (status, type, limit, offset)
 * @param config - SWR configuration options
 * @returns notifications, total count, loading state, and mutation functions
 */
export function useNotifications(
  filter: NotificationFilter = {},
  config?: { refreshInterval?: number }
) {
  const params = new URLSearchParams();
  
  if (filter.status) params.append("status", filter.status);
  if (filter.type) params.append("type", filter.type);
  if (filter.limit) params.append("limit", filter.limit.toString());
  if (filter.offset) params.append("offset", filter.offset.toString());

  const url = `/api/notifications?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<{
    notifications: Notification[];
    total: number;
  }>(
    url,
    jsonFetcher,
    {
      refreshInterval: config?.refreshInterval ?? 30000, // Default 30s
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  /**
   * Mark a notification as read
   */
  const markAsRead = async (id: number) => {
    try {
      // Optimistic update
      if (data) {
        mutate(
          {
            ...data,
            notifications: data.notifications.map((n) =>
              n.id === id ? { ...n, isRead: true, readAt: new Date() } : n
            ),
          },
          false // Don't revalidate immediately
        );
      }

      // Make API call
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });

      // Revalidate
      mutate();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      // Revert optimistic update on error
      mutate();
    }
  };

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    try {
      // Optimistic update
      if (data) {
        mutate(
          {
            ...data,
            notifications: data.notifications.map((n) => ({
              ...n,
              isRead: true,
              readAt: new Date(),
            })),
          },
          false
        );
      }

      // Make API call
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      // Revalidate
      mutate();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      // Revert on error
      mutate();
    }
  };

  /**
   * Manually refresh notifications
   */
  const refresh = () => mutate();

  return {
    notifications: data?.notifications ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}

/**
 * Hook to fetch notification count
 * 
 * @param config - SWR configuration options
 * @returns unread count, total count, and refresh function
 */
export function useNotificationCount(config?: { 
  refreshInterval?: number;
  showToast?: boolean;
  locale?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR<NotificationCount>(
    "/api/notifications/count",
    jsonFetcher,
    {
      refreshInterval: config?.refreshInterval ?? 30000, // Default 30s
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  // Note: Toast notifications are now handled by NotificationToastListener component
  // to prevent duplicate toasts when multiple components use this hook.
  // The showToast and locale options are kept for backward compatibility but ignored.

  return {
    count: data,
    unread: data?.unread ?? 0,
    total: data?.total ?? 0,
    isLoading,
    error,
    refresh: () => mutate(),
  };
}
