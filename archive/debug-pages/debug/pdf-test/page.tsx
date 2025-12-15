'use client';

import React from 'react';
import { generatePDF, type PdfFormData } from '@/lib/pdf-generator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PdfTestPage() {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [result, setResult] = React.useState<{ success: boolean; message: string } | null>(null);

  const testData: PdfFormData = {
    SchoolName: 'مدرسة دبي الدولية',
    SchoolAddress: '123 شارع الرئيسي، دبي، الإمارات العربية المتحدة',
    SchoolPhone: '+971 4 123 4567',
    Name: 'أحمد علي محمد',
    StudentEmiratesID: '784-1990-1234567-1',
    ParentName: 'علي محمد حسن',
    ParentEmiratesID: '784-1985-7654321-2',
    Phone: '+971 50 123 4567',
    Address: '456 شارع البلوط، دبي، الإمارات',
    SignDate: new Date().toISOString(),
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    setResult(null);

    try {
      const base64Pdf = await generatePDF(
        testData,
        '/pdf/ConsentUAE_2025.pdf',
        '/fonts/Alexandria-font.ttf',
        true, // Auto-download
      );

      setResult({
        success: true,
        message: `PDF generated successfully! Base64 length: ${base64Pdf.length} characters`,
      });
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestServerAPI = async () => {
    setIsGenerating(true);
    setResult(null);

    try {
      const response = await fetch('/api/parent/generate-conduct-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testData,
          template: 'uae',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Download the PDF
        const binaryString = atob(data.base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setResult({
          success: true,
          message: `Server-side PDF generated! Base64 length: ${data.base64.length}`,
        });
      } else {
        setResult({
          success: false,
          message: `Server error: ${data.error}`,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>PDF Generation Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Test Data:</h3>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto">
              {JSON.stringify(testData, null, 2)}
            </pre>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Test Client-Side Generation'}
            </button>

            <button
              onClick={handleTestServerAPI}
              disabled={isGenerating}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Test Server-Side API'}
            </button>
          </div>

          {result && (
            <div
              className={`p-4 rounded-lg ${
                result.success
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              <strong>{result.success ? '✓ Success' : '✗ Error'}</strong>
              <p className="mt-1">{result.message}</p>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Click "Test Client-Side Generation" to generate PDF in the browser</li>
              <li>Click "Test Server-Side API" to generate PDF via API endpoint</li>
              <li>Check your downloads folder for the generated PDF</li>
              <li>Verify that Arabic text renders correctly</li>
              <li>Check that all form fields are filled properly</li>
            </ol>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Prerequisites:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
              <li>PDF template must exist at: <code className="bg-yellow-100 px-1 rounded">/public/pdf/ConsentUAE_2025.pdf</code></li>
              <li>Font file must exist at: <code className="bg-yellow-100 px-1 rounded">/public/fonts/Alexandria-font.ttf</code></li>
              <li>PDF template must have fillable form fields matching the field mapping</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
