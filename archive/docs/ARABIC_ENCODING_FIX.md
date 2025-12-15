# Arabic Text Encoding Fix for Student Actions

## Problem Description

When editing student action configurations in the admin panel, Arabic text values were displaying as question marks ("????? ??????") instead of the actual Arabic characters. This affected:

- Label (Arabic) field
- Short Label (Arabic) field  
- Description (Arabic) field
- Any other Arabic text in the configJson

## Root Cause

The issue was caused by using SQL Server `VARCHAR` columns instead of `NVARCHAR` columns. 

- **VARCHAR**: Stores single-byte characters only (does not support Unicode)
- **NVARCHAR**: Stores Unicode characters including Arabic, Chinese, emoji, etc.

The affected columns in the `StudentActionConfig` table were:
- `actionName` (VARCHAR(255))
- `description` (VARCHAR(MAX))
- `configJson` (VARCHAR(MAX))

## Solution

### 1. Schema Update

Updated `prisma/parent-portal/schema.prisma` to use NVARCHAR:

```prisma
model StudentActionConfig {
  id            Int      @id @default(autoincrement())
  educationType String   @db.VarChar(100)
  actionName    String   @db.NVarChar(255)    // Changed from VarChar
  actionKey     String   @db.VarChar(100)
  isEnabled     Boolean  @default(true)
  displayOrder  Int      @default(0)
  description   String?  @db.NVarChar(Max)    // Changed from VarChar
  configJson    String?  @db.NVarChar(Max)    // Changed from VarChar
  createdBy     String?  @db.VarChar(64)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([educationType, actionKey])
}
```

### 2. Database Migration

Run the SQL migration to convert existing columns:

```bash
# Connect to your SQL Server database and run:
# File: prisma/parent-portal/migrations/fix-arabic-encoding.sql

ALTER TABLE [StudentActionConfig] 
ALTER COLUMN [actionName] NVARCHAR(255) NOT NULL;

ALTER TABLE [StudentActionConfig] 
ALTER COLUMN [description] NVARCHAR(MAX) NULL;

ALTER TABLE [StudentActionConfig] 
ALTER COLUMN [configJson] NVARCHAR(MAX) NULL;
```

### 3. API Response Headers

Added explicit UTF-8 charset headers to API responses in `/app/api/admin/config/actions/route.ts`:

```typescript
return NextResponse.json(actions, {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
});
```

This ensures the API explicitly declares UTF-8 encoding for all JSON responses.

## How to Apply the Fix

### Step 1: Run the Database Migration

```bash
# Option A: Using SQL Management Studio or Azure Data Studio
# Copy and paste the contents of:
# prisma/parent-portal/migrations/fix-arabic-encoding.sql

# Option B: Using sqlcmd
sqlcmd -S your-server.database.windows.net -d YourDatabase -U username -P password -i prisma/parent-portal/migrations/fix-arabic-encoding.sql
```

### Step 2: Regenerate Prisma Client

```bash
npm run prisma:generate
```

### Step 3: Re-enter Arabic Text

Since the existing data was stored incorrectly (as question marks), you'll need to:

1. Open the Admin panel → Student Actions Manager
2. Edit each action that has Arabic text
3. Re-enter the Arabic text in the Arabic fields
4. Save the configuration

The text should now save and display correctly!

## Verification

After applying the fix:

1. **Check database column types**:
   ```sql
   SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_NAME = 'StudentActionConfig'
   AND COLUMN_NAME IN ('actionName', 'description', 'configJson');
   ```
   
   Should show `nvarchar` for all three columns.

2. **Test Arabic input**:
   - Edit a student action
   - Enter Arabic text: "تحديث المعلومات"
   - Save and reload the page
   - Arabic text should display correctly

3. **Check API response**:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:4200/api/admin/config/actions \
     | jq '.[] | select(.actionKey == "update-info") | .configJson'
   ```
   
   The JSON should contain proper Arabic characters, not question marks.

## Prevention

For future tables that need to store multilingual content:

1. **Always use NVARCHAR** for:
   - Names (user names, action names, etc.)
   - Descriptions and long text
   - JSON fields that may contain localized text
   - Any user-facing text that supports multiple languages

2. **Use VARCHAR only** for:
   - Keys, identifiers, codes (e.g., `actionKey`, `educationType`)
   - Email addresses, URLs
   - System-level strings that won't contain Unicode

3. **Reference schema pattern**:
   ```prisma
   model Example {
     id          Int     @id @default(autoincrement())
     systemKey   String  @db.VarChar(100)    // OK: system identifier
     displayName String  @db.NVarChar(255)   // REQUIRED: user-facing text
     description String? @db.NVarChar(Max)   // REQUIRED: may contain Arabic
   }
   ```

## Related Files

- Schema: `prisma/parent-portal/schema.prisma`
- Migration: `prisma/parent-portal/migrations/fix-arabic-encoding.sql`
- API Route: `app/api/admin/config/actions/route.ts`
- Admin Component: `app/admin/eid/components/StudentActionsManager.tsx`

## References

- [SQL Server Data Types - VARCHAR vs NVARCHAR](https://learn.microsoft.com/en-us/sql/t-sql/data-types/char-and-varchar-transact-sql)
- [Prisma SQL Server Field Types](https://www.prisma.io/docs/orm/reference/prisma-schema-reference#sqlserver-1)
- [Unicode Support in SQL Server](https://learn.microsoft.com/en-us/sql/relational-databases/collations/collation-and-unicode-support)
