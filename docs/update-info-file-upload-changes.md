# Changes Required for update-info/page.tsx

## Summary
The update-info page currently converts files to base64 and stores them directly in the IDH payload. We need to change this to:
1. Upload files to the MOE file server immediately when selected
2. Store the returned file GUID
3. Submit the file GUID in the `attachment01` field to IDH

## Files Modified
Due to code conflicts, please manually apply these changes to:
`app/child/[id]/update-info/page.tsx`

## Changes to Make

### 1. Add Import (at top of file)
```typescript
import { uploadFile, validateFile } from '@/lib/file-share';
```

### 2. Add State Variables (in component)
Add these after existing state declarations:
```typescript
const [uploadedFileGuid, setUploadedFileGuid] = React.useState<string | null>(null);
const [isUploadingFile, setIsUploadingFile] = React.useState<boolean>(false);
const [uploadProgress, setUploadProgress] = React.useState<number>(0);
```

### 3. Replace `handleFileChange` Function
Replace the entire `handleFileChange` function with:

```typescript
const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0] ?? null;

  if (file) {
    // Validate file using the new utility
    const validation = validateFile(file);
    if (!validation.valid) {
      setErrorMessage(
        locale === 'ar'
          ? `خطأ في المستند: ${validation.error}`
          : `Document error: ${validation.error}`
      );
      event.target.value = '';
      setSupportingDocument(null);
      setUploadedFileGuid(null);
      return;
    }

    // Upload file immediately to file server
    setIsUploadingFile(true);
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      const studentNumber = textOrNull(student?.studentNumber) ?? '';
      const referenceNumber = `${sourcedId}-${Date.now()}`;
      const referenceName = `Address Update - ${studentNumber} - ${new Date().toISOString()}`;

      const uploadResult = await uploadFile({
        file,
        referenceNumber,
        referenceName,
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      if (!uploadResult.ok) {
        throw new Error(
          uploadResult.error || 
          (locale === 'ar' ? 'فشل رفع المستند' : 'File upload failed')
        );
      }

      const fileGuid = uploadResult.data?.fileId || uploadResult.data?.fileUrl || null;
      
      if (!fileGuid) {
        throw new Error(
          locale === 'ar' 
            ? 'لم يتم استلام معرف الملف من الخادم'
            : 'File ID not received from server'
        );
      }

      setUploadedFileGuid(fileGuid);
      setSupportingDocument(file);
      setUploadProgress(100);

      toast.success(
        locale === 'ar' ? 'تم الرفع بنجاح' : 'Upload Successful',
        locale === 'ar'
          ? 'تم رفع المستند بنجاح'
          : 'Document uploaded successfully'
      );
    } catch (uploadError) {
      console.error('File upload error:', uploadError);
      const errorMsg = uploadError instanceof Error 
        ? uploadError.message 
        : (locale === 'ar' ? 'فشل رفع المستند' : 'File upload failed');
      
      setErrorMessage(errorMsg);
      event.target.value = '';
      setSupportingDocument(null);
      setUploadedFileGuid(null);
      
      toast.error(
        locale === 'ar' ? 'خطأ في الرفع' : 'Upload Error',
        errorMsg
      );
    } finally {
      setIsUploadingFile(false);
    }
  } else {
    setSupportingDocument(null);
    setUploadedFileGuid(null);
    setUploadProgress(0);
  }
};
```

### 4. Update `handleSubmit` Validation
In the `handleSubmit` function, ADD this validation after checking for `supportingDocument`:

```typescript
if (addressChanged && !uploadedFileGuid) {
  setErrorMessage(
    locale === 'ar'
      ? 'يجب رفع المستند الداعم بنجاح قبل المتابعة'
      : 'Document must be uploaded successfully before continuing'
  );
  return;
}
```

### 5. Update `handleConfirmSubmit` Function
In the `handleConfirmSubmit` function, find this section:

```typescript
// ========== Handle attachment based on mode and user action ==========
let attachmentBase64 = '';

if (supportingDocument) {
  // User uploaded a new document (either mode)
  attachmentBase64 = await validateAndEncodeAttachment(supportingDocument, locale);
} else if (mode === 'edit' && idhResp?.data?.attachment01) {
  // EDIT mode: No new document uploaded, reuse existing attachment from IDH
  attachmentBase64 = idhResp.data.attachment01;
}
// INIT mode with no document will remain empty string
```

**Replace it with:**

```typescript
// ========== Handle attachment based on mode and user action ==========
let attachmentFileGuid = '';

if (uploadedFileGuid) {
  // User uploaded a new document (file GUID from file server)
  attachmentFileGuid = uploadedFileGuid;
} else if (mode === 'edit' && idhResp?.data?.attachment01) {
  // EDIT mode: No new document uploaded, reuse existing attachment from IDH
  attachmentFileGuid = idhResp.data.attachment01;
}
// INIT mode with no document will remain empty string
```

### 6. Update IDH Payload
In the `idhPayload` object, change:
```typescript
attachment01: attachmentBase64,
```

**To:**
```typescript
attachment01: attachmentFileGuid, // Store file GUID instead of base64
```

### 7. Add Upload Progress UI (Optional but Recommended)
In the file input section of the form (where the file input is rendered), add this progress indicator:

```tsx
{isUploadingFile && (
  <div className="mt-3 space-y-2">
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${uploadProgress}%` }}
      />
    </div>
    <p className="text-sm text-center text-muted-foreground">
      {locale === 'ar' 
        ? `جاري رفع الملف... ${uploadProgress}%`
        : `Uploading file... ${uploadProgress}%`}
    </p>
  </div>
)}
```

## Testing Checklist

After making these changes:

1. ✅ File validation works (PDF only, 5MB max)
2. ✅ File uploads immediately when selected
3. ✅ Progress indicator shows during upload
4. ✅ Success toast appears after upload
5. ✅ Error handling works for upload failures
6. ✅ Form validation checks for `uploadedFileGuid`
7. ✅ File GUID is sent in `attachment01` field to IDH
8. ✅ Edit mode preserves existing file GUID if no new file uploaded

## Important Notes

- The file is uploaded **immediately** when selected, not when form is submitted
- The file GUID is stored and sent to IDH instead of base64
- This reduces payload size significantly (from ~5MB to just a small GUID string)
- Make sure environment variables for file server are configured (see `.env.example`)
- The file server API is already created at `/api/file-share`

## Environment Variables Required

Add to `.env.local`:

```bash
# For Staging
FILE_SERVER_URL="https://apps.moe.gov.ae/file/api/File"
FILE_SERVER_CLIENT_ID="5027d14a-83e7-4746-ab42-55bb9c180bbc"
FILE_SERVER_USERNAME="parent-portal-stg"
FILE_SERVER_PASSWORD="k))UE@Jx@@js"
```

## Rollback

If issues occur, you can temporarily revert by:
1. Removing the file upload on selection
2. Keeping the old base64 conversion logic
3. Sending base64 in `attachment01` as before

The file upload API will remain available for future use.
