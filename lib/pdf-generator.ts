import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

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

// Simple in-memory caches for template and font bytes to avoid re-fetching per click
const templateCache: Record<string, ArrayBuffer> = {};
const fontCache: Record<string, ArrayBuffer> = {};

export interface PdfFormData {
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
}

export interface GeneratePdfOptions {
  data: PdfFormData;
  templatePath: string;
  fontPath: string;
  download?: boolean;
}

/**
 * Generate a filled PDF from a template with form fields
 * @param data - The data to fill in the form fields
 * @param templatePath - Path to the PDF template (relative to public directory)
 * @param fontPath - Path to the font file (relative to public directory)
 * @param download - Whether to trigger download (client-side only)
 * @returns Base64 encoded PDF string
 */
export const generatePDF = async (
  data: PdfFormData,
  templatePath: string,
  fontPath: string,
  download: boolean = false,
): Promise<string> => {
  try {
    // Load or cache template
    let templateBytes = templateCache[templatePath];
    if (!templateBytes) {
      const response = await fetch(templatePath);
      if (!response.ok) {
        throw new Error(`Failed to load PDF template: ${response.statusText}`);
      }
      templateBytes = await response.arrayBuffer();
      templateCache[templatePath] = templateBytes;
    }

    // Create a new PDFDocument from the template
    const pdfDoc = await PDFDocument.load(templateBytes);

    // Register fontkit for custom font embedding
    pdfDoc.registerFontkit(fontkit);

    // Load or cache font bytes
    let fontBytes = fontCache[fontPath];
    if (!fontBytes) {
      const response = await fetch(fontPath);
      if (!response.ok) {
        throw new Error(`Failed to load font: ${response.statusText}`);
      }
      fontBytes = await response.arrayBuffer();
      fontCache[fontPath] = fontBytes;
    }

    // Embed the custom font
    const customFont = await pdfDoc.embedFont(fontBytes);

    // Get the form from the PDF
    const form = pdfDoc.getForm();

    // Debug: Log available fields
    const formFields = form.getFields();
    console.log('Available PDF form fields:', formFields.map(f => f.getName()));
    console.log('Field count:', formFields.length);

    if (formFields.length === 0) {
      throw new Error('PDF has no form fields. Please add fillable form fields to the PDF template using Adobe Acrobat.');
    }

    // Map the dynamic data to the form fields
    Object.keys(fieldMapping).forEach((fieldKey) => {
      try {
        const formField = form.getTextField(fieldMapping[fieldKey]);
        let fieldValue: string;

        if (fieldKey === 'SignDate') {
          fieldValue = data[fieldKey as keyof PdfFormData]?.trim()
            ? new Date(data[fieldKey as keyof PdfFormData]).toLocaleDateString('en-US')
            : new Date().toLocaleDateString('en-US');
        } else {
          const value = data[fieldKey as keyof PdfFormData];
          fieldValue = value?.trim() ? value.toString() : 'لا يوجد';
        }

        console.log(`Setting field ${fieldMapping[fieldKey]} = ${fieldValue}`);
        formField.setText(fieldValue);
        formField.setAlignment(1); // 1 = Center alignment
        formField.updateAppearances(customFont);
      } catch (error) {
        console.warn(`Field ${fieldMapping[fieldKey]} not found in PDF form`, error);
      }
    });

    // Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save();

    // Convert to base64
    const base64 = btoa(
      Array.from(new Uint8Array(pdfBytes))
        .map((byte) => String.fromCharCode(byte))
        .join(''),
    );

    // Trigger file download if requested (client-side only)
    if (download && typeof window !== 'undefined') {
      const uint8Array = new Uint8Array(pdfBytes);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.Name || 'Document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    return base64;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Helper to download a base64 PDF
 */
export const downloadBase64PDF = (base64: string, filename: string = 'document.pdf') => {
  if (typeof window === 'undefined') {
    throw new Error('downloadBase64PDF can only be called in browser');
  }

  // Decode base64 to binary
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create blob and download
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
