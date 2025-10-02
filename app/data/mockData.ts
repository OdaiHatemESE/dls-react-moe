import { Child, Announcement, MessageThread, Message, CalendarEvent, Attendance, Grade, Assignment, Parent, Person } from '@/types';

export const mockChildren: Child[] = [
  {
    id: 'SST-1-1-Pers-1687158',
    name: 'Sarah Johnson',
    grade: '5th Grade',
    classroom: 'Room 201',
    teacher: 'Ms. Martinez',
    avatar: '/api/placeholder/32/32',
    attendanceRate: 95,
    latestGrade: 'A-',
    nextEvent: 'Science Fair - Oct 15'
  },
  {
    id: 'child-2',
    name: 'Michael Johnson',
    grade: '3rd Grade',
    classroom: 'Room 105',
    teacher: 'Mr. Thompson',
    avatar: '/api/placeholder/32/32',
    attendanceRate: 88,
    latestGrade: 'B+',
    nextEvent: 'Field Trip - Oct 12'
  }
];

export const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Parent-Teacher Conferences Scheduled',
    content: 'Parent-teacher conferences are scheduled for October 25-27. Please sign up for your preferred time slot through the school portal.',
    author: 'Principal Johnson',
    date: '2025-09-28',
    category: 'school',
    tags: ['conferences', 'meetings']
  },
  {
    id: 'ann-2',
    title: 'Halloween Costume Guidelines',
    content: 'Students may wear costumes on October 31st. Please ensure costumes are appropriate and safe for school activities.',
    author: 'Ms. Martinez',
    date: '2025-09-27',
    category: 'class',
    tags: ['events', 'costumes']
  },
  {
    id: 'ann-3',
    title: 'Early Dismissal - Weather Alert',
    content: 'Due to expected severe weather, school will dismiss 2 hours early today. Buses will run on modified schedule.',
    author: 'District Office',
    date: '2025-09-29',
    category: 'urgent',
    tags: ['weather', 'dismissal', 'urgent']
  }
];

export const mockMessageThreads: MessageThread[] = [
  {
    id: 'thread-1',
    participants: ['Ms. Martinez', 'Parent'],
    subject: 'Sarah\'s Math Progress',
    lastMessage: 'Thank you for the update. I\'ll work with her at home.',
    lastMessageTime: '2025-09-28T10:30:00Z',
    unreadCount: 0,
    avatar: '/api/placeholder/40/40'
  },
  {
    id: 'thread-2',
    participants: ['Mr. Thompson', 'Parent'],
    subject: 'Field Trip Permission',
    lastMessage: 'Form has been submitted. Michael is excited!',
    lastMessageTime: '2025-09-27T14:15:00Z',
    unreadCount: 1,
    avatar: '/api/placeholder/40/40'
  },
  {
    id: 'thread-3',
    participants: ['School Nurse', 'Parent'],
    subject: 'Medication Reminder',
    lastMessage: 'Please send updated prescription with Michael tomorrow.',
    lastMessageTime: '2025-09-26T08:45:00Z',
    unreadCount: 2,
    avatar: '/api/placeholder/40/40'
  }
];

export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    threadId: 'thread-1',
    from: 'Ms. Martinez',
    to: 'Parent',
    subject: 'Sarah\'s Math Progress',
    content: 'Hi! I wanted to update you on Sarah\'s recent math performance. She\'s been doing excellent work on fractions and has shown great improvement.',
    timestamp: '2025-09-28T09:00:00Z',
    read: true,
    avatar: '/api/placeholder/32/32'
  },
  {
    id: 'msg-2',
    threadId: 'thread-1',
    from: 'Parent',
    to: 'Ms. Martinez',
    subject: 'Re: Sarah\'s Math Progress',
    content: 'Thank you for the update. I\'ll work with her at home.',
    timestamp: '2025-09-28T10:30:00Z',
    read: true
  }
];

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Field Trip - Science Museum',
    date: '2025-10-12',
    time: '9:00 AM',
    type: 'event',
    description: '3rd grade field trip to the Science Museum'
  },
  {
    id: 'event-2',
    title: 'Math Quiz',
    date: '2025-10-15',
    time: '10:00 AM',
    type: 'exam'
  },
  {
    id: 'event-3',
    title: 'Parent-Teacher Conferences',
    date: '2025-10-25',
    type: 'meeting',
    description: 'Individual conferences with teachers'
  },
  {
    id: 'event-4',
    title: 'Halloween Break',
    date: '2025-10-31',
    type: 'holiday'
  }
];

export const mockAttendance: Attendance[] = [
  { date: '2025-09-29', status: 'present' },
  { date: '2025-09-28', status: 'present' },
  { date: '2025-09-27', status: 'late', notes: 'Doctor appointment' },
  { date: '2025-09-26', status: 'present' },
  { date: '2025-09-25', status: 'present' },
  { date: '2025-09-24', status: 'absent', notes: 'Sick' },
  { date: '2025-09-23', status: 'present' },
  { date: '2025-09-22', status: 'present' }
];

export const mockGrades: Grade[] = [
  {
    id: 'grade-1',
    subject: 'Mathematics',
    assignment: 'Chapter 3 Quiz',
    grade: '92',
    maxGrade: '100',
    date: '2025-09-28',
    teacher: 'Ms. Martinez'
  },
  {
    id: 'grade-2',
    subject: 'English',
    assignment: 'Book Report',
    grade: '88',
    maxGrade: '100',
    date: '2025-09-25',
    teacher: 'Ms. Martinez'
  },
  {
    id: 'grade-3',
    subject: 'Science',
    assignment: 'Lab Experiment',
    grade: '95',
    maxGrade: '100',
    date: '2025-09-22',
    teacher: 'Mr. Wilson'
  }
];

export const mockAssignments: Assignment[] = [
  {
    id: 'assign-1',
    title: 'Reading Comprehension Worksheet',
    subject: 'English',
    dueDate: '2025-10-02',
    status: 'pending',
    description: 'Complete pages 45-47 in reading workbook'
  },
  {
    id: 'assign-2',
    title: 'Math Problem Set 4',
    subject: 'Mathematics',
    dueDate: '2025-10-05',
    status: 'pending'
  },
  {
    id: 'assign-3',
    title: 'Science Fair Project',
    subject: 'Science',
    dueDate: '2025-10-15',
    status: 'pending',
    description: 'Choose a topic and submit proposal'
  }
];

export const mockParent: Parent = {
  id: 'parent-1',
  name: 'Jennifer Johnson',
  email: 'jennifer.johnson@email.com',
  phone: '(555) 123-4567',
  avatar: '/api/placeholder/40/40',
  children: mockChildren,
  preferences: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  }
};

// Mock OneRoster Person payload (parent)
export const mockPerson: Person = {
  role: "parent",
  metadata: {
    englishSecondName: "",
    birthName: "",
    birthDate: "1987-01-24",
    maritalStatus: "Married",
    birthCountry: "Jordan",
    birthCity: "عمان",
    nationalityArabic: "الأردن",
    englishThirdName: "",
    gender: "Male",
    englishFirstName: "UDAI",
    religion: "Muslim",
    englishBirthCity: "AMMAN",
    birthCountryArabic: "الأردن",
    englishFamilyName: "HATEM ALI",
    roleList: "parent",
    nationality: "Jordan",
    contacts: [
      { note: "", contactType: "Mobile", isPrivate: false, value: "0501181502" },
      { note: "", contactType: "EMail", isPrivate: false, value: "odaihatem@gmail.com" }
    ],
    englishFourthName: "",
    activeRoleList: "",
    addresses: [
      {
        country: "United Arab Emirates",
        zipCode: "",
        city: "عجمان",
        isVerified: false,
        latitude: "",
        poBox: "",
        roadNumber: "",
        plotId: "",
        addressLine1: "",
        plotNumber: "",
        addressLine2: "",
        addressLine3: "",
        state: "AJMAN",
        region: "",
        sector: "",
        longitude: ""
      }
    ]
  },
  grades: "",
  type: "Real User",
  password: "Y+JpyFqzS0gm+Ox09BtYi5Sbg/+07AfpaiLz71QGqAIdaboyYNLb4ocGvXaB8ZwFihn3HveH893x6KQfbv0T+h+dTOiieXC87m8J1v4g0lg=",
  dateLastModified: "2021-09-01T05:13:09.638Z",
  familyName: "حاتم على",
  userIds: "2766984",
  sms: "0501181502",
  email: "odaihatem@gmail.com",
  sourcedId: "SST-1-1-Pers-2766984",
  identifier: "784198791735438",
  enabledUser: "true",
  givenName: "عدى",
  agents: "",
  phone: "0501181502",
  middleName: "",
  status: "active",
  username: "odaihatem@gmail.com"
};