# Parent Conduct Page (/child/[id]/parent-conduct)

**Route**: `/child/[id]/parent-conduct`  
**File**: `app/child/[id]/parent-conduct/page.tsx`  
**Access**: Protected (requires authentication & Emirates ID)

## 📋 Business Purpose

Provides parents the ability to:
- View student conduct agreement
- Sign conduct document electronically
- Download signed PDF
- Track signing history

## 🔌 API Endpoints Used

### 1. GET /api/PP/student/:id
- **Purpose**: Get student details for conduct form

### 2. POST /api/PP/parent-conduct/sign
- **Purpose**: Submit signed conduct agreement
- **Request Body**:
  ```typescript
  {
    studentId: string,
    studentNumber: string,
    parentName: string,
    parentSignature: string,  // Base64 image
    academicYear: string,
    timestamp: string
  }
  ```

### 3. GET /api/PP/parent-conduct/pdf
- **Purpose**: Generate signed PDF document
- **Query**: studentId, academicYear
- **Returns**: PDF file

## 📊 Conduct Document Data

```typescript
{
  studentInfo: {
    name: string,
    studentNumber: string,
    grade: string,
    school: string
  },
  parentInfo: {
    name: string,
    emiratesId: string
  },
  conductRules: string[],     // List of conduct points
  signature: string,           // Base64 image
  signedDate: string,
  academicYear: string
}
```

## ✅ Validation & Checks

1. **Student Active Check**: Only allow signing for active students
2. **Signature Required**: Canvas must have signature
3. **Parent Name Required**: Pre-filled from session
4. **Academic Year Required**: From admin config

### Signature Validation
```typescript
if (signatureCanvas.isEmpty()) {
  error("Please provide signature");
  return;
}
```

## 🎨 Key Components

- **Conduct Text Display**: Scrollable conduct rules
- **Signature Canvas**: Touch-enabled drawing area
- **Clear Button**: Reset signature
- **Sign Button**: Submit signature
- **Download PDF Button**: After signing

## 🔄 Signing Flow

```
Load conduct page
    ↓
Display conduct rules
    ↓
User draws signature
    ↓
Convert to base64
    ↓
Submit with student/parent data
    ↓
Generate PDF server-side
    ↓
Store in database
    ↓
Show success + download link
```

## 🌐 Internationalization

- Conduct text in Arabic/English
- Signature prompt localized
- Button labels translated
- RTL signature canvas for Arabic

## 🎯 Key Features

- Electronic signature capture
- PDF generation with signature
- Academic year tracking
- Signing history
- Mobile-friendly canvas
- Print-ready PDF output
