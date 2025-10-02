// Centralized shared types for the app
import type { ComponentType, SVGProps } from "react";

// --- App domain types ---
export interface Child {
  id: string;
  name: string;
  grade: string;
  classroom: string;
  teacher: string;
  avatar: string;
  attendanceRate: number;
  latestGrade: string;
  nextEvent: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  category: "school" | "class" | "urgent";
  tags: string[];
}

export interface Message {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
}

export interface MessageThread {
  id: string;
  participants: string[];
  subject: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: "exam" | "event" | "holiday" | "meeting";
  description?: string;
}

export interface Attendance {
  date: string;
  status: "present" | "absent" | "late";
  notes?: string;
}

export interface Grade {
  id: string;
  subject: string;
  assignment: string;
  grade: string;
  maxGrade: string;
  date: string;
  teacher: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded" | "overdue";
  description?: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  children: Child[];
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
  };
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  badge?: string;
}

// --- Header/Menu types ---
export interface MenuLink {
  label: string;
  href: string;
  icon?: string;
  key?: string;
}

export interface MenuGroup {
  title?: string | null;
  links: MenuLink[];
}

export interface MenuItem {
  label: string;
  href?: string;
  icon?: string;
  key?: string;
  children?: MenuGroup[];
}

export interface MenuData {
  items: MenuItem[];
}

// --- OneRoster derived types used in lib/roster-repo ---
export type Person = {
  sourcedId: string;
  givenName?: string;
  familyName?: string;
  email?: string;
};

export type StudentBasic = {
  sourcedId: string;
  givenName?: string;
  familyName?: string;
  grade?: string;
  username?: string;
};

export type SchoolEnrollment = {
  sourcedId: string;
  entryType: string;
  exitType: string;
  note: string;
  exitReason: string;
  entryDate: string;
  student: {
    href: string;
    sourcedId: string;
    type: string;
  };
  session: {
    href: string;
    sourcedId: string;
    type: string;
  };
  community: {
    href: string;
    sourcedId: string;
    type: string;
  };
  dateLastModified: string;
  isSpecialNeed: boolean;
  school: {
    href: string;
    sourcedId: string;
    type: string;
  };
  schoolYear: number;
  streamGrade: {
    href: string;
    sourcedId: string;
    type: string;
  };
  enrollmentType: string;
  exitDate: string;
  status: string;
  isMandatoryEducation: string;
  createDate: string;
};

// --- UI hook types ---
export type StudentCard = {
  id: string;
  englishFirstName: string;
  englishSecondName: string;
  englishThirdName: string;
  englishFamilyName: string;

  arabicName: string;
  arabicSecondName: string;
  arabicThirdName: string;
  arabicFamilyName: string;
  nationalityEnglish: string;
  nationalityArabic: string;
  gender: string;
  birthDate: string;
};
