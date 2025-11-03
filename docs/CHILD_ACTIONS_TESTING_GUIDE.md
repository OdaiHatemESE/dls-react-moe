# Child Actions System - Testing Guide

## Overview
This guide explains how the child actions system works and provides test cases for all scenarios.

---

## 🎯 How Actions Work

The action system determines which buttons appear on child cards based on:

1. **IDH Status ID** - Tracks student update request status (from external API)
2. **Update Period Active** - Whether parents can currently update information
3. **PDF Availability** - Whether conduct PDF document exists
4. **Conduct Signature Status** - Whether parent signed the conduct agreement

---

## 📊 Status ID Values & Meanings

| Status ID | Meaning | Description |
|-----------|---------|-------------|
| `null` | **No Record** | Student has never submitted an update request |
| `1` | **Pending Review** | Update request submitted and awaiting approval |
| `2` | **Approved/Completed** | Update request was approved and completed |
| `3` | **Under Review** | Update request is currently being reviewed |
| `4` | **Approved - Signature Needed** | Update approved but requires conduct signature |
| `5` | **Rejected** | Update request was rejected and needs resubmission |

---

## 🔧 Default Actions Configuration

### 1. **Update Info** (`update-info`)
**Purpose:** Allow parents to update student contact, address, and transportation info

**Availability Rules:**
```typescript
{
  status: { include: [null, 2, 5] },  // Only when can submit/resubmit
  requiresUpdatePeriod: true           // Only during update window
}
```

**Behavior Matrix:**

| Status | Period Active | Result | Href Template |
|--------|--------------|--------|---------------|
| `null` | ✅ Yes | ✅ **ENABLED** | `/child/:id/update-info?mode=init` |
| `null` | ❌ No | 🔒 **DISABLED** | Reason: "Updates temporarily disabled" |
| `2` | ✅ Yes | ✅ **ENABLED** | `/child/:id/update-info?mode=resubmit` |
| `5` | ✅ Yes | ✅ **ENABLED** | `/child/:id/update-info?mode=resubmit` |
| `1` | ✅ Yes | 🚫 **HIDDEN** | Request in progress |
| `3` | ✅ Yes | 🚫 **HIDDEN** | Under review |
| `4` | ✅ Yes | 🚫 **HIDDEN** | Already approved |

---

### 2. **Sign Conduct** (`sign-conduct`)
**Purpose:** Allow parents to review and digitally sign school conduct charter

**Availability Rules:**
```typescript
{
  status: { include: [1, 3, 4] },        // During/after update process
  requiresConductSignature: "unsigned"   // Only if not yet signed
}
```

**Behavior Matrix:**

| Status | Conduct Signed | Result | Href Template |
|--------|----------------|--------|---------------|
| `1` | ❌ No | ✅ **ENABLED** | `/child/:id/parent-conduct` |
| `3` | ❌ No | ✅ **ENABLED** | `/child/:id/parent-conduct` |
| `4` | ❌ No | ✅ **ENABLED** | `/child/:id/parent-conduct` |
| `4` | ✅ Yes | 🚫 **HIDDEN** | Already signed |
| `null` | ❌ No | 🚫 **HIDDEN** | No update request |
| `2` | ❌ No | 🚫 **HIDDEN** | Process completed |

---

### 3. **Download Conduct** (`download-conduct`)
**Purpose:** Download signed conduct agreement PDF

**Availability Rules:**
```typescript
{
  status: { include: [1, 3, 4] },
  requiresPdf: true,
  requiresPdfMode: "disable"  // Disable (not hide) if missing
}
```

**Behavior Matrix:**

| Status | Has PDF | Result | Download Handler |
|--------|---------|--------|------------------|
| `1` | ✅ Yes | ✅ **ENABLED** | `conduct-pdf` |
| `3` | ✅ Yes | ✅ **ENABLED** | `conduct-pdf` |
| `4` | ✅ Yes | ✅ **ENABLED** | `conduct-pdf` |
| `4` | ❌ No | 🔒 **DISABLED** | Reason: "Conduct PDF not available yet" |
| `null` | ✅ Yes | 🚫 **HIDDEN** | No update request |

---

### 4. **View Profile** (`view-profile`)
**Purpose:** Navigate to student's full profile page

**Availability Rules:**
```typescript
{} // No restrictions - always available
```

**Behavior Matrix:**

| Status | Result | Href Template |
|--------|--------|---------------|
| Any | ✅ **ENABLED** | `/child/:id` |

---

## 🏷️ Badge Display Logic

### "Update Required" Badge (Urgent/Red)
**Shows when:** Status requires action AND update period is active

| Status | Period Active | Badge Shown |
|--------|--------------|-------------|
| `null` | ✅ Yes | ✅ "Update Required" |
| `2` | ✅ Yes | ✅ "Update Required" |
| `5` | ✅ Yes | ✅ "Update Required" |
| `null` | ❌ No | ❌ None |
| `1` | ✅ Yes | ❌ None |
| `3` | ✅ Yes | ❌ None |
| `4` | ✅ Yes | ❌ None (see signature badge) |

### "Signature Required" Badge (Info/Blue)
**Shows when:** Status is 4 AND conduct not signed AND update period active

| Status | Conduct Signed | Period Active | Badge Shown |
|--------|----------------|--------------|-------------|
| `4` | ❌ No | ✅ Yes | ✅ "Signature Required" |
| `4` | ✅ Yes | ✅ Yes | ❌ None |
| `4` | ❌ No | ❌ No | ❌ None |

---

## 📢 Status Banner Logic

### "In Progress" Banner (Info)
**Shows when:** Status indicates active processing AND update period active

| Status | Period Active | Banner Shown |
|--------|--------------|--------------|
| `1` | ✅ Yes | ✅ "Update request in progress..." |
| `3` | ✅ Yes | ✅ "Update request in progress..." |
| `1` | ❌ No | ❌ None |
| `null` | ✅ Yes | ❌ None |
| `2` | ✅ Yes | ❌ None |
| `4` | ✅ Yes | ❌ None |
| `5` | ✅ Yes | ❌ None |

---

## 🧪 Test Scenarios

### Test Case 1: New Student (Never Submitted)
```typescript
{
  idhStatusId: null,
  updatePeriodActive: true,
  isConductAgreementSigned: false,
  pdfBase64: null
}

Expected Results:
✅ Actions: ["update-info" (enabled), "view-profile" (enabled)]
✅ Badge: "Update Required" (urgent)
❌ Banner: None
❌ Downloads: None
```

### Test Case 2: Update In Progress
```typescript
{
  idhStatusId: 1,
  updatePeriodActive: true,
  isConductAgreementSigned: false,
  pdfBase64: null
}

Expected Results:
✅ Actions: ["sign-conduct" (enabled), "download-conduct" (disabled), "view-profile" (enabled)]
❌ Badge: None
✅ Banner: "Update request in progress..." (info)
❌ Downloads: None
```

### Test Case 3: Approved - Needs Signature
```typescript
{
  idhStatusId: 4,
  updatePeriodActive: true,
  isConductAgreementSigned: false,
  pdfBase64: "base64string..."
}

Expected Results:
✅ Actions: ["sign-conduct" (enabled), "download-conduct" (enabled), "view-profile" (enabled)]
✅ Badge: "Signature Required" (info)
❌ Banner: None
✅ Downloads: Conduct PDF available
```

### Test Case 4: Fully Completed
```typescript
{
  idhStatusId: 4,
  updatePeriodActive: true,
  isConductAgreementSigned: true,
  pdfBase64: "base64string..."
}

Expected Results:
✅ Actions: ["download-conduct" (enabled), "view-profile" (enabled)]
❌ Badge: None
❌ Banner: None
✅ Downloads: Conduct PDF available
```

### Test Case 5: Rejected - Needs Resubmission
```typescript
{
  idhStatusId: 5,
  updatePeriodActive: true,
  isConductAgreementSigned: false,
  pdfBase64: null
}

Expected Results:
✅ Actions: ["update-info" (enabled), "view-profile" (enabled)]
✅ Badge: "Update Required" (urgent)
❌ Banner: None
❌ Downloads: None
```

### Test Case 6: Update Period Closed
```typescript
{
  idhStatusId: null,
  updatePeriodActive: false,
  isConductAgreementSigned: false,
  pdfBase64: null
}

Expected Results:
✅ Actions: ["update-info" (disabled), "view-profile" (enabled)]
❌ Badge: None (period closed)
❌ Banner: None
❌ Downloads: None
Reason: "Updates temporarily disabled"
```

### Test Case 7: Previously Approved (Can Update Again)
```typescript
{
  idhStatusId: 2,
  updatePeriodActive: true,
  isConductAgreementSigned: true,
  pdfBase64: "base64string..."
}

Expected Results:
✅ Actions: ["update-info" (enabled), "view-profile" (enabled)]
✅ Badge: "Update Required" (urgent)
❌ Banner: None
✅ Downloads: Conduct PDF available
```

### Test Case 8: Under Review
```typescript
{
  idhStatusId: 3,
  updatePeriodActive: true,
  isConductAgreementSigned: false,
  pdfBase64: null
}

Expected Results:
✅ Actions: ["sign-conduct" (enabled), "download-conduct" (disabled), "view-profile" (enabled)]
❌ Badge: None
✅ Banner: "Update request in progress..." (info)
❌ Downloads: None
```

---

## 🔍 Testing with Console Logs

The system now includes comprehensive console logging. When you call the actions API, you'll see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 RESOLVING CHILD ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Context:
  Student ID: 123456
  Education Type: General
  IDH Status ID: null (no record)
  Status Meaning: No record (never submitted)
  Update Period Active: ✅ YES
  Has PDF: ❌ NO
  Conduct Signed: ❌ NO
  Configs Loaded: 4

  🔍 Evaluating action: update-info
     Current status: null
     Result: ✅ ENABLED
     Href: /child/123456/update-info?mode=init

  🔍 Evaluating action: sign-conduct
     Current status: null
     ❌ HIDDEN: Status null not in include list [1, 3, 4]

🎯 RESOLVED ACTIONS:

  [1] UPDATE-INFO
      Label: Update Information
      Type: href
      Hidden: ✅ NO
      Disabled: ✅ NO
      Href: /child/123456/update-info?mode=init
      Variant: primary
      Color: primary

🏷️  BADGE: Update Required (urgent)
📢 BANNER: None
💾 DOWNLOADS: No PDFs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🧑‍💻 How to Test

### Method 1: API Testing
```bash
# Test with different status values
curl "http://localhost:4200/api/parent/child-actions?studentPersonId=123&includeIdh=true&idhDebug=true"
```

### Method 2: Browser DevTools
1. Open browser console
2. Navigate to parent dashboard
3. Look for child action logs
4. Verify actions, badges, and banners match expectations

### Method 3: Manual Status Simulation
Temporarily modify the API route to test specific scenarios:
```typescript
// In route.ts, override IDH fetch
idhStatusId = 1;  // Test "pending review" scenario
```

---

## 📝 Template Variables

Actions use template variables that get replaced with actual values:

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `:studentPersonId` | `123456` | Student's OneRoster sourced ID |
| `:studentId` | `123456` | Alias for studentPersonId |
| `:parentPersonId` | `789012` | Parent's OneRoster sourced ID |
| `:studentEmirateId` | `784-1234-5678901-2` | Student's Emirates ID |
| `:educationType` | `General` | Type of education (General/Private) |
| `:updateMode` | `init` or `resubmit` | Whether first submission or resubmission |
| `:idhStatusId` | `1` | Current IDH status ID |

### Example Templates:
```typescript
// Update info action
hrefTemplate: "/child/:studentPersonId/update-info?mode=:updateMode"
// Becomes: "/child/123456/update-info?mode=init" (when status is null)
// Becomes: "/child/123456/update-info?mode=resubmit" (when status is 2 or 5)

// Conduct signature action
hrefTemplate: "/child/:studentPersonId/parent-conduct"
// Becomes: "/child/123456/parent-conduct"

// Download action
downloadFileName: "conduct-agreement-:studentPersonId.pdf"
// Becomes: "conduct-agreement-123456.pdf"
```

---

## 🎨 Action Styling

### Colors
- `primary` - Blue (main actions)
- `secondary` - Gray (alternative actions)
- `info` - Light blue (informational)
- `success` - Green (positive actions)
- `warning` - Yellow/orange (caution)
- `danger` - Red (critical)
- `neutral` - Gray (neutral)

### Variants
- `solid` - Filled background
- `outline` - Border only
- `ghost` - No border, transparent
- `link` - Text only, no styling

### Legacy Variants (for compatibility)
- `primary` - Main action button
- `secondary` - Alternative action
- `download` - Download button
- `neutral` - View/info button

---

## 🚀 Next Steps

1. **Run the dev server**: `npm run dev`
2. **Navigate to parent dashboard**
3. **Check console logs** for detailed action evaluation
4. **Test each scenario** by modifying status values
5. **Verify UI matches** expected behavior from test cases

---

## 📚 Related Files

- **Main Logic**: `/lib/child-actions.ts`
- **Type Definitions**: `/types/child-actions.ts`
- **API Route**: `/app/api/parent/child-actions/route.ts`
- **Database Config**: `prisma/parent-portal/schema.prisma` (StudentActionConfig table)

---

## ⚙️ Admin Configuration

Actions are configurable via the `StudentActionConfig` table. Each config includes:

```typescript
{
  educationType: "General",  // Which education type this applies to
  actionKey: "update-info",  // Unique identifier
  actionName: "Update Information",
  isEnabled: true,
  displayOrder: 1,
  configJson: {
    display: {
      label: { en: "Update Info", ar: "تحديث المعلومات" },
      description: { en: "...", ar: "..." }
    },
    style: {
      icon: "edit-3",
      color: "primary",
      variant: "solid"
    },
    action: {
      type: "href",
      hrefTemplate: "/child/:studentPersonId/update-info?mode=:updateMode"
    },
    availability: {
      status: { include: [null, 2, 5] },
      requiresUpdatePeriod: true
    }
  }
}
```

If no config exists, the system falls back to hardcoded defaults in `FALLBACK_CONFIGS`.
