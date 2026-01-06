/**
 * File Upload Example Component
 * Demonstrates how to use the file upload API and hook
 */

'use client';

import React, { useState } from 'react';
import { useFileUpload } from '@/lib/hooks/useFileUpload';
import { formatFileSize, generateReferenceNumber } from '@/lib/file-share';
import { FILE_CONSTRAINTS } from '@/types/file-share';

export function FileUploadExample() {
  const [file, setFile] = useState<File | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [referenceName, setReferenceName] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  const { upload, isUploading, progress, error, reset, validateFile } = useFileUpload({
    onSuccess: (response) => {
      console.log('Upload successful!', response);
      if (response.data?.fileUrl) {
        setUploadedFileUrl(response.data.fileUrl);
      }
      // Reset form after successful upload
      setTimeout(() => {
        setFile(null);
        setReferenceNumber('');
        setReferenceName('');
        reset();
      }, 3000);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    },
    onProgress: (progress) => {
      console.log('Upload progress:', progress);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      const validation = validateFile(selectedFile);
      if (!validation.valid) {
        alert(validation.error);
        e.target.value = ''; // Clear input
        return;
      }
    }
    
    setFile(selectedFile);
    setUploadedFileUrl(null);
    reset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert('Please select a file');
      return;
    }

    if (!referenceNumber.trim()) {
      alert('Please enter a reference number');
      return;
    }

    if (!referenceName.trim()) {
      alert('Please enter a reference name');
      return;
    }

    await upload(file, referenceNumber.trim(), referenceName.trim());
  };

  const handleGenerateReferenceNumber = () => {
    const generated = generateReferenceNumber('UPLOAD');
    setReferenceNumber(generated);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">File Upload to MOE Server</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reference Number */}
          <div>
            <label htmlFor="referenceNumber" className="block text-sm font-medium mb-2">
              Reference Number *
            </label>
            <div className="flex gap-2">
              <input
                id="referenceNumber"
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g., REF-12345"
                className="flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                required
                disabled={isUploading}
              />
              <button
                type="button"
                onClick={handleGenerateReferenceNumber}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium disabled:opacity-50"
                disabled={isUploading}
              >
                Generate
              </button>
            </div>
          </div>

          {/* Reference Name */}
          <div>
            <label htmlFor="referenceName" className="block text-sm font-medium mb-2">
              Reference Name *
            </label>
            <input
              id="referenceName"
              type="text"
              value={referenceName}
              onChange={(e) => setReferenceName(e.target.value)}
              placeholder="e.g., Student Address Document"
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              required
              disabled={isUploading}
            />
          </div>

          {/* File Input */}
          <div>
            <label htmlFor="file" className="block text-sm font-medium mb-2">
              File (PDF only, max {FILE_CONSTRAINTS.MAX_SIZE_LABEL}) *
            </label>
            <input
              id="file"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              required
              disabled={isUploading}
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({formatFileSize(file.size)})
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-center text-gray-600">
                Uploading... {progress}%
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {uploadedFileUrl && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">
                ✓ File uploaded successfully!
              </p>
              {uploadedFileUrl && (
                <a
                  href={uploadedFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline mt-2 block"
                >
                  View uploaded file →
                </a>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUploading || !file || !referenceNumber || !referenceName}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </form>
      </div>

      {/* Documentation */}
      <div className="bg-gray-50 rounded-lg p-6 text-sm space-y-4">
        <h3 className="font-bold text-lg">Usage Notes:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Only PDF files are accepted</li>
          <li>Maximum file size: {FILE_CONSTRAINTS.MAX_SIZE_LABEL}</li>
          <li>Reference number and name are required for tracking</li>
          <li>Upload progress is shown during the upload process</li>
          <li>You must be authenticated to upload files</li>
        </ul>

        <h3 className="font-bold text-lg mt-4">API Endpoint:</h3>
        <code className="block bg-white p-3 rounded border">
          POST /api/file-share
        </code>

        <h3 className="font-bold text-lg mt-4">Programmatic Usage:</h3>
        <pre className="bg-white p-3 rounded border overflow-x-auto">
          {`import { uploadFile } from '@/lib/file-share';

const result = await uploadFile({
  file: pdfFile,
  referenceNumber: 'REF-123',
  referenceName: 'Document Name',
  onProgress: (progress) => {
    console.log(\`\${progress}%\`);
  }
});

if (result.ok) {
  console.log('Success!', result.data);
} else {
  console.error('Error:', result.error);
}`}
        </pre>
      </div>
    </div>
  );
}

export default FileUploadExample;
