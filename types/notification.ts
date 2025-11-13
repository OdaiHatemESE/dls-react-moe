export type NotificationType = 
  | "info" 
  | "success" 
  | "warning" 
  | "error" 
  | "enrollment" 
  | "update"
  | "conduct"
  | "announcement"
  // Backend notification types
  | "StatusChange"
  | "AddressUpdate"
  | "ContactUpdate"
  | "TransportationUpdate"
  | "DataUpdate";

export interface Notification {
  id: number;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: string; // JSON string with additional metadata
  isRead: boolean;
  createdAt: Date;
  readAt: Date | null;
  // Student name fields (populated by API)
  studentName?: string;
  studentNameAr?: string;
}

export interface NotificationData {
  // Frontend notification data
  link?: string;
  action?: string;
  metadata?: Record<string, any>;
  
  // Backend notification data
  sourceHistoryId?: number;
  sourceMainId?: number;
  userId?: number;  // User who made the change
  description?: string;  // Supports Arabic text
  note?: string;
  dateTime?: string;
  statusDescription?: string;
  mainRecord?: {
    studentNumber?: string;
    schoolId?: string;
    status?: number;
    transportationType?: string;
    primaryPhone?: string;
    emirate?: string;
    area?: string;
    [key: string]: any;
  };
}

export interface NotificationCount {
  total: number;
  unread: number;
}

export interface NotificationFilter {
  status?: "all" | "read" | "unread";
  type?: NotificationType;
  limit?: number;
  offset?: number;
}
