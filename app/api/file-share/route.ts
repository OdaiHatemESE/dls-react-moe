import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchWithTimeout, FetchTimeoutError } from '@/lib/fetch-with-timeout';

// Timeout configuration
const FILE_UPLOAD_TIMEOUT_MS = 30000; // 30 seconds for file uploads

export const dynamic = 'force-dynamic';

// File server configuration
const FILE_SERVER_URL = process.env.FILE_SERVER_URL || 'https://apps.moe.gov.ae/file/api/File';
const FILE_SERVER_CLIENT_ID = process.env.FILE_SERVER_CLIENT_ID || '';
const FILE_SERVER_USERNAME = process.env.FILE_SERVER_USERNAME || '';
const FILE_SERVER_PASSWORD = process.env.FILE_SERVER_PASSWORD || '';

type FileUploadResponse = {
  ok: boolean;
  data?: {
    fileId?: string;
    fileName?: string;
    fileUrl?: string;
    [key: string]: unknown;
  };
  error?: string;
};

async function requireSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  return session;
}

/**
 * POST /api/file-share
 * Uploads a file to the MOE file server
 * 
 * Expects multipart/form-data with:
 * - ReferenceNumber: string
 * - ReferenceName: string
 * - File: file (PDF)
 */
export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    // Require authentication
    const session = await requireSession();
    if (!session?.user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Validate file server configuration
    if (!FILE_SERVER_CLIENT_ID || !FILE_SERVER_USERNAME || !FILE_SERVER_PASSWORD) {
      console.error('File server credentials not configured');
      return NextResponse.json(
        { ok: false, error: 'File server not configured' },
        { status: 500 }
      );
    }

    // Parse the incoming form data
    const formData = await req.formData();
    const referenceNumber = formData.get('ReferenceNumber') as string | null;
    const referenceName = formData.get('ReferenceName') as string | null;
    const file = formData.get('File') as File | null;

    // Validate required fields
    if (!referenceNumber) {
      return NextResponse.json(
        { ok: false, error: 'ReferenceNumber is required' },
        { status: 400 }
      );
    }

    if (!referenceName) {
      return NextResponse.json(
        { ok: false, error: 'ReferenceName is required' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file type (PDF only based on API docs)
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { ok: false, error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit based on common practice)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Create form data for the file server
    const uploadFormData = new FormData();
    uploadFormData.append('ReferenceNumber', referenceNumber);
    uploadFormData.append('ReferenceName', referenceName);
    uploadFormData.append('File', file);

    // Generate Basic Auth token
    const authString = `${FILE_SERVER_USERNAME}:${FILE_SERVER_PASSWORD}`;
    const base64Auth = Buffer.from(authString).toString('base64');

    console.log('Uploading file to file server:', {
      url: FILE_SERVER_URL,
      referenceNumber,
      referenceName,
      fileName: file.name,
      fileSize: file.size,
    });

    // Upload to file server
    const uploadRes = await fetchWithTimeout(FILE_SERVER_URL, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'ClientId': FILE_SERVER_CLIENT_ID,
        'UserId': FILE_SERVER_USERNAME,
        'Authorization': `Basic ${base64Auth}`,
        // Don't set Content-Type - let FormData set it with boundary
      },
      body: uploadFormData,
      timeoutMs: FILE_UPLOAD_TIMEOUT_MS,
    });

    if (!uploadRes.ok) {
      console.error('File server upload failed:', {
        status: uploadRes.status,
        statusText: uploadRes.statusText,
      });

      const errorText = await uploadRes.text().catch(() => null);
      return NextResponse.json(
        {
          ok: false,
          error: errorText || `File server returned ${uploadRes.status}`,
        },
        { status: uploadRes.status }
      );
    }

    // Parse response
    const responseData = await uploadRes.json().catch(async () => {
      // If JSON parsing fails, return text
      const text = await uploadRes.text();
      return { raw: text };
    });

    console.log('File upload successful:', {
      duration: Date.now() - startTime,
      responseData,
    });

    return NextResponse.json({
      ok: true,
      data: responseData,
      meta: {
        uploadedAt: new Date().toISOString(),
        fileName: file.name,
        fileSize: file.size,
        referenceNumber,
        referenceName,
      },
    } as FileUploadResponse);

  } catch (err: unknown) {
    console.error('Error uploading file:', err);
    
    // Handle timeout errors specifically
    if (err instanceof FetchTimeoutError) {
      return NextResponse.json(
        { ok: false, error: 'File upload timed out. Please try again.' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      {
        ok: false,
        error: (typeof err === 'object' && err && 'message' in err)
          ? String((err as any).message)
          : String(err),
      },
      { status: 500 }
    );
  }
}
