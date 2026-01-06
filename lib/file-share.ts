/**
 * File Share Utility Functions
 * Helper functions for uploading files to MOE file server
 */

import type { FileUploadResponse, FileValidationResult, FileUploadOptions } from '@/types/file-share';
import { FILE_CONSTRAINTS } from '@/types/file-share';

/**
 * Validates a file before upload
 */
export function validateFile(file: File): FileValidationResult {
  if (!file) {
    return {
      valid: false,
      error: 'No file selected',
    };
  }

  // Check file type
  if (!FILE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: 'Only PDF files are allowed',
    };
  }

  // Check file extension as additional validation
  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!FILE_CONSTRAINTS.ALLOWED_EXTENSIONS.includes(extension as any)) {
    return {
      valid: false,
      error: 'File must have a .pdf extension',
    };
  }

  // Check file size
  if (file.size > FILE_CONSTRAINTS.MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds ${FILE_CONSTRAINTS.MAX_SIZE_LABEL} limit`,
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  return { valid: true };
}

/**
 * Uploads a file to the MOE file server
 */
export async function uploadFile(
  options: FileUploadOptions
): Promise<FileUploadResponse> {
  const { referenceNumber, referenceName, file, onProgress } = options;

  // Validate file first
  const validation = validateFile(file);
  if (!validation.valid) {
    return {
      ok: false,
      error: validation.error,
    };
  }

  // Validate reference fields
  if (!referenceNumber || !referenceNumber.trim()) {
    return {
      ok: false,
      error: 'Reference number is required',
    };
  }

  if (!referenceName || !referenceName.trim()) {
    return {
      ok: false,
      error: 'Reference name is required',
    };
  }

  try {
    // Create FormData
    const formData = new FormData();
    formData.append('ReferenceNumber', referenceNumber.trim());
    formData.append('ReferenceName', referenceName.trim());
    formData.append('File', file);

    // Upload with progress tracking if supported
    let response: Response;
    
    if (onProgress && typeof XMLHttpRequest !== 'undefined') {
      response = await uploadWithProgress(formData, onProgress);
    } else {
      response = await fetch('/api/file-share', {
        method: 'POST',
        body: formData,
      });
    }

    // Parse response
    const result: FileUploadResponse = await response.json();

    return result;
  } catch (error) {
    console.error('File upload error:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload with progress tracking using XMLHttpRequest
 */
function uploadWithProgress(
  formData: FormData,
  onProgress: (progress: number) => void
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(Math.round(percentComplete));
      }
    });

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Create a Response-like object
        const response = new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: new Headers(
            xhr
              .getAllResponseHeaders()
              .split('\r\n')
              .filter((line) => line)
              .reduce((acc, line) => {
                const [key, value] = line.split(': ');
                if (key && value) acc[key] = value;
                return acc;
              }, {} as Record<string, string>)
          ),
        });
        resolve(response);
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    // Send request
    xhr.open('POST', '/api/file-share');
    xhr.send(formData);
  });
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (!Number.isFinite(bytes)) return '';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Gets file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.substring(lastDot).toLowerCase();
}

/**
 * Checks if a file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return (
    file.type === 'application/pdf' ||
    getFileExtension(file.name) === '.pdf'
  );
}

/**
 * Creates a file from base64 string (useful for converting existing base64 to upload)
 */
export function base64ToFile(
  base64: string,
  filename: string,
  mimeType: string = 'application/pdf'
): File {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:[^;]+;base64,/, '');
  
  // Convert base64 to binary
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  
  return new File([blob], filename, { type: mimeType });
}

/**
 * Generates a unique reference number
 */
export function generateReferenceNumber(prefix: string = 'REF'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
