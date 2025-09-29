import React from 'react';
import { Badge as ShadcnBadge } from '@/components/ui/badge';

// Re-export the base Badge component
export { Badge } from '@/components/ui/badge';

// Status-specific badge components with our existing logic
export function AttendanceBadge({ status }: { status: 'present' | 'absent' | 'late' }) {
  const variants = {
    present: 'default' as const, // Green-like in our color scheme
    absent: 'destructive' as const, // Red
    late: 'secondary' as const // Yellow-like
  };

  const labels = {
    present: 'Present',
    absent: 'Absent',
    late: 'Late'
  };

  return (
    <ShadcnBadge variant={variants[status]} className={
      status === 'present' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
      status === 'late' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' : 
      undefined
    }>
      {labels[status]}
    </ShadcnBadge>
  );
}

export function AssignmentStatusBadge({ status }: { status: 'pending' | 'submitted' | 'graded' | 'overdue' }) {
  const variants = {
    pending: 'outline' as const,
    submitted: 'default' as const,
    graded: 'default' as const,
    overdue: 'destructive' as const
  };

  const labels = {
    pending: 'Pending',
    submitted: 'Submitted',
    graded: 'Graded',
    overdue: 'Overdue'
  };

  return (
    <ShadcnBadge 
      variant={variants[status]} 
      className={
        status === 'submitted' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
        status === 'graded' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
        undefined
      }
    >
      {labels[status]}
    </ShadcnBadge>
  );
}