# PDF Generation System

**Last Updated:** December 15, 2025

## Quick Start

### Generate Conduct PDF

```typescript
// Server-side API route
import { generatePDF } from '@/lib/pdf-generator';

// Generate PDF with student data
const pdfBytes = await generatePDF({
  studentNameArabic: 'محمد أحمد',
  studentNameEnglish: 'Mohammed Ahmed',
  studentNumber: '12345',
  gradeLevel: 'Grade 10',
  schoolNameArabic: 'مدرسة الإمارات',
  schoolNameEnglish: 'Emirates School',
  parentNameArabic: 'أحمد محمد',
  parentNameEnglish: 'Ahmed Mohammed',
  emiratesId: '784-1990-1234567-1',
  signatureDate: new Date(),
});

// Return as downloadable file
return new Response(pdfBytes, {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="conduct-agreement.pdf"',
  },
});
```

### Client-side Download

```typescript
'use client';

async function downloadConductPDF(studentId: string) {
  const response = await fetch(`/api/parent/generate-conduct-pdf?studentId=${studentId}`);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conduct-${studentId}.pdf`;
  a.click();
}
```

## System Overview

### Architecture

```
┌─────────────────────────────────────────────────────┐
│              Client (Browser)                        │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  Download Button                             │  │
│  │  onClick={() => downloadPDF(studentId)}      │  │
│  └──────────────┬───────────────────────────────┘  │
│                 │                                    │
└─────────────────┼────────────────────────────────────┘
                  │ HTTP Request
                  ▼
┌─────────────────────────────────────────────────────┐
│         API Route: /api/parent/generate-conduct-pdf │
│                                                      │
│  1. Authenticate user (NextAuth)                    │
│  2. Fetch student data                              │
│  3. Call PDF generator                              │
│  4. Return PDF bytes                                │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│         lib/pdf-generator.ts                         │
│                                                      │
│  1. Load template PDF                               │
│  2. Embed Arabic font (Noto Kufi Arabic)            │
│  3. Fill form fields (Arabic + English)             │
│  4. Add signature & date                            │
│  5. Flatten PDF (read-only)                         │
│  6. Return PDF bytes                                │
└─────────────────────────────────────────────────────┘
```

## Implementation

### PDF Generator (`lib/pdf-generator.ts`)

```typescript
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

export interface PdfFormData {
  studentNameArabic: string;
  studentNameEnglish: string;
  studentNumber: string;
  gradeLevel: string;
  schoolNameArabic: string;
  schoolNameEnglish: string;
  parentNameArabic: string;
  parentNameEnglish: string;
  emiratesId: string;
  signatureDate: Date;
}

export async function generatePDF(data: PdfFormData): Promise<Uint8Array> {
  // 1. Load template PDF
  const templatePath = path.join(process.cwd(), 'public', 'templates', 'conduct-template.pdf');
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

  // 2. Register fontkit for custom fonts
  pdfDoc.registerFontkit(fontkit);

  // 3. Embed Arabic font
  const fontPath = path.join(
    process.cwd(),
    'node_modules',
    '@fontsource/noto-kufi-arabic',
    'files',
    'noto-kufi-arabic-arabic-400-normal.woff'
  );
  const fontBytes = fs.readFileSync(fontPath);
  const arabicFont = await pdfDoc.embedFont(fontBytes);

  // 4. Get the form
  const form = pdfDoc.getForm();

  // 5. Fill fields
  form.getTextField('studentNameArabic').setText(data.studentNameArabic);
  form.getTextField('studentNameArabic').setFontSize(12);
  form.getTextField('studentNameArabic').updateAppearances(arabicFont);

  form.getTextField('studentNameEnglish').setText(data.studentNameEnglish);
  form.getTextField('studentNumber').setText(data.studentNumber);
  form.getTextField('gradeLevel').setText(data.gradeLevel);

  form.getTextField('schoolNameArabic').setText(data.schoolNameArabic);
  form.getTextField('schoolNameArabic').updateAppearances(arabicFont);

  form.getTextField('schoolNameEnglish').setText(data.schoolNameEnglish);

  form.getTextField('parentNameArabic').setText(data.parentNameArabic);
  form.getTextField('parentNameArabic').updateAppearances(arabicFont);

  form.getTextField('parentNameEnglish').setText(data.parentNameEnglish);
  form.getTextField('emiratesId').setText(data.emiratesId);

  const dateStr = data.signatureDate.toLocaleDateString('en-GB');
  form.getTextField('signatureDate').setText(dateStr);

  // 6. Flatten form (make read-only)
  form.flatten();

  // 7. Save and return
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
```

### API Route (`app/api/parent/generate-conduct-pdf/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generatePDF } from '@/lib/pdf-generator';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user?.emiratesId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get student ID from query
    const studentId = req.nextUrl.searchParams.get('studentId');
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // 3. Fetch student data
    const student = await prisma.student.findUnique({
      where: { id: parseInt(studentId) },
      include: {
        enrollments: {
          where: { isActive: true },
          include: { school: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // 4. Verify parent authorization
    if (student.parentEmiratesId !== session.user.emiratesId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 5. Prepare PDF data
    const enrollment = student.enrollments[0];
    const pdfData = {
      studentNameArabic: student.firstNameAr + ' ' + student.lastNameAr,
      studentNameEnglish: student.firstNameEn + ' ' + student.lastNameEn,
      studentNumber: student.studentNumber || '',
      gradeLevel: enrollment?.gradeLevel || 'N/A',
      schoolNameArabic: enrollment?.school?.nameAr || '',
      schoolNameEnglish: enrollment?.school?.nameEn || '',
      parentNameArabic: student.parent?.nameAr || '',
      parentNameEnglish: student.parent?.nameEn || '',
      emiratesId: session.user.emiratesId,
      signatureDate: new Date(),
    };

    // 6. Generate PDF
    const pdfBytes = await generatePDF(pdfData);

    // 7. Return PDF
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="conduct-${student.studentNumber}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
```

## Arabic Font Handling

### Font Configuration

```typescript
// Use Noto Kufi Arabic (installed via npm)
import '@fontsource/noto-kufi-arabic';

// Font path for pdf-lib
const fontPath = path.join(
  process.cwd(),
  'node_modules',
  '@fontsource/noto-kufi-arabic',
  'files',
  'noto-kufi-arabic-arabic-400-normal.woff'
);
```

### Embedding Arabic Font

```typescript
// Register fontkit
pdfDoc.registerFontkit(fontkit);

// Load and embed font
const fontBytes = fs.readFileSync(fontPath);
const arabicFont = await pdfDoc.embedFont(fontBytes);

// Apply to Arabic fields
form.getTextField('studentNameArabic').updateAppearances(arabicFont);
```

## Template Setup

### PDF Template Requirements

1. **Fillable Form Fields**: PDF must have form fields with specific names
2. **Field Names** (must match exactly):
   - `studentNameArabic`
   - `studentNameEnglish`
   - `studentNumber`
   - `gradeLevel`
   - `schoolNameArabic`
   - `schoolNameEnglish`
   - `parentNameArabic`
   - `parentNameEnglish`
   - `emiratesId`
   - `signatureDate`

3. **Location**: Place template at `public/templates/conduct-template.pdf`

### Creating Template in Adobe Acrobat

1. Create PDF design with Arabic/English text
2. Add form fields: **Tools → Prepare Form**
3. Name fields exactly as above
4. Set font size: 12pt for Arabic, 10pt for English
5. Test with Arabic characters
6. Save as `conduct-template.pdf`

## Testing

### Test PDF Generation

```typescript
// app/api/debug/pdf/route.ts
import { generatePDF } from '@/lib/pdf-generator';

export async function GET() {
  const testData = {
    studentNameArabic: 'محمد أحمد علي',
    studentNameEnglish: 'Mohammed Ahmed Ali',
    studentNumber: '12345',
    gradeLevel: 'Grade 10',
    schoolNameArabic: 'مدرسة الإمارات النموذجية',
    schoolNameEnglish: 'Emirates Model School',
    parentNameArabic: 'أحمد محمد',
    parentNameEnglish: 'Ahmed Mohammed',
    emiratesId: '784-1990-1234567-1',
    signatureDate: new Date(),
  };

  const pdfBytes = await generatePDF(testData);

  return new Response(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="test.pdf"',
    },
  });
}
```

### Checklist

- [ ] Template PDF exists at `public/templates/conduct-template.pdf`
- [ ] All form fields are correctly named
- [ ] Arabic font package is installed: `@fontsource/noto-kufi-arabic`
- [ ] pdf-lib and fontkit packages are installed
- [ ] Test with Arabic text (no question marks)
- [ ] Download works in browser
- [ ] PDF is read-only (flattened)
- [ ] Proper authorization checks in API route

## Troubleshooting

### Arabic Shows as Question Marks

**Problem**: Arabic text displays as "??????"  
**Solution**: 
1. Ensure font is embedded: `pdfDoc.registerFontkit(fontkit)`
2. Update field appearances: `field.updateAppearances(arabicFont)`
3. Use WOFF font file, not TTF

### PDF Not Downloading

**Problem**: PDF opens in new tab instead of downloading  
**Solution**: Set correct headers:
```typescript
'Content-Disposition': 'attachment; filename="file.pdf"'
```

### Template Not Found

**Problem**: `ENOENT: no such file or directory`  
**Solution**: Check template path is relative to `process.cwd()`:
```typescript
path.join(process.cwd(), 'public', 'templates', 'conduct-template.pdf')
```

## Security

### Authorization

```typescript
// 1. Verify user is authenticated
const session = await getServerSession(authOptions);
if (!session?.user?.emiratesId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// 2. Verify parent owns the student
if (student.parentEmiratesId !== session.user.emiratesId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### No Caching

```typescript
// Prevent caching of PDFs
headers: {
  'Cache-Control': 'no-store, max-age=0',
}
```

## Dependencies

```json
{
  "dependencies": {
    "pdf-lib": "^1.17.1",
    "@pdf-lib/fontkit": "^1.1.1",
    "@fontsource/noto-kufi-arabic": "^5.2.9"
  }
}
```

## Related Documentation

- [Child Actions System](CHILD_ACTIONS.md) - Conduct signature workflow
- [Notifications](NOTIFICATIONS.md) - PDF ready notifications
- [Architecture](../core/ARCHITECTURE.md) - System security patterns
