# File Share API

API endpoint for uploading files to the MOE file server.

## Endpoint

`POST /api/file-share`

## Authentication

Requires valid NextAuth session (user must be authenticated).

## Configuration

The following environment variables must be set:

- `FILE_SERVER_URL`: The MOE file server endpoint (default: `https://apps.moe.gov.ae/file/api/File`)
- `FILE_SERVER_CLIENT_ID`: The application client ID
- `FILE_SERVER_USERNAME`: The username for authentication
- `FILE_SERVER_PASSWORD`: The password for authentication

### Environment Setup

**Staging:**
```bash
FILE_SERVER_URL="https://apps.moe.gov.ae/file/api/File"
FILE_SERVER_CLIENT_ID="5027d14a-83e7-4746-ab42-55bb9c180bbc"
FILE_SERVER_USERNAME="parent-portal-stg"
FILE_SERVER_PASSWORD="k))UE@Jx@@js"
```

**Production:**
```bash
FILE_SERVER_URL="https://apps.moe.gov.ae/file/api/File"
FILE_SERVER_CLIENT_ID="594cf0cf-0644-483a-96d0-5bd6a5e92552"
FILE_SERVER_USERNAME="parent-portal-prd"
FILE_SERVER_PASSWORD="lkHUP*(y3_22"
```

## Request Format

Content-Type: `multipart/form-data`

### Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ReferenceNumber | string | Yes | Reference number for the file |
| ReferenceName | string | Yes | Reference name/description |
| File | file | Yes | PDF file to upload (max 5MB) |

### File Constraints

- **Type**: PDF only (`application/pdf`)
- **Size**: Maximum 5MB
- **Naming**: Any valid filename

## Response Format

### Success Response (200)

```json
{
  "ok": true,
  "data": {
    "fileId": "...",
    "fileName": "...",
    "fileUrl": "..."
  },
  "meta": {
    "uploadedAt": "2026-01-06T12:00:00.000Z",
    "fileName": "document.pdf",
    "fileSize": 123456,
    "referenceNumber": "REF001",
    "referenceName": "Student Document"
  }
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "ok": false,
  "error": "Unauthorized"
}
```

**400 Bad Request**
```json
{
  "ok": false,
  "error": "ReferenceNumber is required"
}
```

**500 Internal Server Error**
```json
{
  "ok": false,
  "error": "File server not configured"
}
```

**504 Gateway Timeout**
```json
{
  "ok": false,
  "error": "File upload timed out. Please try again."
}
```

## Usage Example

### Using Fetch API

```typescript
const formData = new FormData();
formData.append('ReferenceNumber', 'REF12345');
formData.append('ReferenceName', 'Student Address Document');
formData.append('File', pdfFile); // File object from input

const response = await fetch('/api/file-share', {
  method: 'POST',
  body: formData,
  // Don't set Content-Type header - browser will set it with boundary
});

const result = await response.json();

if (result.ok) {
  console.log('File uploaded:', result.data);
} else {
  console.error('Upload failed:', result.error);
}
```

### Using in React Component

```tsx
import { useState } from 'react';

function FileUploadForm() {
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('/api/file-share', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.ok) {
        alert('File uploaded successfully!');
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="ReferenceNumber"
        placeholder="Reference Number"
        required
      />
      <input
        type="text"
        name="ReferenceName"
        placeholder="Reference Name"
        required
      />
      <input
        type="file"
        name="File"
        accept="application/pdf"
        required
      />
      <button type="submit" disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}
```

## Technical Details

- **Timeout**: 30 seconds for file uploads
- **Authentication Method**: HTTP Basic Authentication with credentials in headers
- **Headers Sent**:
  - `Accept: */*`
  - `ClientId`: Application client ID
  - `UserId`: Username
  - `Authorization`: Basic base64-encoded credentials
- **Content-Type**: Automatically set by FormData with multipart boundary

## Security Notes

- All requests require valid authentication (NextAuth session)
- File type validation enforced (PDF only)
- File size limit enforced (5MB max)
- Credentials are stored in environment variables and never exposed to client
- All uploads are logged for audit purposes

## Error Handling

The API handles various error scenarios:

1. **Missing authentication**: Returns 401 with error message
2. **Missing required fields**: Returns 400 with specific field error
3. **Invalid file type**: Returns 400 with file type error
4. **File too large**: Returns 400 with size limit error
5. **File server unavailable**: Returns 500 with upstream error
6. **Timeout**: Returns 504 with timeout message
7. **Network errors**: Returns 500 with error details

## Monitoring

All requests are logged with:
- Timestamp
- User session info
- Reference number and name
- File details (name, size)
- Response status
- Duration

Check server logs for detailed upload information and troubleshooting.
