#!/usr/bin/env node

/**
 * Child Actions Testing Script
 * 
 * This script helps you test all child action scenarios by calling the API
 * with different status values and configurations.
 * 
 * Usage:
 *   node test-child-actions.js
 * 
 * Make sure the dev server is running on port 4200!
 */

const TEST_SCENARIOS = [
  {
    name: "New Student (Never Submitted)",
    params: {
      studentPersonId: "test-student-1",
      includeIdh: "false", // We'll manually set status
    },
    mockIdh: null,
    updatePeriodActive: true,
    expected: {
      actions: ["update-info", "view-profile"],
      badge: "Update Required",
      banner: null,
    }
  },
  {
    name: "Update In Progress (Pending Review)",
    params: {
      studentPersonId: "test-student-2",
      includeIdh: "false",
    },
    mockIdh: 1,
    updatePeriodActive: true,
    expected: {
      actions: ["sign-conduct", "download-conduct", "view-profile"],
      badge: null,
      banner: "Update request in progress...",
    }
  },
  {
    name: "Approved - Needs Signature",
    params: {
      studentPersonId: "test-student-3",
      includeIdh: "false",
    },
    mockIdh: 4,
    updatePeriodActive: true,
    expected: {
      actions: ["sign-conduct", "download-conduct", "view-profile"],
      badge: "Signature Required",
      banner: null,
    }
  },
  {
    name: "Under Review",
    params: {
      studentPersonId: "test-student-4",
      includeIdh: "false",
    },
    mockIdh: 3,
    updatePeriodActive: true,
    expected: {
      actions: ["sign-conduct", "download-conduct", "view-profile"],
      badge: null,
      banner: "Update request in progress...",
    }
  },
  {
    name: "Rejected - Needs Resubmission",
    params: {
      studentPersonId: "test-student-5",
      includeIdh: "false",
    },
    mockIdh: 5,
    updatePeriodActive: true,
    expected: {
      actions: ["update-info", "view-profile"],
      badge: "Update Required",
      banner: null,
    }
  },
  {
    name: "Previously Approved (Can Update Again)",
    params: {
      studentPersonId: "test-student-6",
      includeIdh: "false",
    },
    mockIdh: 2,
    updatePeriodActive: true,
    expected: {
      actions: ["update-info", "view-profile"],
      badge: "Update Required",
      banner: null,
    }
  },
  {
    name: "Update Period Closed",
    params: {
      studentPersonId: "test-student-7",
      includeIdh: "false",
    },
    mockIdh: null,
    updatePeriodActive: false,
    expected: {
      actions: ["update-info (disabled)", "view-profile"],
      badge: null,
      banner: null,
    }
  },
];

const STATUS_MEANINGS = {
  null: "No record (never submitted)",
  1: "Pending review",
  2: "Approved/Completed",
  3: "Under review",
  4: "Approved - Signature needed",
  5: "Rejected",
};

async function testScenario(scenario, baseUrl = "http://localhost:4200") {
  console.log("\n" + "=".repeat(80));
  console.log(`🧪 TEST: ${scenario.name}`);
  console.log("=".repeat(80));
  console.log(`Status ID: ${scenario.mockIdh === null ? "null" : scenario.mockIdh}`);
  console.log(`Meaning: ${STATUS_MEANINGS[scenario.mockIdh]}`);
  console.log(`Update Period: ${scenario.updatePeriodActive ? "✅ Active" : "❌ Closed"}`);
  console.log("\nExpected:");
  console.log(`  Actions: [${scenario.expected.actions.join(", ")}]`);
  console.log(`  Badge: ${scenario.expected.badge || "None"}`);
  console.log(`  Banner: ${scenario.expected.banner || "None"}`);

  // Build query string
  const params = new URLSearchParams(scenario.params);
  const url = `${baseUrl}/api/parent/child-actions?${params.toString()}`;

  console.log("\n📡 Making API request...");
  console.log(`URL: ${url}\n`);

  try {
    const response = await fetch(url, {
      headers: {
        "x-test-idh-status": String(scenario.mockIdh ?? "null"),
        "x-test-update-period": String(scenario.updatePeriodActive),
      },
    });

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(`Response: ${text}`);
      return false;
    }

    const data = await response.json();

    console.log("\n✅ API Response received");
    console.log("\nActual Results:");
    console.log(`  Status ID: ${data.idhStatusId}`);
    console.log(`  Update Period Active: ${data.updatePeriodActive ? "✅" : "❌"}`);
    console.log(`  Actions (${data.actions.length}):`);
    
    data.actions.forEach((action, i) => {
      const status = action.hidden ? "🚫 HIDDEN" : action.disabled ? "🔒 DISABLED" : "✅ ENABLED";
      console.log(`    [${i + 1}] ${action.key}: ${status}`);
      if (action.disabled && action.disabledReason) {
        console.log(`        Reason: ${action.disabledReason.en}`);
      }
      if (action.href) {
        console.log(`        Href: ${action.href}`);
      }
    });

    console.log(`\n  Badge: ${data.badge ? `${data.badge.label} (${data.badge.tone})` : "None"}`);
    console.log(`  Banner: ${data.statusBanner ? `${data.statusBanner.message} (${data.statusBanner.severity})` : "None"}`);
    console.log(`  PDF Available: ${data.downloads.conductPdfAvailable ? "✅" : "❌"}`);

    // Verification
    console.log("\n🔍 Verification:");
    const visibleActions = data.actions.filter(a => !a.hidden).map(a => a.key);
    const enabledActions = data.actions.filter(a => !a.hidden && !a.disabled).map(a => a.key);
    
    console.log(`  Visible actions: [${visibleActions.join(", ")}]`);
    console.log(`  Enabled actions: [${enabledActions.join(", ")}]`);

    return true;

  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

async function runAllTests() {
  console.log("\n");
  console.log("╔" + "═".repeat(78) + "╗");
  console.log("║" + " ".repeat(20) + "CHILD ACTIONS TEST SUITE" + " ".repeat(34) + "║");
  console.log("╚" + "═".repeat(78) + "╝");
  console.log("\nMake sure the dev server is running on http://localhost:4200\n");

  const baseUrl = process.env.BASE_URL || "http://localhost:4200";
  let passed = 0;
  let failed = 0;

  for (const scenario of TEST_SCENARIOS) {
    const success = await testScenario(scenario, baseUrl);
    if (success) {
      passed++;
    } else {
      failed++;
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\n" + "=".repeat(80));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total scenarios: ${TEST_SCENARIOS.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log("\nNote: This script shows the API response. Check server console for detailed logs!");
  console.log("=".repeat(80) + "\n");
}

// Run if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testScenario, runAllTests };
