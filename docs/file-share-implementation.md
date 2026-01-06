# File Share API Implementation Summary

## Overview

A complete file upload system for integrating with the MOE file server at `https://apps.moe.gov.ae/file/api/File`. The implementation includes API routes, type definitions, utility functions, React hooks, and example components.

## Files Created

### 1. API Route
**`app/api/file-share/route.ts`**
- Main API endpoint for file uploads
- Handles authentication, validation, and proxy to MOE file server
- Supports multipart/form-data requests
- Includes timeout handling (30s) and comprehensive error handling
- Uses HTTP Basic Authentication with environment-based credentials

### 2. API Documentation
**`app/api/file-share/README.md`**
- Complete API documentation
- Request/response formats
- Authentication details
- Usage examples for staging and production
- Error handling guide

### 3. Type Definitions
**`types/file-share.ts`**
- TypeScript types for file upload requests and responses
- File validation types
- File constraints constants (5MB max, PDF only)

### 4. Utility Functions
**`lib/file-share.ts`**
- `validateFile()` - Validates file type, size, and content
- `uploadFile()` - Main upload function with progress tracking
- `formatFileSize()` - Formats bytes to human-readable sizes
- `isPDFFile()` - Checks if a file is a PDF
- `base64ToFile()` - Converts base64 strings to File objects
- `generateReferenceNumber()` - Generates unique reference IDs

### 5. React Hook
**`lib/hooks/useFileUpload.ts`**
- Custom React hook for file uploads
- State management (loading, progress, errors)
- Progress callbacks
- Success/error callbacks
- File validation integration

### 6. Example Component
**`app/components/FileUploadExample.tsx`**
- Complete working example
- Form with reference number and name
- File selection with validation
- Progress bar
- Success/error states
- Usage documentation

### 7. Tests
**`lib/file-share.test.ts`**
- Unit tests for validation functions
- File size formatting tests
- Extension detection tests
- Reference number generation tests

### 8. Environment Configuration
**`.env.example`** (updated)
- Added file server configuration variables
- Staging and production credentials documented

## Configuration

### Environment Variables

Add to your `.env.local`:

```bash
# Staging
FILE_SERVER_URL="https://apps.moe.gov.ae/file/api/File"
FILE_SERVER_CLIENT_ID="5027d14a-83e7-4746-ab42-55bb9c180bbc"
FILE_SERVER_USERNAME="parent-portal-stg"
FILE_SERVER_PASSWORD="k))UE@Jx@@js"

# Production
FILE_SERVER_URL="https://apps.moe.gov.ae/file/api/File"
FILE_SERVER_CLIENT_ID="594cf0cf-0644-483a-96d0-5bd6a5e92552"
FILE_SERVER_USERNAME="parent-portal-prd"
FILE_SERVER_PASSWORD="lkHUP*(y3_22"
```

## Usage Examples

### Basic Upload (Fetch API)

```typescript
const formData = new FormData();
formData.append('ReferenceNumber', 'REF-12345');
formData.append('ReferenceName', 'Student Document');
formData.append('File', pdfFile);

const response = await fetch('/api/file-share', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
```

### Using the Hook

```tsx
import { useFileUpload } from '@/lib/hooks/useFileUpload';

function MyComponent() {
  const { upload, isUploading, progress, error } = useFileUpload({
    onSuccess: (result) => {
      console.log('Uploaded!', result.data);
    },
    onError: (error) => {
      console.error('Failed:', error);
    },
  });

  const handleUpload = async (file: File) => {
    await upload(file, 'REF-123', 'My Document');
  };

  return (
    <div>
      {isUploading && <div>Progress: {progress}%</div>}
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

### Using Utility Functions

```typescript
import { validateFile, uploadFile, formatFileSize } from '@/lib/file-share';

// Validate a file
const validation = validateFile(file);
if (!validation.valid) {
  alert(validation.error);
  return;
}

// Upload with progress
const result = await uploadFile({
  file,
  referenceNumber: 'REF-123',
  referenceName: 'Document',
  onProgress: (progress) => {
    console.log(`${progress}%`);
  },
});

// Format file size
console.log(formatFileSize(file.size)); // "2.5 MB"
```

## Integration with Existing Code

### Updating `update-info/page.tsx`

To use the new file upload API in your existing update info page:

```typescript
import { uploadFile } from '@/lib/file-share';

// Replace the inline base64 upload with file server upload
const documentBase64 = supportingDocument 
  ? await validateAndEncodeAttachment(supportingDocument, locale)
  : '';

// Upload to file server first
let fileServerId: string | null = null;
if (supportingDocument) {
  const uploadResult = await uploadFile({
    file: supportingDocument,
    referenceNumber: normalizedSourceId,
    referenceName: `Address Update - ${studentNumber}`,
  });
  
  if (uploadResult.ok && uploadResult.data?.fileId) {
    fileServerId = uploadResult.data.fileId;
  } else {
    throw new Error(uploadResult.error || 'File upload failed');
  }
}

// Include fileServerId in IDH payload instead of base64
const idhPayload: IDHStudent = {
  // ... other fields
  attachment01: fileServerId || '', // Store file ID instead of base64
};
```

## File Constraints

- **Type**: PDF only (`application/pdf`)
- **Size**: Maximum 5MB
- **Validation**: Both MIME type and extension checked
- **Encoding**: Binary upload via multipart/form-data

## Security Features

1. **Authentication Required**: All requests require valid NextAuth session
2. **Server-Side Validation**: File type and size validated on server
3. **Credential Protection**: Credentials stored in environment variables
4. **Timeout Protection**: 30-second timeout prevents hanging requests
5. **Error Sanitization**: Sensitive errors not exposed to client

## API Response Format

### Success (200)
```json
{
  "ok": true,
  "data": {
    "fileId": "abc123",
    "fileName": "document.pdf",
    "fileUrl": "https://..."
  },
  "meta": {
    "uploadedAt": "2026-01-06T12:00:00.000Z",
    "fileName": "document.pdf",
    "fileSize": 123456,
    "referenceNumber": "REF-123",
    "referenceName": "Document"
  }
}
```

### Error (4xx/5xx)
```json
{
  "ok": false,
  "error": "Only PDF files are allowed"
}
```

## Testing

Run tests:
```bash
npm test lib/file-share.test.ts
```

## Monitoring and Logging

All uploads are logged with:
- User session info
- File details (name, size)
- Reference number/name
- Upload duration
- Success/failure status
- Error details (if any)

Check server logs for detailed information.

## Next Steps

1. **Add to your .env.local**: Copy environment variables from `.env.example`
2. **Test the endpoint**: Use the example component or API directly
3. **Integration**: Update existing upload flows to use file server
4. **Production Deploy**: Update production environment variables
5. **Monitor**: Watch logs for upload activity and errors

## Support

For issues or questions:
- Check API documentation: `app/api/file-share/README.md`
- Review example component: `app/components/FileUploadExample.tsx`
- Check logs for detailed error information
- Verify environment variables are set correctly

## Architecture Alignment

This implementation follows the repository's existing patterns:
- ✅ Uses `fetchWithTimeout` for resilient requests
- ✅ Server-only API route with NextAuth authentication
- ✅ TypeScript types for type safety
- ✅ Comprehensive error handling
- ✅ Environment-based configuration
- ✅ Consistent with other API routes (backoffice/idh pattern)
- ✅ Includes documentation and examples
- ✅ Test coverage for utilities
