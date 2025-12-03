# 🔧 URGENT FIX: Arabic Text Still Shows as Question Marks

## The Problem

You see "????? ???" and "??????? ?????" instead of Arabic text because:
1. ✅ You ran the NVARCHAR migration (good!)
2. ❌ The **old corrupted data** (question marks) is still in the database
3. 💡 The migration changes the column type but can't fix already-corrupted text

## Quick Fix (5 minutes)

### Option 1: Fix Via Admin Panel (Recommended - Easiest)

1. **Go to Admin Panel:**
   ```
   http://localhost:4200/admin/eid
   ```

2. **Click "Student Actions" tab**

3. **For each action showing question marks:**
   - Click the **Edit** (pencil) icon
   - **Re-enter the Arabic text** in all Arabic fields:
   
   **For "Update Information":**
   - Action Name: `تحديث المعلومات`
   - Label (Arabic): `تحديث المعلومات`
   - Short Label (Arabic): `تحديث`
   - Description (Arabic): `يمكن للآباء تحديث معلومات الطالب`
   
   **For "Sign Conduct":**
   - Action Name: `توقيع الميثاق`
   - Label (Arabic): `توقيع الميثاق`
   - Short Label (Arabic): `توقيع`
   - Description (Arabic): `راجع ووقع على ميثاق السلوك المدرسي`
   
   **For "Download Conduct":**
   - Action Name: `تحميل الميثاق`
   - Label (Arabic): `تحميل الميثاق`
   - Short Label (Arabic): `تحميل`
   - Description (Arabic): `حمّل نسخة من اتفاقية السلوك الموقعة`

4. **Click "Update"** to save

5. **Refresh the parent dashboard** - Arabic text should now display correctly! ✅

### Option 2: Fix Via SQL (Faster for Multiple Actions)

If you have access to SQL Server Management Studio or Azure Data Studio:

1. Run the script: `prisma/parent-portal/migrations/fix-corrupted-arabic.sql`

2. This will automatically update all action names and Arabic labels

3. **Review the results** before committing

4. Uncomment `COMMIT;` if everything looks good

### Option 3: Delete and Recreate (If Nothing Else Works)

1. Go to Admin Panel → Student Actions
2. **Delete** all actions with question marks
3. **Create new actions** with proper Arabic text:

```
Action: Update Information
├── Education Type: Public
├── Action Key: update-info
├── Action Name: تحديث المعلومات
├── Display Order: 10
├── Enabled: ✅
└── Config:
    ├── Label (English): Update Student
    ├── Label (Arabic): تحديث المعلومات
    ├── Short Label (Arabic): تحديث
    ├── Description (Arabic): يمكن للآباء تحديث معلومات الطالب
    ├── Icon: edit-3
    ├── Color: primary
    ├── Action Type: href
    └── href Template: /child/:studentPersonId/update-info?mode=:updateMode
```

## Why This Happened

1. SQL Server **VARCHAR** can't store Arabic characters
2. When you saved Arabic text, it was converted to "??????"
3. The migration changed VARCHAR → NVARCHAR
4. But the **already corrupted question marks** can't be auto-recovered
5. You need to **manually re-enter** the Arabic text

## Verification

After fixing, check:

1. **Admin Panel** - Action names should show Arabic text (not `?????`)
2. **Parent Dashboard** - Click "Student Actions" button
3. **Action Labels** - Should display: "تحديث المعلومات" not "????? ???"

## Prevention

From now on, all new Arabic text will save correctly because:
- ✅ Columns are now NVARCHAR (Unicode support)
- ✅ API responses have UTF-8 headers
- ✅ New data saves properly

## Still Not Working?

1. **Clear browser cache** - Old cached API responses might show old data
2. **Restart dev server** - Ensure code changes are loaded
3. **Check educationType** - Make sure student's education type matches the action config
4. **Enable update period** - If action requires it (`/admin/eid` → Update Periods tab)

## Quick Reference - Arabic Text

Copy these for easy paste:

```
Update Information:
تحديث المعلومات

Short: تحديث
Description: يمكن للآباء تحديث معلومات الطالب

---

Sign Conduct:
توقيع الميثاق

Short: توقيع
Description: راجع ووقع على ميثاق السلوك المدرسي

---

Download Conduct:
تحميل الميثاق

Short: تحميل
Description: حمّل نسخة من اتفاقية السلوك الموقعة

---

View Profile:
عرض الملف

Short: عرض
Description: استعرض معلومات ملف الطالب كاملة
```

---

**The fix is simple: Just re-enter the Arabic text once via the Admin Panel!** 🎯
