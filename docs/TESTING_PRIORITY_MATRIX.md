# Testing Priority Matrix

## Overview
This document prioritizes testing efforts based on:
- **Risk Impact**: What happens if this breaks in production?
- **Complexity**: How complex is the logic?
- **Change Frequency**: How often does this code change?
- **Business Criticality**: How essential is this to core functionality?

---

## Priority Levels

| Priority | Symbol | Criteria | Test Coverage Goal |
|----------|--------|----------|-------------------|
| **Critical** | 🔴 | Security, data integrity, user-facing errors | 90%+ |
| **High** | 🟡 | Business logic, data transformations | 80%+ |
| **Medium** | 🟢 | Utilities, helpers, formatting | 70%+ |
| **Low** | ⚪ | UI polish, non-essential features | 50%+ |

---

## 🔴 CRITICAL PRIORITY (Must Test - Weeks 1-2)

### 1. Student Authorization (`lib/student-authorization.ts`)
**Risk if broken**: Parents see other people's children data (GDPR violation, security breach)

| Function | What It Does | Risk | Test Scenarios |
|----------|--------------|------|----------------|
| `authorizeStudentAccess()` | Validates parent owns student + active enrollment | **CRITICAL** - Unauthorized access to student records | ✅ Valid parent-child relationship<br>❌ Wrong parent accessing student<br>❌ Missing Emirates ID<br>❌ Student not in active academic year<br>❌ Private education only<br>❌ Inactive student<br>❌ API failures |
| `authorizeStudentOwnership()` | Validates ownership only (no enrollment check) | **HIGH** - Read access control | ✅ Valid ownership<br>❌ Invalid student ID<br>❌ Parent not found<br>❌ Network errors |

**Why This Matters**:
- Prevents data leaks between families
- Compliance with UAE data protection laws
- Most serious security risk in the app

**Test Coverage**: 95%+

**Estimated Testing Time**: 4-6 hours

---

### 2. Child Actions Schema Validation (`lib/child-actions-schema.ts`)
**Risk if broken**: App crashes for all users when API response changes

| Function | What It Does | Risk | Test Scenarios |
|----------|--------------|------|----------------|
| `validateChildActionResponse()` | Validates API response structure | **HIGH** - Runtime crashes | ✅ Valid complete response<br>❌ Missing required fields<br>❌ Invalid enum values<br>❌ Wrong data types<br>✅ Optional fields present/absent |
| `safeValidateChildActionResponse()` | Non-throwing validation | **MEDIUM** - Graceful error handling | ✅ Returns success for valid data<br>✅ Returns errors for invalid data<br>✅ Provides detailed error messages |

**Why This Matters**:
- Backend API changes can break the frontend silently
- Prevents white screen of death for users
- Early warning system for API contract changes

**Test Coverage**: 85%+

**Estimated Testing Time**: 3-4 hours

---

### 3. Authentication (`lib/auth.ts`, `lib/auth-server.ts`)
**Risk if broken**: Users can't login, or worse - session hijacking

| Component | What It Does | Risk | Test Scenarios |
|-----------|--------------|------|----------------|
| JWT callbacks | Store access token in Redis | **CRITICAL** - Cookie overflow, token leaks | ✅ Token stored in Redis<br>✅ Small key in JWT (not full token)<br>❌ Redis connection fails<br>✅ Token expiry handled |
| Session callbacks | Build session object | **HIGH** - Missing user data | ✅ Contains required fields<br>✅ EmiratesID extracted correctly<br>❌ Missing access token |

**Why This Matters**:
- Auth is the gateway to everything
- Large tokens in cookies break the app
- Session bugs affect all logged-in users

**Test Coverage**: 90%+

**Estimated Testing Time**: 6-8 hours (complex due to NextAuth)

---

## 🟡 HIGH PRIORITY (Should Test - Weeks 3-4)

### 4. OneRoster Integration (`lib/oneroster.ts`)
**Risk if broken**: No student data loads, entire app unusable

| Function | What It Does | Risk | Test Scenarios |
|----------|--------------|------|----------------|
| `orFetch()` | Authenticated API calls with retry | **HIGH** - Data fetching fails | ✅ Successful fetch<br>❌ 401 → retry once<br>❌ 403 → retry once<br>❌ Network timeout<br>✅ Cache invalidation on auth error |
| Token exchange | Get access token from vendor | **CRITICAL** - No API access | ✅ Valid token returned<br>❌ Invalid credentials<br>❌ Token expired |

**Why This Matters**:
- All student data comes through OneRoster
- Retry logic prevents transient failures
- Token caching improves performance

**Test Coverage**: 85%+

**Estimated Testing Time**: 5-6 hours

---

### 5. Parent Conduct Utilities (`lib/parent-conduct.ts`)
**Risk if broken**: Wrong data displayed to parents (confusion, support tickets)

| Function | What It Does | Risk | Test Scenarios |
|----------|--------------|------|----------------|
| `formatPersonName()` | Format Arabic/English names | **MEDIUM** - Wrong name shown | ✅ Arabic locale → Arabic name<br>✅ English locale → English name<br>✅ Fallback when name missing<br>❌ Empty person object |
| `extractPersonContact()` | Extract phone/email | **HIGH** - Parents can't be contacted | ✅ Phone extracted from metadata<br>✅ Email validated (contains @)<br>✅ Prefer person.email over contacts<br>❌ No contacts available |
| `findLatestEnrollment()` | Get current school | **HIGH** - Wrong school shown | ✅ Latest by school year<br>✅ Latest by date if same year<br>❌ Empty enrollments array<br>✅ Handles missing dates |
| `extractCitizenship()` | Get citizenship status | **MEDIUM** - Affects eligibility | ✅ Cached result reused<br>✅ Fetches from API<br>❌ API fails gracefully |

**Why This Matters**:
- Names shown throughout the app
- Contact info used for notifications
- Enrollment logic affects many features

**Test Coverage**: 80%+

**Estimated Testing Time**: 6-8 hours

---

### 6. Cache Utilities (`lib/cache.ts`)
**Risk if broken**: Stale data shown, or excessive API calls

| Function | What It Does | Risk | Test Scenarios |
|----------|--------------|------|----------------|
| `makeKey()` | Generate cache keys | **MEDIUM** - Cache collisions | ✅ Consistent key for same inputs<br>✅ Different keys for different inputs<br>✅ Handles special characters<br>✅ Handles numbers/strings |

**Why This Matters**:
- Wrong cache keys = wrong data shown to users
- Performance issues if caching broken

**Test Coverage**: 75%+

**Estimated Testing Time**: 2-3 hours

---

### 7. PDF Generation (`lib/pdf-generator.ts`)
**Risk if broken**: Parents can't download conduct agreements (core feature)

| Function | What It Does | Risk | Test Scenarios |
|----------|--------------|------|----------------|
| `generatePDF()` | Create PDF from data | **HIGH** - Feature unavailable | ✅ Valid PDF created<br>✅ Arabic text rendered correctly<br>✅ RTL layout works<br>❌ Missing fonts handled<br>❌ Invalid data gracefully fails |
| `downloadBase64PDF()` | Trigger browser download | **LOW** - Minor UX issue | ✅ Download triggered<br>✅ Correct filename |

**Why This Matters**:
- Required for conduct agreement workflow
- Arabic PDF generation is complex
- Difficult to debug in production

**Test Coverage**: 70%+

**Estimated Testing Time**: 4-5 hours

---

## 🟢 MEDIUM PRIORITY (Nice to Have - Weeks 5-6)

### 8. Time Utilities (`lib/time.ts`) ✅ DONE
**Risk if broken**: Incorrect timestamps shown (minor UX issue)

**Test Coverage**: 100% ✅

**Estimated Testing Time**: 1 hour ✅ COMPLETE

---

### 9. Generic Utilities (`lib/utils.ts`)
**Risk if broken**: Styling issues (visual bugs)

| Function | What It Does | Risk | Test Scenarios |
|----------|--------------|------|----------------|
| `cn()` | Merge Tailwind classes | **LOW** - Visual glitches | ✅ Merges classes correctly<br>✅ Handles conflicts<br>✅ Empty inputs work |

**Why This Matters**:
- Used everywhere for styling
- Low risk but high usage

**Test Coverage**: 70%+

**Estimated Testing Time**: 1 hour

---

### 10. Notifications (`lib/notifications.ts`)
**Risk if broken**: Users miss important messages

| Function | What It Does | Risk | Test Scenarios |
|----------|--------------|------|----------------|
| Notification creation | Create notification records | **MEDIUM** - Messages not sent | ✅ Notification saved to DB<br>✅ Toast triggered<br>❌ Invalid data rejected |

**Why This Matters**:
- Communication with parents
- Not critical (not transactional)

**Test Coverage**: 70%+

**Estimated Testing Time**: 3-4 hours

---

### 11. Admin Config (`lib/admin-config.ts`)
**Risk if broken**: Wrong academic year used (affects enrollment checks)

| Function | What It Does | Risk | Test Scenarios |
|----------|--------------|------|----------------|
| `getActiveAcademicYearValue()` | Get current academic year | **HIGH** - Wrong year = wrong data | ✅ Returns active year<br>❌ No active year configured<br>✅ Cached correctly |

**Why This Matters**:
- Used in authorization checks
- Changes once per year (low change frequency)

**Test Coverage**: 80%+

**Estimated Testing Time**: 2-3 hours

---

## ⚪ LOW PRIORITY (Optional - Weeks 7-8)

### 12. Logging (`lib/logger.ts`)
**Risk if broken**: Harder to debug issues (doesn't affect users)

| Function | What It Does | Risk | Test Scenarios |
|----------|--------------|------|----------------|
| `createScopedLogger()` | Create logger with context | **LOW** - Development tool | ✅ Logs contain correlation ID<br>✅ Context merged correctly |

**Test Coverage**: 50%+

**Estimated Testing Time**: 2 hours

---

### 13. Fetch Utilities (`lib/fetch-with-timeout.ts`)
**Risk if broken**: Requests hang forever

| Function | What It Does | Risk | Test Scenarios |
|----------|--------------|------|----------------|
| `FetchTimeoutError` | Custom error class | **LOW** - Error handling | ✅ Timeout throws error<br>✅ Successful requests work |

**Test Coverage**: 60%+

**Estimated Testing Time**: 2 hours

---

## 📊 API Routes Testing

### Critical API Routes

| Route | Priority | Risk | Test Scenarios |
|-------|----------|------|----------------|
| `/api/oneroster/basic-info-full` | 🔴 **CRITICAL** | Core data fetching | ✅ Valid EID returns data<br>❌ Invalid EID returns 404<br>❌ No auth returns 401 |
| `/api/students/[id]` | 🔴 **CRITICAL** | Student data access | ✅ Parent owns student<br>❌ Unauthorized access blocked<br>✅ Active enrollment validated |
| `/api/parent/children` | 🔴 **CRITICAL** | List children | ✅ Returns only owned children<br>✅ Filters by academic year |
| `/api/notifications/*` | 🟡 **HIGH** | User communications | ✅ Creates notification<br>✅ Triggers toast |
| `/api/db/health` | 🟢 **MEDIUM** | Infrastructure | ✅ Returns 200 when DB connected |

**Estimated Testing Time**: 10-12 hours total

---

## 🧩 Component Testing

### Priority Components

| Component | Priority | Risk | Test Scenarios |
|-----------|----------|------|----------------|
| `app/child/[id]/page.tsx` | 🔴 **CRITICAL** | Main student view | ✅ Renders student data<br>✅ Shows actions<br>❌ Unauthorized shows error |
| `app/components/ChildCard.tsx` | 🟡 **HIGH** | Student list item | ✅ Shows name, school, status<br>✅ Click navigates correctly |
| `app/components/NotificationBell.tsx` | 🟢 **MEDIUM** | Notification UI | ✅ Shows count<br>✅ Opens menu |

**Estimated Testing Time**: 8-10 hours total

---

## 📅 Implementation Timeline

### Week 1-2: Critical Security & Data Integrity
- ✅ `lib/time.ts` (DONE)
- 🔴 `lib/student-authorization.ts` (6 hours)
- 🔴 `lib/child-actions-schema.ts` (4 hours)
- 🔴 `lib/auth.ts` (8 hours)

**Total**: ~18 hours

---

### Week 3-4: High-Value Business Logic
- 🟡 `lib/oneroster.ts` (6 hours)
- 🟡 `lib/parent-conduct.ts` (8 hours)
- 🟡 `lib/cache.ts` (3 hours)
- 🟡 `lib/pdf-generator.ts` (5 hours)

**Total**: ~22 hours

---

### Week 5-6: API Routes & Integration
- 🔴 Critical API routes (12 hours)
- 🟢 `lib/utils.ts` (1 hour)
- 🟢 `lib/notifications.ts` (4 hours)
- 🟢 `lib/admin-config.ts` (3 hours)

**Total**: ~20 hours

---

### Week 7-8: Components & Polish
- 🔴 Critical components (10 hours)
- ⚪ `lib/logger.ts` (2 hours)
- ⚪ `lib/fetch-with-timeout.ts` (2 hours)
- Coverage improvement & CI setup (6 hours)

**Total**: ~20 hours

---

## 🎯 Success Metrics

### Coverage Goals by Priority

| Priority | Target Coverage | Current |
|----------|----------------|---------|
| 🔴 Critical | 90%+ | 8% (time.ts only) |
| 🟡 High | 80%+ | 0% |
| 🟢 Medium | 70%+ | 100% (time.ts) |
| ⚪ Low | 50%+ | 0% |
| **Overall** | **75%+** | **~5%** |

### Risk Reduction

| Risk Category | Current State | After Full Testing |
|---------------|---------------|-------------------|
| **Security Breach** | HIGH - No tests | LOW - 90%+ coverage |
| **Data Corruption** | MEDIUM - Manual QA only | LOW - Automated validation |
| **Production Crashes** | HIGH - Schema changes undetected | LOW - Schema tests catch issues |
| **Regression Bugs** | HIGH - No safety net | LOW - Tests prevent regressions |

---

## 💡 Quick Wins (Do These First!)

### Phase 1: High ROI, Low Effort (Week 1)
1. ✅ `lib/time.ts` - DONE! (1 hour)
2. 🔴 `lib/utils.ts` - Simple, widely used (1 hour)
3. 🔴 `lib/child-actions-schema.ts` - Critical but straightforward (4 hours)

**Total**: 6 hours → Prevents runtime crashes

### Phase 2: Critical Security (Week 2)
4. 🔴 `lib/student-authorization.ts` - Security critical (6 hours)

**Total**: 6 hours → Prevents data breaches

---

## 🚨 Highest Risk Areas (Test Immediately)

Based on impact analysis:

1. **`lib/student-authorization.ts`** 
   - Risk: Data breach, GDPR violation
   - Complexity: High (async, API calls, business rules)
   - Impact: Catastrophic if broken

2. **`lib/child-actions-schema.ts`**
   - Risk: App crashes for all users
   - Complexity: Medium (Zod validation)
   - Impact: High (affects core features)

3. **`lib/auth.ts`**
   - Risk: Authentication bypass
   - Complexity: Very High (NextAuth, Redis, JWT)
   - Impact: Catastrophic if broken

---

## 📝 Testing Strategy Summary

### What to Test First
Start with functions that are:
- ✅ Pure (no side effects) - easiest to test
- ✅ Critical to security/data integrity
- ✅ Complex business logic
- ✅ Frequently changing

### What to Test Later
Lower priority for:
- ⚪ Simple pass-through functions
- ⚪ UI-only components (manual testing OK for now)
- ⚪ Logging/debugging utilities
- ⚪ One-time setup scripts

### What NOT to Test
Skip testing:
- External libraries (already tested)
- Next.js framework code
- Simple type definitions
- Configuration files

---

## 🎓 Learning Path

For someone new to testing, I recommend this order:

1. **Start**: `lib/time.ts` ✅ DONE - Learn basics
2. **Next**: `lib/utils.ts` - Learn more assertions
3. **Then**: `lib/child-actions-schema.ts` - Learn validation testing
4. **Advanced**: `lib/parent-conduct.ts` - Learn complex logic
5. **Expert**: `lib/student-authorization.ts` - Learn mocking & async

---

## 📞 Questions?

Before implementing, consider:
- Do we need test data fixtures?
- Should we set up CI/CD first?
- What's our PR policy (block merge if tests fail)?
- Who reviews test code?

**Ready to start?** Pick one from the Quick Wins section!
