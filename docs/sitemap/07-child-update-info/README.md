# Update Student Info Page (/child/[id]/update-info)

**Route**: `/child/[id]/update-info`  
**File**: `app/child/[id]/update-info/page.tsx`  
**Access**: Protected (requires authentication & Emirates ID)

## 📋 Business Purpose

Allows parents to:
- Update student contact information
- Update student address
- Upload supporting documents
- Resubmit returned applications
- Track update submission status

## 🔌 API Endpoints Used

### 1. GET /api/PP/student/:id
- **Purpose**: Fetch current student data
- **Used**: Pre-fill form with existing data

### 2. POST /api/PP/student/:id/update
- **Purpose**: Submit information updates
- **Request Body**:
  ```typescript
  {
    studentId: string,
    updates: {
      primaryPhone?: string,
      otherPhone?: string,
      emirate?: string,
      area?: string,
      street?: string,
      houseBuilding?: string,
      transportationType?: string,
      // ... other fields
    },
    attachments?: File[]
  }
  ```
- **Response**: Success/error with submission ID

### 3. POST /api/file-share/upload
- **Purpose**: Upload document files
- **Used**: For supporting documents (proof of address, etc.)

## ✅ Validation & Checks

### Required Fields
- Primary phone number
- Address fields (emirate, area, street)
- Transportation type

### File Upload Validation
- Max file size: 10MB
- Allowed types: PDF, JPG, PNG
- Max files: 5

### Form Validation Schema
From `lib/child-actions-schema.ts`:
```typescript
z.object({
  primaryPhone: z.string().min(1),
  otherPhone: z.string().optional(),
  emirate: z.string().min(1),
  area: z.string().min(1),
  street: z.string().min(1),
  // ...
})
```

## 🔄 Submission Flow

```
User fills form
    ↓
Validate inputs
    ↓
Upload files (if any)
    ↓
Submit update data
    ↓
Store in database
    ↓
Create update log
    ↓
Redirect to child detail page
```

## 🎨 Key Components

- **Form Fields**: Phone, address, transportation
- **File Upload**: Drag-and-drop area
- **Validation Messages**: Real-time feedback
- **Submit Button**: With loading state
- **Resubmit Mode**: Special UI for returned applications

## 🌐 Internationalization

- Form labels in Arabic/English
- Error messages localized
- RTL form layout for Arabic

## 🎯 Key Features

- Pre-filled form data
- Real-time validation
- File upload with preview
- Resubmission workflow
- Loading states
- Success/error handling
