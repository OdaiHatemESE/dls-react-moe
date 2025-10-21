# PDF Generation - Quick Start Checklist

## ✅ Installation Complete

- [x] `pdf-lib` installed
- [x] `@pdf-lib/fontkit` installed
- [x] Cairo Arabic font downloaded to `/public/fonts/`
- [x] PDF templates exist in `/app/child/[id]/parent-conduct/pdf/`
- [x] Core library created at `/lib/pdf-generator.ts`
- [x] API endpoint created at `/app/api/parent/generate-conduct-pdf/route.ts`
- [x] Integration added to parent conduct page
- [x] Test page created at `/app/debug/pdf-test`

## 📋 Next Steps

### 1. Verify PDF Templates Have Form Fields
The PDF templates must have fillable form fields. To check:

```bash
# Option A: Open in Adobe Acrobat and check for form fields
open public/pdf/ConsentUAE_2025.pdf

# Option B: Use a PDF tool to inspect form fields
```

**Required form field names:**
- SchoolName
- SchoolAddress
- SchoolPhone
- StudentName
- StudentEID
- ParentName
- ParentEID
- ParentPhone
- ParentAddress
- SignDate

### 2. Test the Implementation

#### Option A: Use Test Page
1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:4200/debug/pdf-test`
3. Click "Test Client-Side Generation"
4. Check if PDF downloads successfully
5. Open downloaded PDF and verify:
   - All fields are filled
   - Arabic text renders correctly
   - Layout is correct

#### Option B: Use Real Page
1. Navigate to: `http://localhost:4200/child/[student-id]/parent-conduct`
2. Complete all steps
3. Sign the charter
4. Verify PDF downloads
5. Click "Download PDF" to re-download

### 3. If PDFs Don't Have Form Fields

You'll need to add form fields to the PDFs using Adobe Acrobat Pro:

1. Open PDF in Adobe Acrobat Pro
2. Go to Tools → Prepare Form
3. Add text fields with the exact names from the list above
4. Set properties:
   - Font: Support Arabic (e.g., Arial Unicode MS)
   - Alignment: Center
   - Multi-line: No (unless for address fields)
5. Save the PDF

### 4. Customize (Optional)

#### Change Template Selection Logic
Edit `/app/child/[id]/parent-conduct/page.tsx`:

```typescript
// Currently hardcoded to UAE template
const templatePath = '/child/' + routeChildId + '/parent-conduct/pdf/ConsentUAE_2025.pdf';

// Change to dynamic selection based on student nationality:
const templatePath = studentPerson?.nationality === 'UAE'
  ? '/child/' + routeChildId + '/parent-conduct/pdf/ConsentUAE_2025.pdf'
  : '/child/' + routeChildId + '/parent-conduct/pdf/ConsentExpats_2025.pdf';
```

#### Add More Fields
1. Edit `fieldMapping` in `/lib/pdf-generator.ts`
2. Add to `PdfFormData` interface
3. Update PDF template
4. Update `handleGeneratePDF` in page component

## 🧪 Testing Commands

```bash
# Start dev server
npm run dev

# Test client-side generation
# Visit: http://localhost:4200/debug/pdf-test

# Test API endpoint with curl
curl -X POST http://localhost:4200/api/parent/generate-conduct-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "SchoolName": "Test School",
    "SchoolAddress": "123 Test St",
    "SchoolPhone": "+971 4 123 4567",
    "Name": "Test Student",
    "StudentEmiratesID": "784-1990-1234567-1",
    "ParentName": "Test Parent",
    "ParentEmiratesID": "784-1985-7654321-2",
    "Phone": "+971 50 123 4567",
    "Address": "456 Test Ave",
    "SignDate": "2025-01-15",
    "template": "uae"
  }'
```

## 📄 Documentation

- **Implementation Guide**: `/PDF_IMPLEMENTATION_SUMMARY.md`
- **System Documentation**: `/PDF_GENERATION.md`
- **Template Info**: `/app/child/[id]/parent-conduct/pdf/README.md`

## 🎯 Expected Output

After successful generation, you should get:
- A downloaded PDF file named `{StudentName}_ParentConduct.pdf`
- All form fields filled with correct data
- Arabic text rendered properly
- Centered text alignment
- Current date in SignDate field
- Base64 string logged to console

## ⚠️ Common Issues

### Issue: PDF downloads but fields are empty
**Solution**: PDF template doesn't have form fields. Add them in Adobe Acrobat Pro.

### Issue: Arabic text shows as boxes/question marks
**Solution**: 
1. Check font file exists at `/public/fonts/Cairo-Regular.ttf`
2. Verify font supports Arabic characters
3. Check PDF form fields are configured for Unicode text

### Issue: "Failed to load PDF template" error
**Solution**: Check template path is correct. Use relative path from `public` directory.

### Issue: Client-side generation fails
**Solution**: Fall back to server-side API by calling `/api/parent/generate-conduct-pdf`

## 🚀 Production Checklist

Before deploying:
- [ ] Test PDF generation in production-like environment
- [ ] Verify all form fields are filled correctly
- [ ] Test with Arabic names and addresses
- [ ] Test with long text values
- [ ] Add error tracking (e.g., Sentry)
- [ ] Add analytics for PDF downloads
- [ ] Consider rate limiting API endpoint
- [ ] Add user feedback for PDF generation status
- [ ] Test on mobile devices
- [ ] Verify PDF compatibility with PDF readers

## 💡 Tips

1. **Cache PDFs**: Consider caching generated PDFs in database or cloud storage
2. **Email Integration**: Send generated PDF via email after signing
3. **Audit Trail**: Log PDF generation events for compliance
4. **Batch Generation**: Extend API to support multiple PDFs at once
5. **Custom Branding**: Add school logo/watermark to PDFs

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Review logs in terminal
3. Test with `/debug/pdf-test` page
4. Verify all prerequisites are met
5. Check documentation in `/PDF_GENERATION.md`
