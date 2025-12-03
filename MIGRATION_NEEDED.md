# ⚠️ ACTION REQUIRED: Database Migration for Arabic Text Support

## What happened?

I've fixed the code to support Arabic text properly in the Student Actions configuration. However, there's a database schema change that needs to be applied.

## What needs to be done?

### Step 1: Run the SQL migration

You need to connect to your SQL Server database and run this SQL:

```sql
ALTER TABLE [StudentActionConfig] 
ALTER COLUMN [actionName] NVARCHAR(255) NOT NULL;

ALTER TABLE [StudentActionConfig] 
ALTER COLUMN [description] NVARCHAR(MAX) NULL;

ALTER TABLE [StudentActionConfig] 
ALTER COLUMN [configJson] NVARCHAR(MAX) NULL;
```

**How to run it:**
- Option 1: Copy the SQL from `prisma/parent-portal/migrations/fix-arabic-encoding.sql` and run it in SQL Server Management Studio or Azure Data Studio
- Option 2: Use the command line (sqlcmd) if you have credentials

### Step 2: Restart your dev server

```bash
rm -rf .next && npm run dev
```

### Step 3: Re-enter Arabic text

Unfortunately, the existing Arabic text was already corrupted in the database and cannot be recovered. You'll need to:

1. Open the Admin panel at `/admin/eid`
2. Go to the "Student Actions" tab
3. Click "Edit" on the "Update Information" action
4. Re-enter the Arabic text:
   - **Label (Arabic)**: تحديث المعلومات
   - **Short Label (Arabic)**: تحديث
   - **Description (Arabic)**: يمكن للآباء تحديث معلومات الطالب
5. Click "Update"

Now the Arabic text will save and display correctly! ✅

## What changed in the code?

1. ✅ **Prisma Schema**: Changed `VARCHAR` to `NVARCHAR` for Unicode support
2. ✅ **API Routes**: Added UTF-8 charset headers
3. ✅ **Prisma Client**: Regenerated (already done)

## Need help?

See the detailed documentation in:
- `docs/ARABIC_FIX_QUICKSTART.md` - Quick guide
- `docs/ARABIC_ENCODING_FIX.md` - Full documentation

## Why did this happen?

SQL Server's `VARCHAR` data type only supports single-byte characters (ASCII). Arabic text requires Unicode support, which needs `NVARCHAR`. This is a common issue when working with multilingual databases.
