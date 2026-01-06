# File Share API - Quick Start Guide

Get started with the MOE file server integration in 5 minutes.

## 1. Configure Environment Variables

Add to your `.env.local` file:

### For Staging:
```bash
FILE_SERVER_URL="https://apps.moe.gov.ae/file/api/File"
FILE_SERVER_CLIENT_ID="5027d14a-83e7-4746-ab42-55bb9c180bbc"
FILE_SERVER_USERNAME="parent-portal-stg"
FILE_SERVER_PASSWORD="k))UE@Jx@@js"
```

### For Production:
```bash
FILE_SERVER_URL="https://apps.moe.gov.ae/file/api/File"
FILE_SERVER_CLIENT_ID="594cf0cf-0644-483a-96d0-5bd6a5e92552"
FILE_SERVER_USERNAME="parent-portal-prd"
FILE_SERVER_PASSWORD="lkHUP*(y3_22"
```

## 2. Test the API

### Using cURL:

```bash
# First, get your session cookie by logging in to the app
# Then test the upload:

curl -X POST http://localhost:4200/api/file-share \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -F "ReferenceNumber=TEST-001" \
  -F "ReferenceName=Test Document" \
  -F "File=@/path/to/your/document.pdf"
```

### Using the Example Component:

1. Start the dev server: `npm run dev`
2. Navigate to a page and import the example component
3. Try uploading a PDF file

## 3. Basic Usage in Your Code

### Simple Upload:

```typescript
import { uploadFile } from '@/lib/file-share';

async function handleUpload(file: File) {
  const result = await uploadFile({
    file,
    referenceNumber: 'REF-123',
    referenceName: 'My Document',
  });

  if (result.ok) {
    console.log('Success! File ID:', result.data?.fileId);
  } else {
    console.error('Error:', result.error);
  }
}
```

### Upload with Progress:

```typescript
import { uploadFile } from '@/lib/file-share';

async function handleUploadWithProgress(file: File) {
  const result = await uploadFile({
    file,
    referenceNumber: 'REF-123',
    referenceName: 'My Document',
    onProgress: (progress) => {
      console.log(`Upload: ${progress}%`);
    },
  });

  return result;
}
```

### Using the React Hook:

```tsx
import { useFileUpload } from '@/lib/hooks/useFileUpload';

function MyComponent() {
  const { upload, isUploading, progress, error } = useFileUpload({
    onSuccess: (response) => alert('Success!'),
    onError: (error) => alert('Error: ' + error),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await upload(file, 'REF-123', 'Document Name');
    }
  };

  return (
    <div>
      <input type="file" accept=".pdf" onChange={handleFileSelect} />
      {isUploading && <p>Uploading: {progress}%</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

## 4. Validate Before Upload

```typescript
import { validateFile } from '@/lib/file-share';

function handleFileSelect(file: File) {
  const validation = validateFile(file);
  
  if (!validation.valid) {
    alert(validation.error); // "Only PDF files are allowed" or "File too large"
    return;
  }

  // File is valid, proceed with upload
  uploadFile({ file, referenceNumber: '...', referenceName: '...' });
}
```

## 5. Common Use Cases

### Upload from Form:

```tsx
function UploadForm() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const response = await fetch('/api/file-share', {
      method: 'POST',
      body: formData, // Already contains ReferenceNumber, ReferenceName, File
    });

    const result = await response.json();
    if (result.ok) {
      console.log('Uploaded!', result.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="ReferenceNumber" required />
      <input name="ReferenceName" required />
      <input name="File" type="file" accept=".pdf" required />
      <button type="submit">Upload</button>
    </form>
  );
}
```

### Convert Base64 to File and Upload:

```typescript
import { base64ToFile, uploadFile } from '@/lib/file-share';

async function uploadFromBase64(base64String: string, filename: string) {
  // Convert base64 to File object
  const file = base64ToFile(base64String, filename, 'application/pdf');
  
  // Upload to file server
  const result = await uploadFile({
    file,
    referenceNumber: 'REF-123',
    referenceName: 'Converted Document',
  });

  return result;
}
```

## 6. Error Handling

```typescript
import { uploadFile } from '@/lib/file-share';

async function safeUpload(file: File) {
  try {
    const result = await uploadFile({
      file,
      referenceNumber: 'REF-123',
      referenceName: 'Document',
    });

    if (result.ok) {
      return { success: true, fileId: result.data?.fileId };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

## 7. File Constraints

Remember these limits:
- **File type**: PDF only (`application/pdf`)
- **File size**: Maximum 5MB
- **Format**: Multipart form data
- **Authentication**: Required (NextAuth session)

## Troubleshooting

### "Unauthorized" Error
- Make sure you're logged in (valid NextAuth session)
- Check that authentication is working

### "File server not configured" Error
- Verify environment variables are set in `.env.local`
- Restart the dev server after adding variables

### "Only PDF files are allowed" Error
- Check file type is `application/pdf`
- Check file extension is `.pdf`

### "File size exceeds 5MB limit" Error
- Compress your PDF or split into multiple files
- Maximum allowed size is 5MB (5,242,880 bytes)

### Upload Timeout
- File uploads have a 30-second timeout
- For large files, ensure good network connection
- Consider compressing files before upload

## Next Steps

- Review full documentation: `app/api/file-share/README.md`
- See integration guide: `docs/file-share-integration-guide.md`
- Check example component: `app/components/FileUploadExample.tsx`
- Run tests: `npm test lib/file-share.test.ts`

## Support

Need help? Check:
1. API documentation in `app/api/file-share/README.md`
2. Server logs for detailed error messages
3. Environment variables are correctly set
4. Network connectivity to file server

Happy uploading! 🚀
