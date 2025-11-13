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
  if (statusLower.includes('قيد') || statusLower.includes('مرتجع') || statusLower.includes('pending') || statusLower.includes('in progress') || statusLower.includes('processing') || statusLower.includes('returned')) {
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
  
  // Get icon based on status
  const getStatusIcon = () => {
    if (!data?.statusDescription) return CheckCircle; // Default to status change icon
    
    const status = data.statusDescription.toLowerCase();
    
    if (status.includes('موافق') || status.includes('مقبول') || status.includes('approved') || status.includes('accepted')) {
      return CheckCircle;
    }
    
    if (status.includes('قيد') || status.includes('مرتجع') || status.includes('pending') || status.includes('in progress') || status.includes('processing') || status.includes('returned')) {
      return Clock;
    }
    
    if (status.includes('مرفوض') || status.includes('ملغى') || status.includes('rejected') || status.includes('cancelled')) {
      return XCircle;
    }
    
    return CheckCircle; // Default to check circle for status changes
  };
  
  const StatusIcon = getStatusIcon();
  
  // Get icon color based on status
  const getStatusIconColor = (): string => {
    if (!data?.statusDescription) return "text-blue-600 dark:text-blue-500"; // Default blue
    
    const status = data.statusDescription.toLowerCase();
    
    if (status.includes('موافق') || status.includes('مقبول') || status.includes('approved') || status.includes('accepted')) {
      return "text-green-600 dark:text-green-500";
    }
    
    if (status.includes('قيد') || status.includes('مرتجع') || status.includes('pending') || status.includes('in progress') || status.includes('processing') || status.includes('returned')) {
      return "text-amber-600 dark:text-amber-500";
    }
    
    if (status.includes('مرفوض') || status.includes('ملغى') || status.includes('rejected') || status.includes('cancelled')) {
      return "text-red-600 dark:text-red-500";
    }
    
    return "text-blue-600 dark:text-blue-500"; // Default blue
  };
  
  const statusIconColor = getStatusIconColor();
  const statusRingColor = statusIconColor.replace(/text-/g, "ring-");
  
  // Get border color based on status
  const getStatusBorderColor = (): string => {
    if (!data?.statusDescription) return "border-primary/40";
    
    const status = data.statusDescription.toLowerCase();
    
    if (status.includes('موافق') || status.includes('مقبول') || status.includes('approved') || status.includes('accepted')) {
      return "border-green-500/50 dark:border-green-500/40";
    }
    
    if (status.includes('قيد') || status.includes('مرتجع') || status.includes('pending') || status.includes('in progress') || status.includes('processing') || status.includes('returned')) {
      return "border-amber-500/50 dark:border-amber-500/40";
    }
    
    if (status.includes('مرفوض') || status.includes('ملغى') || status.includes('rejected') || status.includes('cancelled')) {
      return "border-red-500/50 dark:border-red-500/40";
    }
    
    return "border-blue-500/50 dark:border-blue-500/40";
  };
  
  const statusBorderColor = getStatusBorderColor();
  
  // Get accent bar color based on status (for top bar)
  const getStatusAccentColor = (): string => {
    if (!data?.statusDescription) return accentColor;
    
    const status = data.statusDescription.toLowerCase();
    
    if (status.includes('موافق') || status.includes('مقبول') || status.includes('approved') || status.includes('accepted')) {
      return "bg-green-500";
    }
    
    if (status.includes('قيد') || status.includes('مرتجع') || status.includes('pending') || status.includes('in progress') || status.includes('processing') || status.includes('returned')) {
      return "bg-amber-500";
    }
    
    if (status.includes('مرفوض') || status.includes('ملغى') || status.includes('rejected') || status.includes('cancelled')) {
      return "bg-red-500";
    }
    
    return "bg-blue-500";
  };
  
  const statusAccentColor = getStatusAccentColor();
  
  // Get background color based on status
  const getStatusBackgroundColor = (): string => {
    if (!data?.statusDescription) return "bg-gradient-to-br from-primary-50/50 via-primary-50/30 to-background dark:from-primary-950/20 dark:via-primary-950/10 dark:to-background";
    
    const status = data.statusDescription.toLowerCase();
    
    if (status.includes('موافق') || status.includes('مقبول') || status.includes('approved') || status.includes('accepted')) {
      return "bg-gradient-to-br from-green-50/80 via-green-50/50 to-green-50/20 dark:from-green-950/30 dark:via-green-950/20 dark:to-green-950/10";
    }
    
    if (status.includes('قيد') || status.includes('مرتجع') || status.includes('pending') || status.includes('in progress') || status.includes('processing') || status.includes('returned')) {
      return "bg-gradient-to-br from-amber-50/80 via-amber-50/50 to-amber-50/20 dark:from-amber-950/30 dark:via-amber-950/20 dark:to-amber-950/10";
    }
    
    if (status.includes('مرفوض') || status.includes('ملغى') || status.includes('rejected') || status.includes('cancelled')) {
      return "bg-gradient-to-br from-red-50/80 via-red-50/50 to-red-50/20 dark:from-red-950/30 dark:via-red-950/20 dark:to-red-950/10";
    }
    
    return "bg-gradient-to-br from-blue-50/80 via-blue-50/50 to-blue-50/20 dark:from-blue-950/30 dark:via-blue-950/20 dark:to-blue-950/10";
  };
  
  const statusBackgroundColor = getStatusBackgroundColor();
  
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
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary cursor-pointer",
        statusBorderColor,
        statusBackgroundColor,
        isUnread 
          ? "shadow-lg hover:shadow-2xl hover:-translate-y-0.5 opacity-100" 
          : " opacity-60 hover:opacity-100"
      )}
    >
      {/* Top gradient accent bar */}
      

      {/* Header Section: Student Name & Location */}
      <div className="px-6 pt-5 pb-4 border-b border-border/30">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Student Info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {(preferredStudentName || fallbackStudentName) && (
                <h3 className={cn(
                  "text-lg font-bold leading-tight tracking-tight transition-colors",
                  isUnread ? "text-foreground" : "text-foreground/80"
                )}>
                  {preferredStudentName || fallbackStudentName}
                </h3>
              )}
              {isUnread && (
                <Badge
                  variant="outline"
                  className="h-5 rounded-md bg-gray-800 text-white border-gray-700 px-2 text-[9px] font-bold uppercase tracking-wider"
                >
                  {locale === "ar" ? "جديد" : "NEW"}
                </Badge>
              )}
            </div>
            {data?.mainRecord?.studentNumber && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{locale === "ar" ? "رقم الطالب:" : "Student #"} {data.mainRecord.studentNumber}</span>
              </div>
            )}
          </div>

          {/* Right: Type Badge & Icon */}
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl shadow-lg transition-all duration-300",
                "ring-2 ring-offset-2 ring-offset-background",
                statusRingColor,
                isUnread 
                  ? "bg-gradient-to-br from-white to-primary/15 dark:from-gray-900 dark:to-primary/25 group-hover:scale-105" 
                  : "bg-white/50 dark:bg-gray-950/30 opacity-75 group-hover:opacity-100"
              )}
            >
              <StatusIcon className={cn("h-5 w-5 transition-all", statusIconColor)} />
            </div>
          </div>
        </div>
      </div>

      {/* Office Note Compact Section */}
      {note && (
        <div className="px-6 py-3">
          <div className={cn(
            "rounded-lg px-3 py-2 transition-all duration-300 flex items-center gap-2.5",
            isUnread 
              ? "bg-white/50 dark:bg-gray-900/50" 
              : "bg-white/30 dark:bg-gray-900/30"
          )}>
            <div className={cn(
              "flex-shrink-0 rounded-md p-1.5",
              isUnread ? "bg-primary/20" : "bg-muted"
            )}>
              <FileEdit className={cn(
                "h-3.5 w-3.5",
                isUnread ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-xs leading-snug line-clamp-1",
                isUnread ? "text-foreground font-medium" : "text-foreground/75"
              )}>
                {note}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Description/Body (if different from title and no status) */}
      {notification.body && notification.body !== notification.title && !data?.statusDescription && (
        <div className="px-6 py-4">
          <p className={cn(
            "text-sm leading-relaxed",
            isUnread ? "text-foreground/90 font-medium" : "text-muted-foreground",
            !showFullBody && "line-clamp-3"
          )}>
            {notification.body}
          </p>
        </div>
      )}

      {/* Footer: Type, Current Status & Timestamp */}
      <div className="px-6 py-3.5 border-t border-border/20 bg-muted/10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Badge
            variant="outline"
            className={cn(
              "border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm",
              statusTone
            )}
          >
            {typeLabel}
          </Badge>
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* Current Status Badge */}
            {data?.statusDescription && (
              <Badge
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-lg shadow-sm",
                  statusDescriptionColor
                )}
              >
                {data.statusDescription}
              </Badge>
            )}
            
            {/* Timestamp */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title={fullDate}>
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="font-medium">{fullDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
