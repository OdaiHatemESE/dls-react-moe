/**
 * useFileUpload Hook
 * React hook for file upload functionality with progress tracking
 */

import { useState, useCallback } from 'react';
import { uploadFile, validateFile } from '@/lib/file-share';
import type { FileUploadResponse } from '@/types/file-share';

export type UseFileUploadOptions = {
  onSuccess?: (response: FileUploadResponse) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
};

export type UseFileUploadReturn = {
  upload: (file: File, referenceNumber: string, referenceName: string) => Promise<FileUploadResponse>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
  validateFile: (file: File) => { valid: boolean; error?: string };
};

/**
 * Hook for managing file uploads to MOE file server
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const { onSuccess, onError, onProgress } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File, referenceNumber: string, referenceName: string): Promise<FileUploadResponse> => {
      // Reset state
      setError(null);
      setProgress(0);
      setIsUploading(true);

      try {
        // Validate file first
        const validation = validateFile(file);
        if (!validation.valid) {
          const errorMsg = validation.error || 'File validation failed';
          setError(errorMsg);
          onError?.(errorMsg);
          return { ok: false, error: errorMsg };
        }

        // Upload file
        const result = await uploadFile({
          file,
          referenceNumber,
          referenceName,
          onProgress: (progressValue) => {
            setProgress(progressValue);
            onProgress?.(progressValue);
          },
        });

        if (result.ok) {
          setProgress(100);
          onSuccess?.(result);
        } else {
          const errorMsg = result.error || 'Upload failed';
          setError(errorMsg);
          onError?.(errorMsg);
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unexpected error during upload';
        setError(errorMsg);
        onError?.(errorMsg);
        return { ok: false, error: errorMsg };
      } finally {
        setIsUploading(false);
      }
    },
    [onSuccess, onError, onProgress]
  );

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    upload,
    isUploading,
    progress,
    error,
    reset,
    validateFile,
  };
}
