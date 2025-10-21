/**
 * Example: Using the PDF Generator in Your Components
 * 
 * This file demonstrates how to integrate PDF generation
 * into your React components.
 */

import React from 'react';
import { generatePDF, downloadBase64PDF, type PdfFormData } from '@/lib/pdf-generator';

// ============================================
// Example 1: Basic Client-Side Generation
// ============================================

export async function example1_BasicGeneration() {
  const data: PdfFormData = {
    SchoolName: 'Dubai International School',
    SchoolAddress: '123 Main Street, Dubai, UAE',
    SchoolPhone: '+971 4 123 4567',
    Name: 'Ahmed Ali Mohammed',
    StudentEmiratesID: '784-1990-1234567-1',
    ParentName: 'Ali Mohammed Hassan',
    ParentEmiratesID: '784-1985-7654321-2',
    Phone: '+971 50 123 4567',
    Address: '456 Oak Avenue, Dubai, UAE',
    SignDate: new Date().toISOString(),
  };

  try {
    // Generate PDF and auto-download
    const base64 = await generatePDF(
      data,
      '/pdf/ConsentUAE_2025.pdf',
      '/fonts/Cairo-Regular.ttf',
      true // auto-download
    );

    console.log('PDF generated successfully!');
    console.log('Base64 length:', base64.length);
    
    // You can store the base64 string in state, database, etc.
    return base64;
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    throw error;
  }
}

// ============================================
// Example 2: React Component with Button
// ============================================

export function Example2_PDFButton() {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [pdfBase64, setPdfBase64] = React.useState<string | null>(null);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const data: PdfFormData = {
        SchoolName: 'School Name',
        SchoolAddress: 'School Address',
        SchoolPhone: '+971 4 XXX XXXX',
        Name: 'Student Name',
        StudentEmiratesID: '784-XXXX-XXXXXXX-X',
        ParentName: 'Parent Name',
        ParentEmiratesID: '784-XXXX-XXXXXXX-X',
        Phone: '+971 5X XXX XXXX',
        Address: 'Parent Address',
        SignDate: new Date().toISOString(),
      };

      const base64 = await generatePDF(
        data,
        '/pdf/ConsentUAE_2025.pdf',
        '/fonts/Cairo-Regular.ttf',
        true
      );

      setPdfBase64(base64);
      alert('PDF downloaded successfully!');
    } catch (error) {
      alert('Failed to generate PDF');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleGeneratePDF}
        disabled={isGenerating}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {isGenerating ? 'Generating...' : 'Download PDF'}
      </button>

      {pdfBase64 && (
        <button
          onClick={() => downloadBase64PDF(pdfBase64, 'document.pdf')}
          className="ml-2 px-4 py-2 bg-green-500 text-white rounded"
        >
          Re-download PDF
        </button>
      )}
    </div>
  );
}

// ============================================
// Example 3: Server-Side API Call
// ============================================

export async function example3_ServerSideAPI() {
  const data = {
    SchoolName: 'School Name',
    SchoolAddress: 'School Address',
    SchoolPhone: '+971 4 XXX XXXX',
    Name: 'Student Name',
    StudentEmiratesID: '784-XXXX-XXXXXXX-X',
    ParentName: 'Parent Name',
    ParentEmiratesID: '784-XXXX-XXXXXXX-X',
    Phone: '+971 5X XXX XXXX',
    Address: 'Parent Address',
    SignDate: new Date().toISOString(),
    template: 'uae' as const, // or 'expats'
  };

  try {
    const response = await fetch('/api/parent/generate-conduct-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    const result = await response.json();

    if (result.success) {
      // Download the PDF
      downloadBase64PDF(result.base64, result.filename);
      return result.base64;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// ============================================
// Example 4: Generate Without Auto-Download
// ============================================

export async function example4_NoAutoDownload() {
  const data: PdfFormData = {
    SchoolName: 'School Name',
    SchoolAddress: 'Address',
    SchoolPhone: 'Phone',
    Name: 'Student Name',
    StudentEmiratesID: 'EID',
    ParentName: 'Parent Name',
    ParentEmiratesID: 'EID',
    Phone: 'Phone',
    Address: 'Address',
    SignDate: new Date().toISOString(),
  };

  // Generate without downloading
  const base64 = await generatePDF(
    data,
    '/pdf/ConsentUAE_2025.pdf',
    '/fonts/Cairo-Regular.ttf',
    false // Don't auto-download
  );

  // Now you can:
  // 1. Store in database
  await saveToDatabase(base64);

  // 2. Send via email
  await sendEmail('parent@example.com', base64);

  // 3. Display in iframe
  displayPDFInIframe(base64);

  // 4. Download later manually
  downloadBase64PDF(base64, 'custom-filename.pdf');

  return base64;
}

// Helper functions (implement as needed)
async function saveToDatabase(base64: string) {
  // Save to your database
  console.log('Saving to database...');
}

async function sendEmail(email: string, base64: string) {
  // Send email with PDF attachment
  console.log('Sending email...');
}

function displayPDFInIframe(base64: string) {
  const iframe = document.createElement('iframe');
  iframe.src = `data:application/pdf;base64,${base64}`;
  document.body.appendChild(iframe);
}

// ============================================
// Example 5: Dynamic Template Selection
// ============================================

export async function example5_DynamicTemplate(nationality: 'UAE' | 'EXPAT') {
  const data: PdfFormData = {
    SchoolName: 'School Name',
    SchoolAddress: 'Address',
    SchoolPhone: 'Phone',
    Name: 'Student Name',
    StudentEmiratesID: 'EID',
    ParentName: 'Parent Name',
    ParentEmiratesID: 'EID',
    Phone: 'Phone',
    Address: 'Address',
    SignDate: new Date().toISOString(),
  };

  // Select template based on nationality
  const templatePath = nationality === 'UAE'
    ? '/pdf/ConsentUAE_2025.pdf'
    : '/pdf/ConsentExpats_2025.pdf';

  const base64 = await generatePDF(
    data,
    templatePath,
    '/fonts/Cairo-Regular.ttf',
    true
  );

  return base64;
}

// ============================================
// Example 6: Error Handling
// ============================================

export async function example6_ErrorHandling() {
  const data: PdfFormData = {
    SchoolName: 'School Name',
    SchoolAddress: 'Address',
    SchoolPhone: 'Phone',
    Name: 'Student Name',
    StudentEmiratesID: 'EID',
    ParentName: 'Parent Name',
    ParentEmiratesID: 'EID',
    Phone: 'Phone',
    Address: 'Address',
    SignDate: new Date().toISOString(),
  };

  try {
    const base64 = await generatePDF(
      data,
      '/pdf/ConsentUAE_2025.pdf',
      '/fonts/Cairo-Regular.ttf',
      true
    );
    return { success: true, base64 };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Failed to load PDF template')) {
        console.error('PDF template not found or invalid');
        // Fall back to server-side generation
        return await example3_ServerSideAPI();
      } else if (error.message.includes('Failed to load font')) {
        console.error('Font file not found');
        // Use default font or show error
        alert('PDF generation failed: Font file missing');
      } else {
        console.error('Unknown error:', error.message);
        alert('An unexpected error occurred');
      }
    }
    return { success: false, error };
  }
}

// ============================================
// Example 7: Batch Generation
// ============================================

export async function example7_BatchGeneration(students: Array<{
  name: string;
  eid: string;
  parentName: string;
  parentEid: string;
}>) {
  const results = await Promise.allSettled(
    students.map(async (student) => {
      const data: PdfFormData = {
        SchoolName: 'School Name',
        SchoolAddress: 'Address',
        SchoolPhone: 'Phone',
        Name: student.name,
        StudentEmiratesID: student.eid,
        ParentName: student.parentName,
        ParentEmiratesID: student.parentEid,
        Phone: '',
        Address: '',
        SignDate: new Date().toISOString(),
      };

      return await generatePDF(
        data,
        '/pdf/ConsentUAE_2025.pdf',
        '/fonts/Cairo-Regular.ttf',
        false // Don't auto-download in batch
      );
    })
  );

  const successful = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');

  console.log(`Generated ${successful.length} PDFs successfully`);
  console.log(`Failed to generate ${failed.length} PDFs`);

  return {
    successful: successful.map(r => (r as PromiseFulfilledResult<string>).value),
    failed: failed.map(r => (r as PromiseRejectedResult).reason),
  };
}

// ============================================
// Example 8: React Hook
// ============================================

export function usePDFGenerator() {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [base64, setBase64] = React.useState<string | null>(null);

  const generate = async (data: PdfFormData, templatePath: string, autoDownload = true) => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generatePDF(
        data,
        templatePath,
        '/fonts/Cairo-Regular.ttf',
        autoDownload
      );
      setBase64(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const download = (filename?: string) => {
    if (base64) {
      downloadBase64PDF(base64, filename || 'document.pdf');
    }
  };

  return {
    generate,
    download,
    isGenerating,
    error,
    base64,
  };
}

// Usage of the hook:
export function Example8_HookUsage() {
  const { generate, download, isGenerating, error, base64 } = usePDFGenerator();

  const handleGenerate = async () => {
    const data: PdfFormData = {
      SchoolName: 'School',
      SchoolAddress: 'Address',
      SchoolPhone: 'Phone',
      Name: 'Student',
      StudentEmiratesID: 'EID',
      ParentName: 'Parent',
      ParentEmiratesID: 'EID',
      Phone: 'Phone',
      Address: 'Address',
      SignDate: new Date().toISOString(),
    };

    await generate(
      data,
      '/pdf/ConsentUAE_2025.pdf',
      true
    );
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate PDF'}
      </button>
      {error && <p className="text-red-500">Error: {error.message}</p>}
      {base64 && <button onClick={() => download()}>Download Again</button>}
    </div>
  );
}
