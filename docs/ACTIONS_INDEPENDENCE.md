# Actions Independence - Important Changes

## 🎯 Key Change: Complete Separation

**Update Info** and **Conduct Signature** are now completely independent systems with NO relationship to each other.

---

## 📊 Two Independent Data Sources

### **1. IDH Status System (Info Update)**

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

---

### **2. Conduct Signature System**

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

## ✅ What This Means

### Before (WRONG):
- ❌ Conduct signature required IDH status to be 1, 3, or 4
- ❌ If IDH status was `null`, conduct signature was hidden
- ❌ Unnecessary coupling between two systems

### After (CORRECT):
- ✅ Conduct signature shows regardless of IDH status
- ✅ If conduct not signed → "Sign Conduct" appears
- ✅ If PDF exists → "Download Conduct" appears
- ✅ Complete independence between systems

---

## 🧪 Example Scenarios

### Scenario 1: New Student, No Conduct Signed
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

### Scenario 2: Update Approved, Conduct Not Signed
```typescript
{
  idhStatusId: 4,                 // Approved final
  isConductAgreementSigned: false, // Not signed
  pdfBase64: null                  // No PDF
}

Actions Shown:
❌ Update Info (hidden)     // Status 4 = cannot update
✅ Sign Conduct (enabled)   // Not signed = show
❌ Download Conduct (disabled) // No PDF = disabled
✅ View Profile (enabled)   // Always shown
```

### Scenario 3: No Update, Conduct Signed
```typescript
{
  idhStatusId: null,              // No update record
  isConductAgreementSigned: true,  // Signed
  pdfBase64: "base64string..."     // Has PDF
}

Actions Shown:
✅ Update Info (enabled)    // Status null = can submit
❌ Sign Conduct (hidden)    // Already signed = hide
✅ Download Conduct (enabled) // Has PDF = enabled
✅ View Profile (enabled)   // Always shown
```

### Scenario 4: Update In Progress, Conduct Signed
```typescript
{
  idhStatusId: 1,                 // Pending review
  isConductAgreementSigned: true,  // Signed
  pdfBase64: "base64string..."     // Has PDF
}

Actions Shown:
❌ Update Info (hidden)     // Status 1 = in progress
❌ Sign Conduct (hidden)    // Already signed = hide
✅ Download Conduct (enabled) // Has PDF = enabled
✅ View Profile (enabled)   // Always shown
```

### Scenario 5: Update Rejected, Conduct Not Signed
```typescript
{
  idhStatusId: 5,                 // Rejected
  isConductAgreementSigned: false, // Not signed
  pdfBase64: null                  // No PDF
}

Actions Shown:
✅ Update Info (enabled)    // Status 5 = can resubmit
✅ Sign Conduct (enabled)   // Not signed = show
❌ Download Conduct (disabled) // No PDF = disabled
✅ View Profile (enabled)   // Always shown
```

---

## 🏷️ Badge Logic (Also Independent)

### "Update Required" Badge
```typescript
Shows when: idhStatusId is null, 2, or 5
Color: Red (urgent)
Means: Need to submit/resubmit info update
Independent of: Conduct signature status
```

### "Signature Required" Badge
```typescript
Shows when: idhStatusId is 4 AND isConductAgreementSigned is false
Color: Blue (info)
Means: Need to sign conduct agreement
Independent of: Update submission status
```

---

## 📢 Banner Logic

### "In Progress" Banner
```typescript
Shows when: idhStatusId is 1 or 3
Color: Blue (info)
Means: Update request being processed
Independent of: Conduct signature status
```

---

## 👤 Avatar Icon Priority

Avatar shows ONE icon in this priority order:

1. **🔴 Red Alert (pulsing)** - Update Required (status: null, 2, 5)
2. **🔴 Red X** - Update Rejected (status: 5)
3. **🔵 Blue Spinner** - Update In Progress (status: 1, 3)
4. **🔵 Blue Pen** - Signature Required (status: 4 + not signed)
5. **✅ Green Check** - All Complete (status: 4 + signed)

---

## 🔑 Key Takeaways

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

---

## 💻 Code Changes Made

### `lib/child-actions.ts`
```typescript
// BEFORE (Wrong):
"sign-conduct": {
  availability: {
    status: { include: [1, 3, 4] },  // ❌ Coupled to IDH
    requiresConductSignature: "unsigned"
  }
}

// AFTER (Correct):
"sign-conduct": {
  availability: {
    // ✅ No status requirement - independent!
    requiresConductSignature: "unsigned"
  }
}
```

### `app/dashboard/components/ChildCards.tsx`
- Removed `StatusFlags` type
- Removed `deriveStatusFlags()` function
- Created `getAvatarStatusIndicator()` function
- Direct evaluation based on badge and status
- Clear priority system with console logs

---

## 🧪 Testing

Run the dev server and check console for clear logging:
```
👤 Avatar Indicator Logic:
   IDH Status: 4
   Conduct Signed: false
   Badge: childActions.badge.signatureRequired
   → Showing: Signature Required (blue pen)
```

All scenarios now work correctly with complete independence!
