'use client';

import React from 'react';
import { PDFDocument } from 'pdf-lib';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PdfInspectorPage() {
  const [fields, setFields] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const inspectPDF = async (templatePath: string) => {
    setIsLoading(true);
    setError(null);
    setFields([]);

    try {
      const response = await fetch(templatePath);
      if (!response.ok) {
        throw new Error(`Failed to load PDF: ${response.statusText}`);
      }

      const pdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();
      const formFields = form.getFields();

      const fieldNames = formFields.map((field) => {
        const type = field.constructor.name;
        const name = field.getName();
        return `${name} (${type})`;
      });

      setFields(fieldNames);

      if (fieldNames.length === 0) {
        setError('PDF has no form fields! You need to add fillable form fields using Adobe Acrobat.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>PDF Form Field Inspector</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              This tool inspects PDF templates to see what form fields they contain.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => inspectPDF('/pdf/ConsentUAE_2025.pdf')}
                disabled={isLoading}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? 'Inspecting...' : 'Inspect UAE Template'}
              </button>

              <button
                onClick={() => inspectPDF('/pdf/ConsentExpats_2025.pdf')}
                disabled={isLoading}
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 disabled:opacity-50"
              >
                {isLoading ? 'Inspecting...' : 'Inspect Expats Template'}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-100 text-red-800 border border-red-300 rounded-lg">
              <strong>⚠️ Error:</strong>
              <p className="mt-1">{error}</p>
              {error.includes('no form fields') && (
                <div className="mt-4 p-3 bg-red-50 rounded">
                  <p className="font-semibold mb-2">How to add form fields:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Open the PDF in Adobe Acrobat Pro</li>
                    <li>Go to Tools → Prepare Form</li>
                    <li>Add text fields with these exact names:</li>
                  </ol>
                  <ul className="list-disc list-inside ml-4 mt-2 text-sm font-mono">
                    <li>SchoolName</li>
                    <li>SchoolAddress</li>
                    <li>SchoolPhone</li>
                    <li>StudentName</li>
                    <li>StudentEID</li>
                    <li>ParentName</li>
                    <li>ParentEID</li>
                    <li>ParentPhone</li>
                    <li>ParentAddress</li>
                    <li>SignDate</li>
                  </ul>
                  <p className="mt-2 text-sm">Then save and re-upload the PDF.</p>
                </div>
              )}
            </div>
          )}

          {fields.length > 0 && (
            <div className="p-4 bg-green-100 text-green-800 border border-green-300 rounded-lg">
              <strong>✓ Found {fields.length} form fields:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {fields.map((field, index) => (
                  <li key={index} className="font-mono text-sm">
                    {field}
                  </li>
                ))}
              </ul>

              <div className="mt-4 p-3 bg-green-50 rounded">
                <p className="font-semibold mb-2">Expected field names in our code:</p>
                <ul className="list-disc list-inside text-sm font-mono space-y-1">
                  <li>SchoolName</li>
                  <li>SchoolAddress</li>
                  <li>SchoolPhone</li>
                  <li>StudentName</li>
                  <li>StudentEID</li>
                  <li>ParentName</li>
                  <li>ParentEID</li>
                  <li>ParentPhone</li>
                  <li>ParentAddress</li>
                  <li>SignDate</li>
                </ul>
                <p className="mt-2 text-sm">
                  ⚠️ Make sure the field names in the PDF match these exactly (case-sensitive)!
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">About Form Fields</h4>
            <p className="text-sm text-blue-800">
              PDF form fields are interactive elements that can be filled programmatically. 
              If your PDF doesn't have form fields, you'll need to add them using Adobe Acrobat Pro 
              before you can use the PDF generation feature.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
