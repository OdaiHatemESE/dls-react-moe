# Quick Fix: Update Info Action Not Showing

## TL;DR

The "Update Information" action is configured correctly in the database but **hidden by status filters**.

## 🔧 Quick Fix (2 minutes)

1. Go to `/admin/eid` → **Student Actions** tab
2. Edit "Update Information" action (pencil icon)
3. Find **Availability rules** section
4. **Clear these two fields:**
   - ✏️ Status Include: *(empty)*
   - ✏️ Status Exclude: *(empty)*
5. Click **"Update"**
6. Refresh the parent dashboard
7. ✅ Action should now appear!

## Why This Happens

The action has status filters that prevent it from showing:

```
If Status Include = "2, 5"
And student's current status = 1
Then action is HIDDEN ❌
```

**Solution:** Remove the status filters to show for all students.

## Alternative: Allow More Statuses

Instead of removing filters, add more status IDs:

```
Status Include: null, 0, 1, 2, 3, 4, 5
```

This shows the action for students with any status.

## Verify It Works

1. Go to `/parent/summary` or `/dashboard`
2. Click "Student Actions" on a student card
3. You should see "Update Information" / "تحديث المعلومات"

## Still Not Working?

Check:
- ✅ Action is **Enabled** (switch ON)
- ✅ Display Order is set (e.g., 10)
- ✅ Education Type matches student (e.g., "Public")
- ✅ Action Type is `href`
- ✅ href Template exists: `/child/:studentPersonId/update-info?mode=:updateMode`

See `docs/FIX_ACTION_NOT_SHOWING.md` for detailed troubleshooting.
