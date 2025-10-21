import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Field mapping for the PDF form
const fieldMapping: Record<string, string> = {
  SchoolName: 'SchoolName',
  SchoolAddress: 'SchoolAddress',
  SchoolPhone: 'SchoolPhone',
  Name: 'StudentName',
  StudentEmiratesID: 'StudentEID',
  ParentName: 'ParentName',
  ParentEmiratesID: 'ParentEID',
  Phone: 'ParentPhone',
  Address: 'ParentAddress',
  SignDate: 'SignDate',
};

interface PdfFormData {
  SchoolName: string;
  SchoolAddress: string;
  SchoolPhone: string;
  Name: string;
  StudentEmiratesID: string;
  ParentName: string;
  ParentEmiratesID: string;
  Phone: string;
  Address: string;
  SignDate: string;
  template?: 'uae' | 'expats';
}

export async function POST(request: NextRequest) {
  try {
    const data: PdfFormData = await request.json();

    // Determine template
    const templateName = data.template === 'expats' 
      ? 'ConsentExpats_2025.pdf' 
      : 'ConsentUAE_2025.pdf';
    
    const templatePath = join(
      process.cwd(),
      'app',
      'child',
      '[id]',
      'parent-conduct',
      'pdf',
      templateName,
    );

    const fontPath = join(process.cwd(), 'public', 'fonts', 'Cairo-Regular.ttf');

    // Load template and font
    const [templateBytes, fontBytes] = await Promise.all([
      readFile(templatePath),
      readFile(fontPath),
    ]);

    // Create PDF document
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);

    // Embed font
    const customFont = await pdfDoc.embedFont(fontBytes);

    // Get form
    const form = pdfDoc.getForm();

    // Fill form fields
    Object.keys(fieldMapping).forEach((fieldKey) => {
      try {
        const formField = form.getTextField(fieldMapping[fieldKey]);
        let fieldValue: string;

        if (fieldKey === 'SignDate') {
          fieldValue = data.SignDate?.trim()
            ? new Date(data.SignDate).toLocaleDateString('en-US')
            : new Date().toLocaleDateString('en-US');
        } else {
          const value = data[fieldKey as keyof PdfFormData];
          fieldValue = value?.trim() ? value.toString() : 'لا يوجد';
        }

        formField.setText(fieldValue);
        formField.setAlignment(1); // Center alignment
        formField.updateAppearances(customFont);
      } catch (error) {
        console.warn(`Field ${fieldMapping[fieldKey]} not found in PDF form`, error);
      }
    });

    // Serialize PDF
    const pdfBytes = await pdfDoc.save();

    // Convert to base64
    const base64 = Buffer.from(pdfBytes).toString('base64');

    return NextResponse.json({
      success: true,
      base64,
      filename: `${data.Name || 'Document'}_ParentConduct.pdf`,
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate PDF',
      },
      { status: 500 },
    );
  }
}
