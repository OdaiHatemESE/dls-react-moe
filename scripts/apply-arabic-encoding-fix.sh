#!/bin/bash

# Script to apply the Arabic encoding fix migration
# This updates StudentActionConfig table columns from VARCHAR to NVARCHAR

echo "======================================"
echo "Arabic Encoding Fix Migration"
echo "======================================"
echo ""
echo "This script will:"
echo "1. Run the SQL migration to convert VARCHAR to NVARCHAR"
echo "2. Regenerate the Prisma client"
echo ""
echo "WARNING: You'll need to re-enter Arabic text after migration"
echo "as existing question marks cannot be recovered."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Migration cancelled."
    exit 1
fi

echo ""
echo "Step 1: Checking database connection..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    echo "Please set it in your .env or .env.local file"
    exit 1
fi

echo "✓ DATABASE_URL is set"
echo ""

echo "Step 2: Running SQL migration..."
echo ""
echo "Please run the following SQL manually in your database:"
echo "File location: prisma/parent-portal/migrations/fix-arabic-encoding.sql"
echo ""
cat prisma/parent-portal/migrations/fix-arabic-encoding.sql
echo ""
echo "You can use:"
echo "- SQL Server Management Studio"
echo "- Azure Data Studio"
echo "- sqlcmd command line tool"
echo ""
read -p "Have you run the migration? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Please run the migration first, then re-run this script."
    exit 1
fi

echo ""
echo "Step 3: Regenerating Prisma client..."
echo ""

npm run prisma:generate

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Prisma client regenerated successfully"
else
    echo ""
    echo "✗ Failed to regenerate Prisma client"
    exit 1
fi

echo ""
echo "======================================"
echo "Migration completed successfully!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Restart your development server (npm run dev)"
echo "2. Go to Admin panel → Student Actions Manager"
echo "3. Re-enter Arabic text for each action"
echo "4. Test that Arabic text displays correctly"
echo ""
echo "See docs/ARABIC_ENCODING_FIX.md for more details."
echo ""
