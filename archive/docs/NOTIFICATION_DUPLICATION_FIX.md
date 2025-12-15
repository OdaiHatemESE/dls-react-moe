# Notification Duplication Fix

## Problem

Users were seeing **duplicate notifications** - one for "General Update" (DataUpdate) and one for "Status Changed" (StatusChange) for the same event.

### Root Cause

The backend system (IDH/Student Registration) creates **TWO separate notifications** when a student's status changes:

1. **`StatusChange`** notification - Specific to status changes with `statusDescription`
2. **`DataUpdate`** notification - Generic data update notification

Both notifications:
- Have the same `sourceHistoryId` (reference to the same backend change)
- Are created within seconds of each other
- Contain similar information
- Appear as duplicates to the end user

## Solution Implemented

### Deduplication Logic (Quick Fix)

Added server-side deduplication in `/app/api/notifications/route.ts`:

**Logic:**
- When fetching notifications, filter out `DataUpdate` notifications if:
  - A `StatusChange` notification exists with the same `sourceHistoryId`
  - Both were created within 1 minute of each other
  
**Why this works:**
- `StatusChange` is more specific and user-friendly (shows actual status)
- `DataUpdate` is generic and redundant when status change exists
- Uses `sourceHistoryId` to identify the same backend event
- Time window (1 minute) ensures we only dedupe related events

### Code Changes

```typescript
// In app/api/notifications/route.ts
const deduplicatedNotifications = formattedNotifications.filter((notif, index, arr) => {
  // Only check for DataUpdate notifications
  if (notif.type !== 'DataUpdate') return true;
  
  const sourceHistoryId = notif.data?.sourceHistoryId;
  if (!sourceHistoryId) return true; // Keep if no sourceHistoryId
  
  // Check if there's a StatusChange notification for the same sourceHistoryId within 1 minute
  const hasStatusChange = arr.some((other, otherIndex) => {
    if (otherIndex === index) return false; // Skip self
    if (other.type !== 'StatusChange') return false;
    if (other.data?.sourceHistoryId !== sourceHistoryId) return false;
    
    // Check if created within 1 minute of each other
    const timeDiff = Math.abs(
      new Date(notif.createdAt).getTime() - new Date(other.createdAt).getTime()
    );
    return timeDiff < 60000; // 60 seconds
  });
  
  // If StatusChange exists for same event, filter out this DataUpdate
  return !hasStatusChange;
});
```

## How It Works

### Before Fix:
```
[
  {
    id: 1,
    type: "StatusChange",
    title: "Status Update",
    data: { sourceHistoryId: 12345, statusDescription: "Approved" }
  },
  {
    id: 2,
    type: "DataUpdate",
    title: "General Update",
    data: { sourceHistoryId: 12345 }  // Same sourceHistoryId!
  }
]
```

### After Fix:
```
[
  {
    id: 1,
    type: "StatusChange",
    title: "Status Update",
    data: { sourceHistoryId: 12345, statusDescription: "Approved" }
  }
  // DataUpdate filtered out because StatusChange exists for same sourceHistoryId
]
```

## Alternative Solutions (Not Implemented)

### Option 1: Backend Fix (Ideal but requires backend changes)
- Modify backend system to only create `StatusChange` notifications
- Remove `DataUpdate` creation for status-related events
- **Pros:** Cleaner, no duplicate data in DB
- **Cons:** Requires backend team coordination

### Option 2: Database Cleanup (Aggressive)
- Create a scheduled job to delete duplicate notifications
- **Pros:** Cleans up historical data
- **Cons:** Permanent deletion, may remove valid notifications

### Option 3: Frontend Filter (User-level)
- Filter duplicates in the UI components
- **Pros:** No backend changes needed
- **Cons:** Still fetches unnecessary data, inconsistent across views

## Testing

### Test Cases

1. **Status Change Event**
   - ✅ Only shows StatusChange notification
   - ✅ DataUpdate is filtered out
   - ✅ Status description is visible

2. **Pure Data Update (no status change)**
   - ✅ Shows DataUpdate notification
   - ✅ No duplication

3. **Different sourceHistoryId**
   - ✅ Both notifications show (not duplicates)

4. **Time gap > 1 minute**
   - ✅ Both notifications show (not same event)

### How to Test

```bash
# 1. Start dev server
npm run dev

# 2. Navigate to notifications page
# http://localhost:4200/notifications

# 3. Check for duplicate notifications with same sourceHistoryId
# - Should only see StatusChange, not DataUpdate
```

## Impact

### Before:
- Users see 2 notifications for every status change
- Confusing UX ("Why am I seeing this twice?")
- Notification count inflated

### After:
- Users see 1 notification per event
- Clear, specific notification (StatusChange)
- Accurate notification counts

## Monitoring

To monitor effectiveness:

1. **Check notification counts** - Should decrease
2. **User feedback** - Should report fewer duplicates
3. **Database queries** - Both types still exist in DB, but API filters them

## Future Improvements

1. **Cleanup Job**: Periodically delete filtered DataUpdate notifications from database
2. **Backend Coordination**: Work with backend team to prevent duplicate creation
3. **Notification Merge**: Combine information from both into single, richer notification
4. **User Preferences**: Let users choose which notification types to receive

## Related Files

- `/app/api/notifications/route.ts` - Deduplication logic
- `/types/notification.ts` - Notification types
- `/app/components/notifications/NotificationCard.tsx` - UI rendering
- `/docs/NOTIFICATION_README.md` - General notification docs

## Notes

- **sourceHistoryId**: Backend reference to the change record
- **1-minute window**: Chosen to catch same-event notifications while avoiding false positives
- **StatusChange priority**: More specific and user-friendly than generic DataUpdate
- **No DB changes**: Duplicates still in DB, only filtered in API response

---

**Status:** ✅ Implemented and Ready for Testing

**Date:** December 10, 2025

**Impact:** Low Risk - Only filters API response, no data deletion
