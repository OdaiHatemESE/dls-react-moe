"use client";

import { format, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  GraduationCap,
  FileEdit,
  FileCheck,
  Megaphone,
  MapPin,
  Phone,
  Bus,
  Clock,
  User,
  Calendar,
} from "lucide-react";
import type { KeyboardEvent } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Notification, NotificationType } from "@/types/notification";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/app/i18n/I18nProvider";

interface NotificationCardProps {
  notification: Notification;
  onRead?: (id: number) => void;
  showFullBody?: boolean;
}

// Icon mapping for notification types
const iconMap: Record<NotificationType, any> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  enrollment: GraduationCap,
  update: FileEdit,
  conduct: FileCheck,
  announcement: Megaphone,
  // Backend notification types
  StatusChange: CheckCircle,
  AddressUpdate: MapPin,
  ContactUpdate: Phone,
  TransportationUpdate: Bus,
  DataUpdate: Info,
};

// Color mapping for notification types (icon and border color)
const colorMap: Record<NotificationType, string> = {
  info: "text-blue-600 dark:text-blue-500",
  success: "text-green-600 dark:text-green-500",
  warning: "text-amber-500 dark:text-amber-400",
  error: "text-red-600 dark:text-red-500",
  enrollment: "text-purple-600 dark:text-purple-500",
  update: "text-orange-600 dark:text-orange-500",
  conduct: "text-indigo-600 dark:text-indigo-500",
  announcement: "text-pink-600 dark:text-pink-500",
  // Backend notification types
  StatusChange: "text-green-600 dark:text-green-500",
  AddressUpdate: "text-blue-600 dark:text-blue-500",
  ContactUpdate: "text-purple-600 dark:text-purple-500",
  TransportationUpdate: "text-orange-600 dark:text-orange-500",
  DataUpdate: "text-gray-600 dark:text-gray-500",
};

// Background color for notifications
const bgColorMap: Record<NotificationType, string> = {
  info: "bg-blue-50/50 dark:bg-blue-950/20",
  success: "bg-green-50/50 dark:bg-green-950/20",
  warning: "bg-amber-50/50 dark:bg-amber-950/20",
  error: "bg-red-50/50 dark:bg-red-950/20",
  enrollment: "bg-purple-50/50 dark:bg-purple-950/20",
  update: "bg-orange-50/50 dark:bg-orange-950/20",
  conduct: "bg-indigo-50/50 dark:bg-indigo-950/20",
  announcement: "bg-pink-50/50 dark:bg-pink-950/20",
  // Backend notification types
  StatusChange: "bg-green-50/50 dark:bg-green-950/20",
  AddressUpdate: "bg-blue-50/50 dark:bg-blue-950/20",
  ContactUpdate: "bg-purple-50/50 dark:bg-purple-950/20",
  TransportationUpdate: "bg-orange-50/50 dark:bg-orange-950/20",
  DataUpdate: "bg-gray-50/50 dark:bg-gray-950/20",
};

// Border color for notifications
const borderColorMap: Record<NotificationType, string> = {
  info: "border-l-blue-600",
  success: "border-l-green-600",
  warning: "border-l-amber-500",
  error: "border-l-red-600",
  enrollment: "border-l-purple-600",
  update: "border-l-orange-600",
  conduct: "border-l-indigo-600",
  announcement: "border-l-pink-600",
  // Backend notification types
  StatusChange: "border-l-green-600",
  AddressUpdate: "border-l-blue-600",
  ContactUpdate: "border-l-purple-600",
  TransportationUpdate: "border-l-orange-600",
  DataUpdate: "border-l-gray-600",
};

// Badge variant mapping
const statusBadgeClassMap: Record<NotificationType, string> = {
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  success: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  error: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  enrollment: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  update: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  conduct: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  announcement: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  StatusChange: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  AddressUpdate: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ContactUpdate: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  TransportationUpdate: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  DataUpdate: "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300",
};

// Status description color coding
const getStatusColorClass = (status: string): string => {
  const statusLower = status.toLowerCase();
  
  // Approved/Accepted states
  if (statusLower.includes('موافق') || statusLower.includes('مقبول') || statusLower.includes('approved') || statusLower.includes('accepted')) {
    return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300";
  }
  
  // Pending/In Progress states
  if (statusLower.includes('قيد') || statusLower.includes('pending') || statusLower.includes('in progress') || statusLower.includes('processing')) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300";
  }
  
  // Rejected/Cancelled states
  if (statusLower.includes('مرفوض') || statusLower.includes('ملغى') || statusLower.includes('rejected') || statusLower.includes('cancelled')) {
    return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300";
  }
  
  // Default neutral
  return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
};



/**
 * Individual notification card component
 */
export function NotificationCard({
  notification,
  onRead,
  showFullBody = false,
}: NotificationCardProps) {
  const router = useRouter();
  const { locale } = useI18n();
  const Icon = iconMap[notification.type as NotificationType] || Info;
  const iconColor = colorMap[notification.type as NotificationType] || "text-gray-500";
  const bgColor = bgColorMap[notification.type as NotificationType] || "bg-gray-50 dark:bg-gray-950/30";
  const borderColor = borderColorMap[notification.type as NotificationType] || "border-l-gray-500";

  // Parse data
  const data = typeof notification.data === "string" 
    ? JSON.parse(notification.data) 
    : notification.data;

  // Handle click
  const handleClick = () => {
    // Mark as read if unread
    if (!notification.isRead && onRead) {
      onRead(notification.id);
    }

    // Navigate if there's a link
    if (data?.link) {
      router.push(data.link);
    }
  };

  // Format time - both relative and absolute
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: locale === "ar" ? ar : enUS,
  });

  const fullDate = format(new Date(notification.createdAt), "PPp", {
    locale: locale === "ar" ? ar : enUS,
  });

  // Get friendly type label
  const { t } = useI18n();
  const typeLabel = t.notifications.types[notification.type as keyof typeof t.notifications.types] || notification.type;

  const accentColor = iconColor.replace(/text-/g, "bg-");
  const ringColor = iconColor.replace(/text-/g, "ring-");
  const isUnread = !notification.isRead;
  const statusTone = statusBadgeClassMap[notification.type as NotificationType] ?? "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300";
  const statusDescriptionColor = data?.statusDescription ? getStatusColorClass(data.statusDescription) : statusTone;
  const preferredStudentName = locale === "ar"
    ? notification.studentNameAr ?? notification.studentName
    : notification.studentName ?? notification.studentNameAr;
  const fallbackStudentName = !preferredStudentName && data?.mainRecord?.studentNumber
    ? (locale === "ar" ? `طالب ${data.mainRecord.studentNumber}` : `Student ${data.mainRecord.studentNumber}`)
    : undefined;
  const locationParts = [data?.mainRecord?.emirate, data?.mainRecord?.area].filter(Boolean);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  // Extract note/comment from notification data
  const note = data?.note || (typeof notification.data === 'string' && notification.data.includes('Note:') 
    ? notification.data.split('Note:')[1]?.trim() 
    : null);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative overflow-hidden rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isUnread 
          ? "border-border bg-background shadow-lg backdrop-blur-sm" + " " + bgColor
          : "border-border/30 bg-background/60 shadow-sm opacity-90",
        borderColor
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 rounded-r-full transition-all duration-200",
          accentColor,
          isUnread ? "w-1.5 opacity-100" : "w-1 opacity-40"
        )}
        aria-hidden="true"
      />

      <div className="flex items-start gap-4 px-5 py-4">
        <div
          className={cn(
            "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl shadow-sm transition-all duration-200",
            "ring-2",
            ringColor,
            isUnread 
              ? "bg-white dark:bg-gray-950/90 scale-100" 
              : "bg-white/80 dark:bg-gray-950/50 scale-95 opacity-80"
          )}
        >
          <Icon className={cn("h-6 w-6 transition-all duration-200", iconColor, isUnread ? "" : "opacity-70")} />
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          {/* Header Row */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn(
                  "h-6 rounded-full border-none px-3 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all duration-200",
                  statusTone
                )}
              >
                {typeLabel}
              </Badge>
              {isUnread && (
                <Badge
                  variant="default"
                  className="h-6 rounded-full bg-foreground text-background px-3 text-[10px] font-bold uppercase tracking-wider shadow-md animate-in fade-in zoom-in duration-300"
                >
                  {locale === "ar" ? "جديد" : "NEW"}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
              <Clock className="h-3.5 w-3.5" />
              <span>{timeAgo}</span>
            </div>
          </div>

          {/* Main Message - Student and Action */}
          <div className="space-y-2">
            {(preferredStudentName || fallbackStudentName) && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className={cn(
                  "text-base font-bold transition-colors duration-200",
                  isUnread ? "text-foreground" : "text-foreground/70"
                )}>
                  {preferredStudentName || fallbackStudentName}
                </span>
                {locationParts.length > 0 && (
                  <span className="text-sm text-muted-foreground/70">
                    ({locationParts.join(", ")})
                  </span>
                )}
              </div>
            )}
            
            <p className={cn(
              "text-[15px] leading-relaxed font-medium transition-colors duration-200",
              isUnread ? "text-foreground" : "text-foreground/70"
            )}>
              {notification.title}
            </p>
          </div>

          {/* Status Change Information */}
          {data?.statusDescription && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {locale === "ar" ? "الحالة:" : "Status:"}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "border-none px-3 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all duration-200",
                  statusDescriptionColor
                )}
              >
                {data.statusDescription}
              </Badge>
            </div>
          )}

          {/* Description/Body */}
          {notification.body && notification.body !== notification.title && (
            <p className={cn(
              "text-sm leading-relaxed transition-colors duration-200",
              isUnread ? "text-muted-foreground" : "text-muted-foreground/60",
              !showFullBody && "line-clamp-2"
            )}>
              {notification.body}
            </p>
          )}

          {/* Office Comment/Note - Bordered Section */}
          {note && (
            <div className={cn(
              "mt-3 rounded-lg border-2 p-3 transition-all duration-200",
              isUnread 
                ? "border-primary/30 bg-primary/5 dark:bg-primary/10" 
                : "border-border/50 bg-muted/30"
            )}>
              <div className="flex items-start gap-2">
                <div className={cn(
                  "flex-shrink-0 rounded-full p-1",
                  isUnread ? "bg-primary/20" : "bg-muted"
                )}>
                  <Info className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {locale === "ar" ? "ملاحظة من المكتب الخلفي:" : "Back Office Note:"}
                  </p>
                  <p className={cn(
                    "text-sm leading-relaxed",
                    isUnread ? "text-foreground font-medium" : "text-foreground/70"
                  )}>
                    {note}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer - Date */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 pt-1">
            <Calendar className="h-3 w-3" />
            <span>{fullDate}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
