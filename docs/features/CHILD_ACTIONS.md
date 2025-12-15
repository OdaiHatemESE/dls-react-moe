# Student Actions System

**Last Updated:** December 15, 2025  
**Version:** 1.0

---

## Table of Contents

- [Quick Start](#quick-start)
- [System Overview](#system-overview)
- [Status Flow](#status-flow)
- [Action Availability](#action-availability)
- [Configuration](#configuration)
- [Implementation Guide](#implementation-guide)

---

## Quick Start

### What is the Student Actions System?

The student actions system determines what actions are available for each student based on:
- ✅ **Update Period**: Is there an active update period?
- ✅ **Active Enrollment**: Does student have active enrollment?
- ✅ **Conduct Signature**: Unsigned/signed/any
- ✅ **IDH Status**: Independent tracking of information updates

### Key Principles

1. **Update Info** and **Conduct Signature** are **completely independent** systems
2. Actions show based on simple, predictable rules (no complex status filtering)
3. Update Info is controlled by IDH status (null, 1, 2, 3, 4, 5)
4. Conduct actions are controlled by signature status (signed/unsigned)
5. They can both appear together or separately

---

## System Overview

### Two Independent Data Sources

#### 1. IDH Status System (Info Update)

**Controls:** "Update Info" action ONLY

**Data Source:** External IDH API
- `idhStatusId`: null, 1, 2, 3, 4, 5
- `idhFetchedAt`: timestamp

**Status Meanings:**
- `null` = No record → **Can submit**
- `1` = Pending → **Cannot update** (in progress)
- `2` = Completed → **Can submit again**
- `3` = Under review → **Cannot update** (in progress)
- `4` = Approved → **Cannot update** (final)
- `5` = Rejected → **Can resubmit**

**Action Rule:**
```typescript
"update-info": {
  availability: {
    status: { include: [null, 2, 5] },  // Can update when: no record, completed, or rejected
    requiresUpdatePeriod: true           // Must be during update window
  }
}
```

#### 2. Conduct Signature System

**Controls:** "Sign Conduct" and "Download Conduct" actions ONLY

**Data Source:** Database (Parent Portal)
- `isConductAgreementSigned`: boolean
- `pdfBase64`: string | null

**Action Rules:**
```typescript
"sign-conduct": {
  availability: {
    requiresConductSignature: "unsigned"  // Show only if NOT signed
    // NO IDH STATUS REQUIREMENT!
  }
}

"download-conduct": {
  availability: {
    requiresPdf: true,          // Show only if PDF exists
    requiresPdfMode: "disable"  // Disable if PDF missing
    // NO IDH STATUS REQUIREMENT!
  }
}
```

---

## Status Flow

### Student Update Lifecycle

```
                              ┌──────────┐
                              │  START   │
                              └────┬─────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │   Status: null   │ ◄──┐
                         │  (No Record)     │    │
                         └────┬─────────────┘    │
                              │                   │
                         ✅ Submit Update         │
                              │                   │
                              ▼                   │
                       ┌─────────────┐            │
                       │  Status: 1  │            │
                       │  (Pending)  │            │
                       └──┬──────────┘            │
                          │                       │
              ┌───────────┼───────────┐           │
              ▼           ▼           ▼           │
         ┌─────────┐ ┌─────────┐ ┌─────────┐    │
         │Status: 2│ │Status: 3│ │Status: 5│    │
         │Approved │ │Under    │ │Rejected │────┘ (Can Resubmit)
         │Complete │ │Review   │ │         │
         └────┬────┘ └────┬────┘ └─────────┘
              │           │
              │           ▼
              │      ┌─────────┐
              │      │Status: 4│
              │      │Approved │
              │      │Need Sig │
              │      └────┬────┘
              │           │
              │      ✅ Sign Conduct
              │           │
              └───────────┴──────► COMPLETE


LEGEND:
  null = No record exists (never submitted)
  1    = Pending review
  2    = Approved/Completed (can update again next period)
  3    = Under review
  4    = Approved but needs conduct signature
  5    = Rejected (must fix and resubmit)
```

---

## Action Availability

### Action Visibility Matrix

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          ACTION VISIBILITY MATRIX                           │
├────────┬─────────────┬───────────────┬─────────────────┬──────────────────┤
│ Status │ Update Info │ Sign Conduct  │ Download Conduct│ View Profile     │
├────────┼─────────────┼───────────────┼─────────────────┼──────────────────┤
│  null  │  ✅ SHOW    │  🚫 HIDE      │  🚫 HIDE        │  ✅ SHOW         │
│   1    │  🚫 HIDE    │  ✅ SHOW*     │  ✅ SHOW**      │  ✅ SHOW         │
│   2    │  ✅ SHOW    │  🚫 HIDE      │  🚫 HIDE        │  ✅ SHOW         │
│   3    │  🚫 HIDE    │  ✅ SHOW*     │  ✅ SHOW**      │  ✅ SHOW         │
│   4    │  🚫 HIDE    │  ✅ SHOW*     │  ✅ SHOW**      │  ✅ SHOW         │
│   5    │  ✅ SHOW    │  🚫 HIDE      │  🚫 HIDE        │  ✅ SHOW         │
└────────┴─────────────┴───────────────┴─────────────────┴──────────────────┘

* Sign Conduct: Only if NOT already signed
** Download Conduct: Disabled if PDF not available
```

### Disabled Conditions

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        ACTION DISABLED CONDITIONS                           │
├─────────────────┬──────────────────────────────────────────────────────────┤
│ Action          │ Disabled When                                            │
├─────────────────┼──────────────────────────────────────────────────────────┤
│ Update Info     │ ❌ Update period is CLOSED                               │
│                 │    Reason: "Updates temporarily disabled"                │
├─────────────────┼──────────────────────────────────────────────────────────┤
│ Sign Conduct    │ ✅ Never disabled (only hidden)                          │
├─────────────────┼──────────────────────────────────────────────────────────┤
│ Download Conduct│ ❌ PDF not available                                     │
│                 │    Reason: "Conduct PDF not available yet"               │
├─────────────────┼──────────────────────────────────────────────────────────┤
│ View Profile    │ ✅ Never disabled                                        │
└─────────────────┴──────────────────────────────────────────────────────────┘
```

### Badge Display Rules

```
┌────────────────────────────────────────────────────────────────────────────┐
│                            BADGE DISPLAY LOGIC                              │
├────────┬─────────────────┬──────────────────┬────────────────────────────┤
│ Status │ Update Period   │ Conduct Signed   │ Badge                       │
├────────┼─────────────────┼──────────────────┼────────────────────────────┤
│  null  │  ✅ Active      │  Any             │  🔴 UPDATE REQUIRED        │
│  null  │  ❌ Closed      │  Any             │  ⚪ None                   │
│   1    │  Any            │  Any             │  ⚪ None                   │
│   2    │  ✅ Active      │  Any             │  🔴 UPDATE REQUIRED        │
│   2    │  ❌ Closed      │  Any             │  ⚪ None                   │
│   3    │  Any            │  Any             │  ⚪ None                   │
│   4    │  ✅ Active      │  ❌ Not Signed   │  🔵 SIGNATURE REQUIRED     │
│   4    │  ✅ Active      │  ✅ Signed       │  ⚪ None                   │
│   4    │  ❌ Closed      │  Any             │  ⚪ None                   │
│   5    │  ✅ Active      │  Any             │  🔴 UPDATE REQUIRED        │
│   5    │  ❌ Closed      │  Any             │  ⚪ None                   │
└────────┴─────────────────┴──────────────────┴────────────────────────────┘

BADGE COLORS:
  🔴 UPDATE REQUIRED = Red/Urgent - Action needed
  🔵 SIGNATURE REQUIRED = Blue/Info - Signature needed
  ⚪ None = No badge shown
```

### Banner Display Rules

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           BANNER DISPLAY LOGIC                              │
├────────┬─────────────────┬─────────────────────────────────────────────────┤
│ Status │ Update Period   │ Banner                                          │
├────────┼─────────────────┼─────────────────────────────────────────────────┤
│  null  │  Any            │  ⚪ None                                        │
│   1    │  ✅ Active      │  🔵 "Update request in progress..." (info)     │
│   1    │  ❌ Closed      │  ⚪ None                                        │
│   2    │  Any            │  ⚪ None                                        │
│   3    │  ✅ Active      │  🔵 "Update request in progress..." (info)     │
│   3    │  ❌ Closed      │  ⚪ None                                        │
│   4    │  Any            │  ⚪ None                                        │
│   5    │  Any            │  ⚪ None                                        │
└────────┴─────────────────┴─────────────────────────────────────────────────┘

BANNER TYPES:
  🔵 Info = Blue banner for informational messages
  ⚪ None = No banner shown
```

---

## Configuration

### System Simplification

The student actions system has been **simplified** to remove dependency on complex IDH status filtering.

#### Before (Complex)
Actions were filtered by IDH status codes:
- ✅ Show if status is in "Include" list (e.g., `null, 2, 5`)
- ❌ Hide if status is in "Exclude" list (e.g., `3, 4`)
- 🤔 Confusing for admins and unpredictable for parents

#### After (Simple)
Actions show based on clear rules:
- ✅ **Update Period**: Is there an active update period?
- ✅ **Active Enrollment**: Does student have active enrollment?
- ✅ **Conduct Signature**: Unsigned/signed/any
- ✅ **PDF Availability**: Does student have required PDF?

**No status filtering** - actions are always available when the above conditions are met!

### Availability Rules (Simplified Model)

#### Update Information
- ✅ Shows during **active update period**
- ✅ Requires **active enrollment**
- ❌ Hidden outside update period

#### Sign Conduct Agreement
- ✅ Shows for **unsigned** agreements
- ✅ Requires **active enrollment**
- ❌ Hidden after signing

#### Download Conduct Agreement
- ✅ Shows after **signing** agreement
- ✅ Requires **active enrollment**
- ✅ Always available once signed

#### View Profile
- ✅ **Always available** for all students
- ℹ️ Fallback action when nothing else shows

### Fallback Configuration

**File:** `lib/child-actions.ts`

```typescript
export const fallbackConfig: Record<ActionKey, ActionDescriptor> = {
  "update-info": {
    actionKey: "update-info",
    displayName: "Update Information",
    icon: "FileEdit",
    variant: "default",
    urlTemplate: "/child/:studentPersonId/update-info",
    availability: {
      requiresUpdatePeriod: true,
      requiresActiveEnrollment: true,
    },
  },
  
  "sign-conduct": {
    actionKey: "sign-conduct",
    displayName: "Sign Conduct Agreement",
    icon: "FileSignature",
    variant: "default",
    urlTemplate: "/child/:studentPersonId/parent-conduct",
    availability: {
      requiresConductSignature: "unsigned",
    },
  },
  
  "download-conduct": {
    actionKey: "download-conduct",
    displayName: "Download Conduct PDF",
    icon: "Download",
    variant: "secondary",
    handler: "conduct-pdf",
    availability: {
      requiresPdf: true,
      requiresPdfMode: "disable",
    },
  },
  
  "view-profile": {
    actionKey: "view-profile",
    displayName: "View Profile",
    icon: "Eye",
    variant: "outline",
    urlTemplate: "/child/:studentPersonId",
    availability: {}, // Always available
  },
};
```

---

## Implementation Guide

### Example Scenarios

#### Scenario 1: New Student (Status null, Period Active)
```typescript
{
  idhStatusId: null,              // No update record
  isConductAgreementSigned: false, // Not signed
  pdfBase64: null                  // No PDF
}

Actions Shown:
✅ Update Info (enabled)    // Status null = can submit
✅ Sign Conduct (enabled)   // Not signed = show
❌ Download Conduct (disabled) // No PDF = disabled
✅ View Profile (enabled)   // Always shown
```

Visual:
```
┌──────────────────────────────────────────────────────┐
│ Ahmed Al-Mansouri                                     │
│ Grade 5 • General Education                          │
│                                                       │
│ 🔴 UPDATE REQUIRED                                    │
│                                                       │
│ ┌──────────────────────┐  ┌────────────────────────┐│
│ │  📝 Update Info      │  │  👁️ View Profile      ││
│ │  ENABLED             │  │  ENABLED               ││
│ └──────────────────────┘  └────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

#### Scenario 2: Pending Review (Status 1, Period Active)
```typescript
{
  idhStatusId: 1,                 // Pending review
  isConductAgreementSigned: false, // Not signed
  pdfBase64: null                  // No PDF
}

Actions Shown:
❌ Update Info (hidden)     // Status 1 = in progress
✅ Sign Conduct (enabled)   // Not signed = show
❌ Download Conduct (disabled) // No PDF = disabled
✅ View Profile (enabled)   // Always shown
```

Visual:
```
┌──────────────────────────────────────────────────────┐
│ Sara Al-Zaabi                                         │
│ Grade 8 • General Education                          │
│                                                       │
│ ℹ️ Update request in progress...                     │
│                                                       │
│ ┌────────────┐  ┌──────────────┐  ┌──────────────┐ │
│ │ ✍️ Sign    │  │ 📥 Download  │  │ 👁️ View     │ │
│ │  Conduct   │  │  (Disabled)  │  │  Profile     │ │
│ └────────────┘  └──────────────┘  └──────────────┘ │
└──────────────────────────────────────────────────────┘
```

#### Scenario 3: Approved - Needs Signature (Status 4, Period Active)
```typescript
{
  idhStatusId: 4,                 // Approved final
  isConductAgreementSigned: false, // Not signed
  pdfBase64: "base64string..."     // Has PDF
}

Actions Shown:
❌ Update Info (hidden)     // Status 4 = cannot update
✅ Sign Conduct (enabled)   // Not signed = show
✅ Download Conduct (enabled) // Has PDF = enabled
✅ View Profile (enabled)   // Always shown
```

Visual:
```
┌──────────────────────────────────────────────────────┐
│ Mohammed Al-Hashimi                                   │
│ Grade 10 • General Education                         │
│                                                       │
│ 🔵 SIGNATURE REQUIRED                                 │
│                                                       │
│ ┌────────────┐  ┌──────────────┐  ┌──────────────┐ │
│ │ ✍️ Sign    │  │ 📥 Download  │  │ 👁️ View     │ │
│ │  Conduct   │  │  Conduct     │  │  Profile     │ │
│ │  ENABLED   │  │  ENABLED     │  │  ENABLED     │ │
│ └────────────┘  └──────────────┘  └──────────────┘ │
└──────────────────────────────────────────────────────┘
```

#### Scenario 4: Period Closed (Status null, Period Closed)
```typescript
{
  idhStatusId: null,              // No update record
  isConductAgreementSigned: false, // Not signed
  updatePeriod: { isActive: false } // Period closed
}

Actions Shown:
❌ Update Info (disabled)   // Period closed
✅ Sign Conduct (enabled)   // Not signed = show
❌ Download Conduct (disabled) // No PDF = disabled
✅ View Profile (enabled)   // Always shown
```

Visual:
```
┌──────────────────────────────────────────────────────┐
│ Fatima Al-Ali                                         │
│ Grade 3 • General Education                          │
│                                                       │
│ ┌──────────────────────┐  ┌────────────────────────┐│
│ │  📝 Update Info      │  │  👁️ View Profile      ││
│ │  🔒 DISABLED         │  │  ENABLED               ││
│ │  (Period closed)     │  │                        ││
│ └──────────────────────┘  └────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

### Avatar Icon Priority

Avatar shows ONE icon in this priority order:

1. **🔴 Red Alert (pulsing)** - Update Required (status: null, 2, 5)
2. **🔴 Red X** - Update Rejected (status: 5)
3. **🔵 Blue Spinner** - Update In Progress (status: 1, 3)
4. **🔵 Blue Pen** - Signature Required (status: 4 + not signed)
5. **✅ Green Check** - All Complete (status: 4 + signed)

### URL Template Examples

```
Update Info (New):
  /child/123456/update-info?mode=init

Update Info (Resubmit):
  /child/123456/update-info?mode=resubmit

Sign Conduct:
  /child/123456/parent-conduct

View Profile:
  /child/123456

Download Conduct:
  Handler: conduct-pdf
  Filename: conduct-agreement-123456.pdf
```

### Testing

```bash
# Test new student (no record)
curl "http://localhost:4200/api/parent/child-actions?studentPersonId=123&idhDebug=true"

# Test with specific status (requires header support in API)
curl -H "x-test-idh-status: 4" \
  "http://localhost:4200/api/parent/child-actions?studentPersonId=123"
```

---

## Key Takeaways

1. **Update Info = IDH Status Only**
   - Controlled by: `idhStatusId`
   - Shows when: null, 2, or 5
   - Requires: Update period active

2. **Conduct Actions = Signature Status Only**
   - Controlled by: `isConductAgreementSigned`, `pdfBase64`
   - Shows when: Not signed (for sign) or PDF exists (for download)
   - Does NOT check IDH status

3. **They Can Appear Together**
   - Student can need both update info AND conduct signature
   - Student can need only one or the other
   - Completely independent workflows

4. **Badges Indicate Different Things**
   - "Update Required" = Need to update info (IDH)
   - "Signature Required" = Need to sign conduct (separate)
   - Can have either, both, or neither

5. **Period Closed Behavior**
   - When update period is closed, badges and banners are hidden regardless of status
   - Actions that require update period are disabled
   - Conduct actions remain available

---

## Related Documentation

- [System Architecture](../core/ARCHITECTURE.md) - Database and API design
- [Notifications System](./NOTIFICATIONS.md) - User notifications
- [Admin Panel](./ADMIN_PANEL.md) - Configuration management

---

**Document Version**: 1.0  
**Last Updated**: December 15, 2025  
**Maintained By**: Development Team
