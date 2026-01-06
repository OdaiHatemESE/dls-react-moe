# Integration Guide: File Upload in Update Info Page

This guide shows how to integrate the new file share API into your existing `update-info/page.tsx`.

## Current Flow (Base64)

Currently, the page uploads files as base64 strings directly to IDH:

```typescript
// Current approach
const documentBase64 = supportingDocument 
  ? await validateAndEncodeAttachment(supportingDocument, locale)
  : '';

const idhPayload: IDHStudent = {
  // ...
  attachment01: documentBase64, // Large base64 string
};
```

## New Flow (File Server)

### Option 1: Upload to File Server, Store ID in IDH

Upload the file to the MOE file server first, then store only the file ID:

```typescript
import { uploadFile } from '@/lib/file-share';

// Upload to file server first
let fileServerId: string | null = null;
if (supportingDocument) {
  try {
    const uploadResult = await uploadFile({
      file: supportingDocument,
      referenceNumber: normalizedSourceId,
      referenceName: `Address Update - ${studentNumber}`,
      onProgress: (progress) => {
        console.log(`File upload progress: ${progress}%`);
      },
    });
    
    if (uploadResult.ok && uploadResult.data?.fileId) {
      fileServerId = uploadResult.data.fileId;
    } else {
      throw new Error(uploadResult.error || 'File upload to server failed');
    }
  } catch (uploadError) {
    const message = locale === 'ar'
      ? 'فشل رفع المستند إلى الخادم'
      : 'Failed to upload document to server';
    throw new Error(message);
  }
}

// Store file ID instead of base64
const idhPayload: IDHStudent = {
  // ... other fields
  attachment01: fileServerId || '',
};
```

### Option 2: Upload to Both (Parallel)

Upload to file server and keep base64 for IDH:

```typescript
import { uploadFile } from '@/lib/file-share';

let documentBase64 = '';
let fileServerId: string | null = null;

if (supportingDocument) {
  // Upload both in parallel
  const [base64Result, uploadResult] = await Promise.allSettled([
    validateAndEncodeAttachment(supportingDocument, locale),
    uploadFile({
      file: supportingDocument,
      referenceNumber: normalizedSourceId,
      referenceName: `Address Update - ${studentNumber}`,
    }),
  ]);

  // Get base64
  if (base64Result.status === 'fulfilled') {
    documentBase64 = base64Result.value;
  }

  // Get file server ID
  if (uploadResult.status === 'fulfilled' && uploadResult.value.ok) {
    fileServerId = uploadResult.value.data?.fileId || null;
  }
}

const idhPayload: IDHStudent = {
  // ... other fields
  attachment01: documentBase64, // Keep existing flow
  fileServerId: fileServerId, // Add new field (if IDH supports it)
};
```

## Recommended Integration Steps

### Step 1: Add Import

```typescript
import { uploadFile, validateFile } from '@/lib/file-share';
```

### Step 2: Add State for File Upload Status

```typescript
const [fileUploadProgress, setFileUploadProgress] = React.useState<number>(0);
const [fileServerId, setFileServerId] = React.useState<string | null>(null);
```

### Step 3: Update File Validation

Replace or enhance `validateAndEncodeAttachment`:

```typescript
const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0] ?? null;

  if (file) {
    // Use the new validation
    const validation = validateFile(file);
    if (!validation.valid) {
      setErrorMessage(
        locale === 'ar'
          ? `خطأ في المستند: ${validation.error}`
          : `Document error: ${validation.error}`
      );
      event.target.value = '';
      return;
    }
  }

  setSupportingDocument(file);
  setFileServerId(null);
};
```

### Step 4: Update Submit Handler

Modify `handleConfirmSubmit` to upload to file server:

```typescript
const handleConfirmSubmit = async () => {
  if (!preparedPayload || !student) return;

  setErrorMessage(null);
  setShowConfirmDialog(false);
  setIsSubmitting(true);

  try {
    // 1. Upload file to file server first (if address changed)
    let uploadedFileId: string | null = null;
    if (preparedPayload.addressChanged && supportingDocument) {
      console.log('Uploading document to file server...');
      
      const uploadResult = await uploadFile({
        file: supportingDocument,
        referenceNumber: normalizedSourceId,
        referenceName: `Address Update - ${studentNumber} - ${new Date().toISOString()}`,
        onProgress: setFileUploadProgress,
      });

      if (!uploadResult.ok) {
        throw new Error(
          locale === 'ar'
            ? `فشل رفع المستند: ${uploadResult.error}`
            : `File upload failed: ${uploadResult.error}`
        );
      }

      uploadedFileId = uploadResult.data?.fileId || null;
      setFileServerId(uploadedFileId);
      console.log('File uploaded successfully:', uploadedFileId);
    }

    // 2. Prepare IDH payload (existing code)
    const resolvedAddress = (() => {
      // ... existing address resolution logic
    })();

    // 3. Build IDH payload
    const idhPayload: IDHStudent = {
      studentNumber: studentNumber!,
      schoolId: schoolId!,
      sourceId: normalizedSourceId,
      primaryPhone: preparedPayload.contactNumbers[0] || '',
      otherPhone: preparedPayload.contactNumbers[1] || '',
      transportationType: preparedPayload.transportation,
      emirate: resolvedAddress.emirate,
      area: resolvedAddress.area,
      street: resolvedAddress.street,
      houseBuilding: resolvedAddress.houseBuilding,
      region: resolvedAddress.region,
      zone: resolvedAddress.zone,
      plot: resolvedAddress.plot,
      mainPlot: resolvedAddress.mainPlot,
      premises: resolvedAddress.premises,
      latitude: resolvedAddress.latitude,
      longitude: resolvedAddress.longitude,
      // Use file server ID instead of base64
      attachment01: uploadedFileId || '',
    };

    // 4. Submit to IDH (existing code)
    await submitToIDH(idhPayload);

    // Success handling...
    setShowSuccessToast(true);
    setHasUnsavedChanges(false);
    // ... rest of success logic

  } catch (submitError: unknown) {
    // Error handling...
  } finally {
    setIsSubmitting(false);
    setFileUploadProgress(0);
  }
};
```

### Step 5: Add Progress UI

Show file upload progress in the UI:

```tsx
{isSubmitting && fileUploadProgress > 0 && fileUploadProgress < 100 && (
  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <p className="text-sm font-medium mb-2">
      {locale === 'ar' 
        ? 'جاري رفع المستند...' 
        : 'Uploading document...'}
    </p>
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${fileUploadProgress}%` }}
      />
    </div>
    <p className="text-xs text-gray-600 mt-1">
      {fileUploadProgress}%
    </p>
  </div>
)}
```

## Testing Checklist

- [ ] File validation works (PDF only, 5MB max)
- [ ] File uploads successfully to server
- [ ] Progress indicator shows during upload
- [ ] File ID is stored in IDH payload
- [ ] Error handling works for upload failures
- [ ] Multiple children submission works (if applicable)
- [ ] Success toast appears after full submission
- [ ] Form resets properly after success

## Rollback Plan

If issues occur, simply revert to the base64 approach:

```typescript
// Revert to base64
const documentBase64 = supportingDocument 
  ? await validateAndEncodeAttachment(supportingDocument, locale)
  : '';

const idhPayload: IDHStudent = {
  // ...
  attachment01: documentBase64, // Back to base64
};
```

## Benefits

1. **Smaller Payloads**: File IDs are much smaller than base64 strings
2. **Better Performance**: Parallel upload and form submission possible
3. **File Management**: Centralized file storage on MOE server
4. **Progress Tracking**: Users see upload progress
5. **Reusability**: Files can be referenced by ID without re-upload

## Notes

- Make sure environment variables are set in `.env.local`
- Test thoroughly in staging before production
- Monitor file server logs for upload issues
- Consider keeping base64 as fallback initially
