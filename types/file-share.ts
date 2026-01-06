/**
 * File Share API Types
 * Types for the MOE file server integration
 */

/**
 * Request payload for file upload (FormData)
 */
export type FileUploadRequest = {
  ReferenceNumber: string;
  ReferenceName: string;
  File: File;
};

/**
 * Response from file server after successful upload
 */
export type FileUploadData = {
  fileId?: string;
  fileName?: string;
  fileUrl?: string;
  [key: string]: unknown;
};

/**
 * API response wrapper
 */
export type FileUploadResponse = {
  ok: boolean;
  data?: FileUploadData;
  error?: string;
  meta?: {
    uploadedAt: string;
    fileName: string;
    fileSize: number;
    referenceNumber: string;
    referenceName: string;
  };
};

/**
 * File upload options
 */
export type FileUploadOptions = {
  referenceNumber: string;
  referenceName: string;
  file: File;
  onProgress?: (progress: number) => void;
};

/**
 * File validation result
 */
export type FileValidationResult = {
  valid: boolean;
  error?: string;
};

/**
 * File constraints
 */
export const FILE_CONSTRAINTS = {
  MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  MAX_SIZE_LABEL: '5 MB',
  ALLOWED_TYPES: ['application/pdf'],
  ALLOWED_EXTENSIONS: ['.pdf'],
} as const;
