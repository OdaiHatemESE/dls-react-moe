import { NextResponse } from 'next/server';
import { getActiveAcademicYear } from '@/lib/admin-config';
import { metricsTracker } from '@/lib/metrics-tracker';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const endpoint = '/api/admin/academic-year/active';
  
  try {
    const activeYear = await getActiveAcademicYear();
    
    if (!activeYear) {
      // Return current year as default if no active academic year is set
      const currentYear = new Date().getFullYear();
      metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
      return NextResponse.json({
        yearValue: currentYear,
        isDefault: true,
        message: 'No active academic year configured, using current year',
      });
    }

    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return NextResponse.json({
      id: activeYear.id,
      academicYear: activeYear.academicYear,
      yearValue: activeYear.yearValue,
      isActive: activeYear.isActive,
      description: activeYear.description,
      createdAt: activeYear.createdAt,
      updatedAt: activeYear.updatedAt,
      isDefault: false,
    });
  } catch (error) {
    console.error('Error fetching active academic year:', error);
    
    // Return current year as fallback
    const currentYear = new Date().getFullYear();
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
    return NextResponse.json({
      yearValue: currentYear,
      isDefault: true,
      error: 'Failed to fetch active academic year',
    }, { status: 500 });
  }
}
