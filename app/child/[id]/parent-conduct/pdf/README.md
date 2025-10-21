# Parent Conduct PDF Templates

This directory contains PDF templates for the parent conduct charter/agreement.

## Templates

- **ConsentUAE_2025.pdf**: Template for UAE nationals
- **ConsentExpats_2025.pdf**: Template for expatriates

## Form Fields

The PDF templates should contain the following fillable form fields:

- `SchoolName`: Name of the school
- `SchoolAddress`: School address
- `SchoolPhone`: School contact phone
- `StudentName`: Full name of the student
- `StudentEID`: Student Emirates ID
- `ParentName`: Full name of the parent/guardian
- `ParentEID`: Parent Emirates ID
- `ParentPhone`: Parent contact phone
- `ParentAddress`: Parent address
- `SignDate`: Date of signature

## Usage

The PDF generation is handled by `/lib/pdf-generator.ts` which uses `pdf-lib` and `@pdf-lib/fontkit` to:

1. Load the PDF template
2. Embed Arabic font (Cairo) for proper text rendering
3. Fill form fields with data
4. Generate base64-encoded PDF
5. Trigger download in browser

## Font

The Arabic font used is Cairo (variable font) located at `/public/fonts/Cairo-Regular.ttf`.

## Implementation

See `/app/child/[id]/parent-conduct/page.tsx` for the integration example:
- Data is collected from the form
- `generatePDF()` is called with the data
- Returns base64-encoded PDF string
- Can trigger automatic download
