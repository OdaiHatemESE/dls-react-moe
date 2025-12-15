# Child Actions System - Quick Reference

## 📊 Status Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         STUDENT UPDATE LIFECYCLE                     │
└─────────────────────────────────────────────────────────────────────┘

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

## 🎯 Action Availability Matrix

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

## 🔒 Disabled Conditions

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

## 🏷️ Badge Display Rules

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

## 📢 Banner Display Rules

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

## 🎨 Visual Examples

### Example 1: New Student (Status null, Period Active)
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

### Example 2: Pending Review (Status 1, Period Active)
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

### Example 3: Approved - Needs Signature (Status 4, Period Active)
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

### Example 4: Period Closed (Status null, Period Closed)
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

## 🔗 URL Template Examples

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

## 🧪 Quick Test Commands

```bash
# Test new student (no record)
curl "http://localhost:4200/api/parent/child-actions?studentPersonId=123&idhDebug=true"

# Test with specific status (requires header support in API)
curl -H "x-test-idh-status: 4" \
  "http://localhost:4200/api/parent/child-actions?studentPersonId=123"

# Run full test suite
node test-child-actions.js
```

## 📝 Notes

- **Period Closed**: When update period is closed, badges and banners are hidden regardless of status
- **Fallback**: If no actions can be shown, "View Profile" always appears as fallback
- **Hidden vs Disabled**: Hidden actions don't appear in UI, disabled actions appear grayed out
- **Template Variables**: `:studentPersonId`, `:updateMode`, etc. are replaced with actual values
- **Status Meanings**: Always check console logs for detailed evaluation of each action
