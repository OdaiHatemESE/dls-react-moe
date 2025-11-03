# IDH Status ID Reference

## Status Values & Their Meanings

### null - No Record
**Meaning:** Student has never submitted an update request  
**Parent Action:** Must submit new update information  
**Avatar Icon:** 🔴 Red exclamation (pulsing)  
**System Response:**
- ✅ Show "Update Info" button (if period active)
- 🔴 Show "Update Required" badge (if period active)
- ❌ No banner

**Example Scenario:**
> Parent logs in for the first time, or it's a new academic year and updates haven't been submitted yet.

---

### 1 - Pending Review
**Meaning:** Update request submitted and awaiting approval by admin  
**Parent Action:** Wait for approval  
**Avatar Icon:** 🔵 Blue spinner (rotating)  
**System Response:**
- ✅ Show "Sign Conduct" button (if not signed)
- ✅ Show "Download Conduct" button (if PDF available)
- 🔵 Show "Update request in progress..." banner (if period active)
- ❌ No badge

**Example Scenario:**
> Parent submitted updated contact info yesterday. The school admin hasn't reviewed it yet.

---

### 2 - Approved/Completed
**Meaning:** Update request was approved and completed successfully  
**Parent Action:** Can submit new update in current or next period  
**Avatar Icon:** 🔴 Red exclamation (pulsing)  
**System Response:**
- ✅ Show "Update Info" button (if period active)
- 🔴 Show "Update Required" badge (if period active)
- ❌ No banner

**Example Scenario:**
> Last year's update was approved. It's a new school year and parents can update information again.

---

### 3 - Under Review
**Meaning:** Update request is currently being processed/reviewed  
**Parent Action:** Wait for completion  
**Avatar Icon:** 🔵 Blue spinner (rotating)  
**System Response:**
- ✅ Show "Sign Conduct" button (if not signed)
- ✅ Show "Download Conduct" button (if PDF available)
- 🔵 Show "Update request in progress..." banner (if period active)
- ❌ No badge

**Example Scenario:**
> Admin is actively reviewing the submitted information, possibly contacting other departments for verification.

---

### 4 - Approved - Signature Needed
**Meaning:** Update request approved but parent must sign conduct agreement  
**Parent Action:** Sign the conduct agreement  
**Avatar Icon:** 🔵 Blue pen/signature icon (if not signed) OR ✅ Green checkmark (if signed)  
**System Response:**
- ✅ Show "Sign Conduct" button (if not signed)
- ✅ Show "Download Conduct" button (if PDF available)
- 🔵 Show "Signature Required" badge (if not signed and period active)
- ❌ No banner

**Example Scenario:**
> School approved the updated address and phone number. Now parent must review and sign the student conduct charter.

---

### 5 - Rejected
**Meaning:** Update request was rejected and needs correction  
**Parent Action:** Fix issues and resubmit  
**Avatar Icon:** 🔴 Red X icon  
**System Response:**
- ✅ Show "Update Info" button (if period active)
- 🔴 Show "Update Required" badge (if period active)
- ❌ No banner

**Example Scenario:**
> Parent submitted an invalid address or incomplete information. Admin rejected it with a note to fix and resubmit.

---

## Visual Summary

```
┌─────────┬──────────────────────┬─────────────────┬───────────────────┬──────────────────┐
│ Status  │ Description          │ Parent Action   │ Visual Indicators │ Avatar Icon      │
├─────────┼──────────────────────┼─────────────────┼───────────────────┼──────────────────┤
│  null   │ No record            │ ✏️  Submit      │ 🔴 Update Badge   │ 🔴 Red Alert     │
│    1    │ Pending review       │ ⏳ Wait         │ 🔵 Progress Bar   │ 🔵 Blue Spinner  │
│    2    │ Approved/Completed   │ ✏️  Re-submit   │ 🔴 Update Badge   │ 🔴 Red Alert     │
│    3    │ Under review         │ ⏳ Wait         │ 🔵 Progress Bar   │ 🔵 Blue Spinner  │
│    4    │ Need signature       │ ✍️  Sign        │ 🔵 Signature Badge│ 🔵 Blue Pen      │
│    5    │ Rejected             │ 🔧 Fix & Submit │ 🔴 Update Badge   │ 🔴 Red X         │
└─────────┴──────────────────────┴─────────────────┴───────────────────┴──────────────────┘
```

## State Transitions

```
Can Submit/Resubmit (null, 2, 5):
  ├─ Action: "Update Info" button enabled
  ├─ Badge: "Update Required" (red)
  └─ Href: /child/:id/update-info?mode=[init|resubmit]

In Progress (1, 3):
  ├─ Action: "Sign Conduct" button (if unsigned)
  ├─ Banner: "Update request in progress..." (blue)
  └─ Badge: None

Needs Signature (4):
  ├─ Action: "Sign Conduct" button (if unsigned)
  ├─ Action: "Download Conduct" button (if PDF available)
  └─ Badge: "Signature Required" (blue, if unsigned)
```

## Update Mode Parameter

The `?mode=` parameter in the update info URL indicates:

- **`mode=init`**: First-time submission (status is `null`)
- **`mode=resubmit`**: Resubmission (status is `2` or `5`)

**Example URLs:**
```
First time:  /child/123456/update-info?mode=init
Resubmit:    /child/123456/update-info?mode=resubmit
```

## Common Patterns

### New Academic Year Flow
```
1. Start: Status = null
2. Parent submits → Status = 1 (Pending)
3. Admin reviews → Status = 3 (Under Review)
4. Admin approves → Status = 4 (Needs Signature)
5. Parent signs → Process Complete
```

### Rejection Flow
```
1. Start: Status = null
2. Parent submits → Status = 1 (Pending)
3. Admin rejects → Status = 5 (Rejected)
4. Parent fixes and resubmits → Status = 1 (Pending)
5. Admin approves → Status = 4 (Needs Signature)
6. Parent signs → Process Complete
```

### Multi-Year Pattern
```
Year 1:
  - null → 1 → 3 → 4 → Complete (Status 2)

Year 2 (New Period):
  - Status 2 from last year
  - System allows new submission
  - null → 1 → 3 → 4 → Complete
```

## Testing Tips

**To test all statuses, use:**
```bash
# No record
status=null

# Pending
status=1

# Completed
status=2

# Under review
status=3

# Needs signature
status=4

# Rejected
status=5
```

**Check console logs for detailed evaluation:**
- Each status is evaluated against action availability rules
- Logs show why actions are shown/hidden/disabled
- Template variable resolution is logged

## Business Logic Notes

1. **Status null, 2, 5**: Triggers "update required" flow
   - Parent can (re)submit information
   - Red urgent badge appears

2. **Status 1, 3**: Indicates "in progress" flow
   - Parent cannot change submission (already processing)
   - Blue info banner appears
   - May need to sign conduct while waiting

3. **Status 4**: Final approval state
   - Information approved, just needs signature
   - Blue info badge if not signed
   - After signing, process is complete

4. **Update Period Closed**: Overrides all indicators
   - Badges hidden
   - Banners hidden
   - Update button disabled with reason

## Related Documentation

- **Full Testing Guide**: `/docs/CHILD_ACTIONS_TESTING_GUIDE.md`
- **Quick Reference**: `/docs/CHILD_ACTIONS_QUICK_REFERENCE.md`
- **Code**: `/lib/child-actions.ts`
- **Types**: `/types/child-actions.ts`
