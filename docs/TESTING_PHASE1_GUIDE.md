# Phase 1: Your First Tests - Learning Guide

## What We Just Built ✅

### Files Created:
1. **`vitest.config.ts`** - Test runner configuration
2. **`lib/time.test.ts`** - 12 tests for the `timeAgo()` function
3. **`package.json`** - Added test scripts

### Tests Passing: 12/12 ✅

---

## Quick Start Commands

```bash
# Run tests in watch mode (auto-reruns on file changes)
npm test

# Open visual UI in browser
npm run test:ui

# Run once and exit (for CI/CD)
npm run test:run

# Run with coverage report (shows what % is tested)
npm run test:coverage
```

---

## Understanding the Test File

### Basic Structure

```typescript
import { describe, test, expect } from 'vitest';
import { timeAgo } from './time';

describe('timeAgo', () => {           // ← Group of related tests
  test('description of what we test', () => {  // ← Single test
    const result = timeAgo(null);     // ← Run the function
    expect(result).toBe('unknown');   // ← Check the result
  });
});
```

### Key Vitest Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `describe()` | Group tests together | `describe('timeAgo', () => {...})` |
| `test()` | Single test case | `test('handles null', () => {...})` |
| `expect()` | Start an assertion | `expect(result)` |
| `.toBe()` | Exact equality check | `.toBe('unknown')` |
| `beforeEach()` | Run before each test | Setup mocks |
| `afterEach()` | Run after each test | Cleanup |

---

## Why We Mock `Date.now()`

### The Problem:
```typescript
// Without mocking - tests are flaky!
const now = Date.now(); // Changes every millisecond!
```

### The Solution:
```typescript
beforeEach(() => {
  // Fix "now" to a specific time
  vi.spyOn(Date, 'now').mockReturnValue(
    new Date('2025-01-01T12:00:00Z').getTime()
  );
});
```

Now our tests are **deterministic** (same result every time).

---

## Test Coverage Explained

We tested:

### ✅ Happy Paths (Normal usage)
- Valid timestamps → correct format
- Different time ranges (seconds, minutes, hours, days)

### ✅ Edge Cases (Boundaries)
- Exactly 1 minute, 1 hour, 1 day
- 0 seconds (current time)
- Future dates

### ✅ Error Cases
- `null` input
- `undefined` input
- Invalid date strings

**This is 100% coverage!** Every line of `timeAgo()` is tested.

---

## Exercise: Break It and Watch Tests Fail

### Step 1: Introduce a Bug
Edit `lib/time.ts` and change line 2:
```typescript
// Before:
if (!iso) return "unknown";

// After (introduce bug):
if (!iso) return ""; // 🐛 Bug!
```

### Step 2: Run Tests
```bash
npm run test:run
```

### Step 3: Observe
You'll see:
```
FAIL lib/time.test.ts
  ✕ returns "unknown" for null input
    Expected: "unknown"
    Received: ""
```

**This is the value!** Tests catch bugs immediately.

### Step 4: Fix It
Change it back to `return "unknown"` → tests pass again! ✅

---

## What You Learned

1. **How to write a test** - `describe`, `test`, `expect`
2. **How to run tests** - `npm test`
3. **How to mock** - Fix `Date.now()` for predictable results
4. **Why tests matter** - Catch bugs before production

---

## Next Phase Preview

In **Phase 2**, we'll learn:
- Testing functions with **external dependencies** (Redis, Prisma)
- **Mocking modules** (how to fake Redis calls)
- Testing **async functions**
- Example: Test `lib/utils.ts` or `lib/parent-conduct.ts`

---

## Questions to Think About

1. Can you think of other edge cases for `timeAgo()`?
2. What happens if someone passes a very old date (100 years ago)?
3. How would you test a function that calls an API?

---

## Pro Tips

### Run specific test file:
```bash
npx vitest lib/time.test.ts
```

### Run tests matching a pattern:
```bash
npx vitest --grep "unknown"
```

### Debug a test:
Add `console.log()` in your test:
```typescript
test('debug example', () => {
  const result = timeAgo(null);
  console.log('Result:', result);  // Shows in terminal
  expect(result).toBe('unknown');
});
```

---

## Troubleshooting

### Tests won't run?
```bash
# Make sure Vitest is installed
npm install -D vitest

# Check if test file exists
ls lib/time.test.ts
```

### Tests stuck in watch mode?
Press `q` to quit, or `Ctrl+C`

### Want to see coverage?
```bash
npm install -D @vitest/coverage-v8
npm run test:coverage
```

---

## Resources

- [Vitest Docs](https://vitest.dev)
- [Testing Best Practices](https://kentcdodds.com/blog/common-testing-mistakes)

---

**Ready for Phase 2?** Let me know when you've played with these tests and want to move to testing functions with dependencies!
