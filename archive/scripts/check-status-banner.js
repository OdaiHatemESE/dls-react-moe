#!/usr/bin/env node
/**
 * Script to diagnose why status banner is not showing
 * Checks:
 * 1. UpdatePeriodConfig table
 * 2. StudentActionConfig table
 * 3. Update period active status
 */

const { PrismaClient } = require("@prisma/client-parent-portal");

const prisma = new PrismaClient();

async function checkStatusBannerIssue() {
  try {
    console.log("🔍 Checking Status Banner Configuration...\n");
    console.log("=" .repeat(70));

    // 1. Check UpdatePeriodConfig
    console.log("\n📅 UPDATE PERIOD CONFIGURATION:");
    console.log("-".repeat(70));
    
    const allPeriods = await prisma.updatePeriodConfig.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (allPeriods.length === 0) {
      console.log("❌ NO UPDATE PERIODS CONFIGURED!");
      console.log("\n⚠️  This is why the status banner is not showing.");
      console.log("The code requires an active update period to display the banner.");
    } else {
      console.log(`Found ${allPeriods.length} update period(s):\n`);
      
      const now = new Date();
      let hasActive = false;

      allPeriods.forEach((period, index) => {
        const isInDateRange = period.startDate <= now && period.endDate >= now;
        const isActive = period.isEnabled && isInDateRange;
        
        if (isActive) hasActive = true;

        console.log(`${index + 1}. ${period.name}`);
        console.log(`   ID: ${period.id}`);
        console.log(`   Enabled: ${period.isEnabled ? "✅ YES" : "❌ NO"}`);
        console.log(`   Start: ${period.startDate.toISOString()}`);
        console.log(`   End: ${period.endDate.toISOString()}`);
        console.log(`   In Date Range: ${isInDateRange ? "✅ YES" : "❌ NO"}`);
        console.log(`   STATUS: ${isActive ? "🟢 ACTIVE" : "⚪ INACTIVE"}`);
        if (period.description) {
          console.log(`   Description: ${period.description}`);
        }
        console.log("");
      });

      if (!hasActive) {
        console.log("⚠️  NO ACTIVE UPDATE PERIOD FOUND!");
        console.log("This is why the status banner is not showing.\n");
        console.log("To fix:");
        console.log("1. Go to Admin panel → Configuration → Update Periods");
        console.log("2. Create a new period or enable an existing one");
        console.log("3. Make sure the date range includes today's date");
      } else {
        console.log("✅ Active update period found!");
      }
    }

    // 2. Check StudentActionConfig
    console.log("\n" + "=".repeat(70));
    console.log("⚙️  STUDENT ACTION CONFIGURATION:");
    console.log("-".repeat(70));
    
    const allActions = await prisma.studentActionConfig.findMany({
      orderBy: [{ educationType: "asc" }, { displayOrder: "asc" }],
    });

    if (allActions.length === 0) {
      console.log("❌ NO ACTIONS CONFIGURED!");
    } else {
      console.log(`Found ${allActions.length} action(s):\n`);
      
      const actionsByType = {};
      allActions.forEach((action) => {
        if (!actionsByType[action.educationType]) {
          actionsByType[action.educationType] = [];
        }
        actionsByType[action.educationType].push(action);
      });

      Object.entries(actionsByType).forEach(([eduType, actions]) => {
        console.log(`📚 ${eduType}:`);
        actions.forEach((action) => {
          console.log(`   ${action.displayOrder}. ${action.actionName} (${action.actionKey})`);
          console.log(`      Enabled: ${action.isEnabled ? "✅" : "❌"}`);
          
          // Check for status filters
          if (action.configJson) {
            try {
              const config = JSON.parse(action.configJson);
              if (config.availability?.status) {
                const { include, exclude } = config.availability.status;
                if (include) {
                  console.log(`      Status Include: [${include.join(", ")}]`);
                }
                if (exclude) {
                  console.log(`      Status Exclude: [${exclude.join(", ")}]`);
                }
              }
              if (config.availability?.requiresUpdatePeriod) {
                console.log(`      ⚠️  Requires Update Period: YES`);
              }
            } catch (e) {
              // Invalid JSON
            }
          }
        });
        console.log("");
      });
    }

    // 3. Summary
    console.log("=" .repeat(70));
    console.log("📋 SUMMARY:");
    console.log("-".repeat(70));
    
    const activePeriodCount = allPeriods.filter(p => {
      const now = new Date();
      return p.isEnabled && p.startDate <= now && p.endDate >= now;
    }).length;

    console.log(`Update Periods: ${allPeriods.length} total, ${activePeriodCount} active`);
    console.log(`Student Actions: ${allActions.length} total`);
    
    if (activePeriodCount === 0) {
      console.log("\n❌ ROOT CAUSE: No active update period");
      console.log("\n💡 SOLUTION:");
      console.log("   1. Navigate to: http://localhost:4200/admin/config/periods");
      console.log("   2. Create a new update period with:");
      console.log("      - Start Date: Today or earlier");
      console.log("      - End Date: Some future date");
      console.log("      - Enabled: ✅ YES");
      console.log("   3. The status banner will appear automatically");
    } else {
      console.log("\n✅ Active update period exists");
      console.log("The status banner should be visible (if student has IDH status)");
    }

    console.log("\n" + "=".repeat(70));

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatusBannerIssue();
