'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceBadge, AssignmentStatusBadge } from '../../components/custom/Badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Breadcrumb } from '../../components/custom/Breadcrumb';
import { EmptyState } from '../../components/custom/States';
import { 
    AttendanceIcon, 
  GradesIcon, 
  AssignmentsIcon,
  DownloadIcon,
  CalendarIcon,
  LoadingIcon
} from '../../components/icons';
import { 
  mockChildren, 
  mockAttendance, 
  mockGrades, 
  mockAssignments 
} from '../../data/mockData';

export default function ChildDetailPage() {
  const params = useParams();
  const childId = params.id as string;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  const child = mockChildren.find(c => c.id === childId);

  if (!child) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EmptyState
          title="Child Not Found"
          description="The child you're looking for doesn't exist or you don't have access to view their information."
          action={{
            label: 'Go to Dashboard',
            onClick: () => window.location.href = '/dashboard'
          }}
        />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: AttendanceIcon },
    { id: 'attendance', label: 'Attendance', icon: AttendanceIcon },
    { id: 'grades', label: 'Grades', icon: GradesIcon },
    { id: 'assignments', label: 'Assignments', icon: AssignmentsIcon }
  ];

  const attendanceStats = {
    present: mockAttendance.filter(a => a.status === 'present').length,
    absent: mockAttendance.filter(a => a.status === 'absent').length,
    late: mockAttendance.filter(a => a.status === 'late').length,
    total: mockAttendance.length
  };

  const handleDownloadReport = () => {
    setIsLoading(true);
    // Simulate download
    setTimeout(() => {
      setIsLoading(false);
      alert('Download started! (This is a demo)');
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Children', href: '/dashboard' },
          { label: child.name }
        ]}
        className="mb-6"
      />

      {/* Mobile child switcher */}
      <div className="lg:hidden mb-6">
        <label htmlFor="child-switcher" className="block text-sm font-medium text-gray-700 mb-1">
          Select child
        </label>
        <select
          id="child-switcher"
          value={childId}
          onChange={(e) => router.push(`/child/${e.target.value}`)}
          className="appearance-none w-full bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {mockChildren.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Children list (desktop) */}
        <aside className="hidden lg:block lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Your Children</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="space-y-2" aria-label="Children list">
                {mockChildren.map((c) => {
                  const isActiveChild = c.id === childId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => router.push(`/child/${c.id}`)}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isActiveChild
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                      aria-current={isActiveChild ? 'page' : undefined}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={c.avatar} alt={c.name} />
                        <AvatarFallback>
                          {c.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className={`truncate text-sm font-medium ${isActiveChild ? 'text-blue-800' : 'text-gray-900'}`}>{c.name}</p>
                        <p className="truncate text-xs text-gray-500">{c.grade}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium ${c.attendanceRate >= 90 ? 'text-green-600' : 'text-amber-600'}`}>{c.attendanceRate}%</span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* Main content */}
        <section className="lg:col-span-9">
          {/* Child Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{child.name}</h1>
                <p className="mt-1 text-sm text-gray-600">
                  {child.grade} • {child.classroom} • {child.teacher}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-green-600">{child.attendanceRate}%</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white rounded-t-md ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Attendance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AttendanceIcon className="w-5 h-5 mr-2 text-green-600" />
                Attendance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Present</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{attendanceStats.present}</span>
                    <AttendanceBadge status="present" />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Late</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{attendanceStats.late}</span>
                    <AttendanceBadge status="late" />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Absent</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{attendanceStats.absent}</span>
                    <AttendanceBadge status="absent" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Latest Grades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GradesIcon className="w-5 h-5 mr-2 text-blue-600" />
                Latest Grades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockGrades.slice(0, 3).map((grade) => (
                  <div key={grade.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{grade.subject}</p>
                      <p className="text-xs text-gray-500">{grade.assignment}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {grade.grade}/{grade.maxGrade}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(grade.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AssignmentsIcon className="w-5 h-5 mr-2 text-purple-600" />
                Upcoming Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockAssignments.filter(a => a.status === 'pending').slice(0, 3).map((assignment) => (
                  <div key={assignment.id} className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{assignment.title}</p>
                        <p className="text-xs text-gray-500">{assignment.subject}</p>
                      </div>
                      <div className="text-right ml-4">
                        <AssignmentStatusBadge status={assignment.status} />
                        <p className="text-xs text-gray-500 mt-1">
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
          )}

          {activeTab === 'attendance' && (
            <Card>
          <CardHeader>
            <CardTitle>Attendance Calendar</CardTitle>
            <p className="text-sm text-gray-600">Monthly view of attendance records</p>
          </CardHeader>
          <CardContent>
            {/* Attendance Legend */}
            <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Present</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Late</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Absent</span>
              </div>
            </div>

            {/* Attendance List (simplified calendar view) */}
            <div className="space-y-2">
              {mockAttendance.map((record, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      record.status === 'present' ? 'bg-green-500' :
                      record.status === 'late' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium">
                      {new Date(record.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AttendanceBadge status={record.status} />
                    {record.notes && (
                      <span className="text-xs text-gray-500">({record.notes})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
            </Card>
          )}

          {activeTab === 'grades' && (
            <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Grades & Tests</CardTitle>
                <p className="text-sm text-gray-600">Recent test scores and assignments</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadReport}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <LoadingIcon className="w-4 h-4 mr-2" />
                ) : (
                  <DownloadIcon className="w-4 h-4" />
                )}
                <span>{isLoading ? 'Downloading...' : 'Download Report Card'}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockGrades.map((grade) => (
                    <tr key={grade.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {grade.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {grade.assignment}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-semibold text-gray-900">
                          {grade.grade}/{grade.maxGrade}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({Math.round((parseInt(grade.grade) / parseInt(grade.maxGrade)) * 100)}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(grade.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {grade.teacher}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
            </Card>
          )}

          {activeTab === 'assignments' && (
            <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
            <p className="text-sm text-gray-600">All assignments with due dates and status</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAssignments.map((assignment) => (
                <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900 mb-1">
                        {assignment.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">{assignment.subject}</p>
                      {assignment.description && (
                        <p className="text-sm text-gray-700 mb-3">{assignment.description}</p>
                      )}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        <AssignmentStatusBadge status={assignment.status} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}