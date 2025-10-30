# Academic Year Configuration - Admin Guide

## Overview
The Academic Year Configuration allows system administrators to manage and set the active academic year for the parent portal. This configuration is critical as it determines which academic year is used throughout the system for various operations.

## Accessing the Configuration

1. Navigate to the Admin Panel at `/admin/eid`
2. Click on **"Academic Year"** in the left sidebar
3. You'll see the Academic Year Configuration page

## Initial Setup

### First Time Setup - Initialize Default Years

If no academic years are configured, you'll see an option to **"Initialize Defaults"**:

1. Click the **"Initialize Defaults"** button
2. Confirm the action in the dialog
3. The system will create 6 academic years:
   - 2025-2026 (Value: 2026) - Set as active by default
   - 2026-2027 (Value: 2027)
   - 2027-2028 (Value: 2028)
   - 2028-2029 (Value: 2029)
   - 2029-2030 (Value: 2030)
   - 2030-2031 (Value: 2031)

## Understanding Academic Year Values

Each academic year consists of:
- **Academic Year**: Display format (e.g., "2025-2026")
- **Year Value**: The **ending year** (e.g., 2026)

The year value is what gets stored and used in system operations.

## Managing Academic Years

### View Academic Years
The table shows all configured academic years with:
- Academic Year name
- Year Value
- Status (Active/Set Active button)
- Description
- Actions (Edit/Delete)

### Add a New Academic Year

1. Click the **"Add Year"** button
2. Select an academic year from the dropdown (2025-2026 through 2030-2031)
3. (Optional) Enter a description
4. (Optional) Check "Set as Active Year" to make it the current year
5. Click **"Create"**

**Note:** If you select "Set as Active Year", all other years will be automatically deactivated.

### Edit an Academic Year

1. Click the **Edit** (pencil icon) button next to the year you want to modify
2. Update the description
3. Toggle "Set as Active Year" if needed
4. Click **"Update"**

**Note:** You cannot change the academic year value once created.

### Set Active Year

To change which year is currently active:

1. Find the year you want to activate in the table
2. Click the **"Set Active"** button in the Status column
3. The system will:
   - Deactivate the current active year
   - Activate the selected year
   - Display "Active" badge with a checkmark

**Note:** Only ONE year can be active at a time.

### Delete an Academic Year

1. Click the **Delete** (trash icon) button next to the year
2. Confirm the deletion in the dialog

**Restrictions:**
- You **cannot delete** the currently active academic year
- The delete button will be disabled for the active year

## Best Practices

### When to Change Active Year
- Change the active academic year at the start of each new school year
- Typically done before the academic year begins or during transition periods
- Coordinate with other system administrators before changing

### Planning Ahead
- Keep at least 2-3 future years configured
- Add new years before the current year expires
- Review and update descriptions as needed

### Data Integrity
- Never delete the active academic year
- Ensure there's always one active year configured
- Backup your data before making bulk changes

## Common Workflows

### Scenario 1: Start of New Academic Year (September 2026)

1. Go to Academic Year configuration
2. Find "2026-2027" in the table
3. Click **"Set Active"** button
4. Confirm the change
5. The system now uses 2026-2027 as the active year

### Scenario 2: Add Future Years

1. Click **"Add Year"**
2. Select "2031-2032" from dropdown
3. Enter description: "Academic year 2031-2032"
4. Leave "Set as Active Year" unchecked
5. Click **"Create"**

### Scenario 3: Update Year Description

1. Click **Edit** next to the year
2. Update description to be more specific
3. Click **"Update"**

## Visual Indicators

- **Active Year**: Displayed with a green gradient badge and checkmark icon
- **Inactive Years**: Show a "Set Active" button
- **Table Headers**: 
  - Academic Year
  - Year Value (displayed in monospace font)
  - Status
  - Description
  - Actions

## Troubleshooting

### Can't Delete a Year
**Cause:** The year is currently active
**Solution:** Set a different year as active first, then delete

### Initialize Button Not Showing
**Cause:** Years are already configured
**Solution:** This is normal - the button only appears when no years exist

### Changes Not Saving
**Cause:** Network error or session timeout
**Solution:** 
1. Check your internet connection
2. Refresh the page and try again
3. Re-login if session expired

## Technical Notes

### Database Table
Academic years are stored in the `AcademicYearConfig` table with:
- Unique constraint on `academicYear`
- Only one year can have `isActive = true`
- Automatic timestamps for creation and updates

### API Endpoints
The configuration uses `/api/admin/config/academic-year` for all operations:
- GET: Retrieve years
- POST: Create new year
- PATCH: Update existing year
- DELETE: Remove year

### Helper Functions
Server-side code can access active year via:
```typescript
import { getActiveAcademicYear, getActiveAcademicYearValue } from '@/lib/admin-config';

const activeYear = await getActiveAcademicYear();
const yearValue = await getActiveAcademicYearValue();
```

## Support

For technical issues or questions:
1. Check the API documentation in `/app/api/admin/config/academic-year/README.md`
2. Review system logs for errors
3. Contact your system administrator

---

**Last Updated:** October 30, 2025  
**Version:** 1.0
