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
  category: 'school' | 'class' | 'urgent';
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
  type: 'exam' | 'event' | 'holiday' | 'meeting';
  description?: string;
}

export interface Attendance {
  date: string;
  status: 'present' | 'absent' | 'late';
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
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
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
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string;
}