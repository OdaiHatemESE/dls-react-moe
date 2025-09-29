'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AttendanceIcon, 
  GradesIcon, 
  CalendarIcon,
  AnnouncementsIcon,
  ChevronRightIcon 
} from '../components/icons';
import { mockChildren, mockAnnouncements, mockCalendarEvents } from '../data/mockData';

export default function DashboardPage() {
  const recentAnnouncements = mockAnnouncements.slice(0, 3);
  const upcomingEvents = mockCalendarEvents.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back! Here&apos;s what&apos;s happening with your children.
        </p>
      </div>

      {/* Children Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {mockChildren.map((child) => (
          <Card key={child.id} className="relative hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{child.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {child.grade} • {child.classroom} • {child.teacher}
                  </p>
                </div>
                <Link
                  href={`/child/${child.id}`}
                  className="text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-2"
                  aria-label={`View details for ${child.name}`}
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <AttendanceIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">{child.attendanceRate}%</p>
                  <p className="text-xs text-gray-600">Attendance</p>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <GradesIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">{child.latestGrade}</p>
                  <p className="text-xs text-gray-600">Latest Grade</p>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <CalendarIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 leading-tight">{child.nextEvent}</p>
                  <p className="text-xs text-gray-600">Next Event</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Announcements */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <AnnouncementsIcon className="w-5 h-5 mr-2 text-orange-600" />
                Recent Announcements
              </CardTitle>
              <Link
                href="/announcements"
                className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAnnouncements.map((announcement) => (
                <div key={announcement.id} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {announcement.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={
                            announcement.category === 'urgent' ? 'destructive' :
                            announcement.category === 'school' ? 'default' : 'outline'
                          }
                          className="text-xs"
                        >
                          {announcement.category}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(announcement.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {recentAnnouncements.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent announcements
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-purple-600" />
                Upcoming Events
              </CardTitle>
              <Link
                href="/calendar"
                className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
              >
                View calendar
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {event.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                      {event.time && (
                        <span className="text-sm text-gray-600">
                          • {event.time}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant={
                      event.type === 'exam' ? 'secondary' :
                      event.type === 'holiday' ? 'default' : 'outline'
                    }
                    className="text-xs"
                  >
                    {event.type}
                  </Badge>
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No upcoming events
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}