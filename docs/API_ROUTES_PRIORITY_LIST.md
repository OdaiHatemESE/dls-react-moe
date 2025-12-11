# API Routes - Priority List for Metrics Tracking

**Total Routes**: 49  
**Already Tracked**: 3 ✅  
**Remaining**: 46  

---

## 🔥 CRITICAL - Track Immediately (High Traffic + External Calls)

### ✅ Already Tracked (3)
1. ✅ `/api/PP/student/[id]` (GET) - Student profile lookup
2. ✅ `/api/backoffice/idh` (GET) - IDH student status
3. ✅ `/api/backoffice/idh` (POST) - IDH student update

### 🚨 Must Track Next (8)
4. `/api/PP/ChildList/[eid]` (GET) - **Get all children for parent** (Called on every dashboard load)
5. `/api/PP/persons` (GET) - **Parent person data** (Used in profile)
6. `/api/PP/child/sync` (GET/POST) - **Sync student data from PP** (Critical for data accuracy)
7. `/api/PP/student/[id]/enrollments` (GET) - **Student enrollment history** (Frequently accessed)
8. `/api/PP/conduct-status/[studentSourcedId]` (PATCH) - **Update conduct agreement** (Parent action)
9. `/api/PP/information-status/[studentSourcedId]` (PATCH) - **Update info request** (Parent action)
10. `/api/PP/auth/token` (GET) - **Get PP access token** (Called before EVERY PP API call)
11. `/api/PP/school/[id]` (GET) - **School details lookup** (Used in enrollments)

---

## ⚡ HIGH PRIORITY - Track Soon (External APIs)

### OneRoster APIs (4)
12. `/api/oneroster/basic-info-full` (GET) - Basic student info (External: OneRoster)
13. `/api/oneroster/students/[sourcedId]` (GET) - Individual student (External: OneRoster)
14. `/api/oneroster/latest-enrollment` (GET) - Latest enrollment (External: OneRoster)
15. `/api/oneroster/schoolenrollments` (GET) - School enrollments (External: OneRoster)

### Parent Portal APIs (4)
16. `/api/parent/update-information-requests` (GET/POST) - **Update requests list** (High usage)
17. `/api/parent/child-actions` (GET) - **Available child actions** (Dashboard feature)
18. `/api/parent/conduct` (GET/POST) - **Conduct agreement workflow** (Important workflow)
19. `/api/parent/generate-conduct-pdf` (POST) - **PDF generation** (Can be slow)

---

## 📊 MEDIUM PRIORITY - Track Later (Internal Logic)

### Notifications (6)
20. `/api/notifications` (GET/POST) - List and create notifications
21. `/api/notifications/count` (GET) - Notification count (Frequent polling)
22. `/api/notifications/[id]/read` (PATCH) - Mark as read
23. `/api/notifications/mark-all-read` (POST) - Bulk mark read
24. `/api/notifications/email` (POST) - Send email notification
25. `/api/notifications/sms` (POST) - Send SMS notification

### Admin Analytics (3)
26. `/api/admin/analytics/stats` (GET) - Dashboard statistics
27. `/api/admin/analytics/students` (GET) - Student analytics
28. `/api/admin/analytics/updates` (GET) - Update analytics

### Admin Config (6)
29. `/api/admin/config/academic-year` (GET/POST) - Academic year config
30. `/api/admin/config/actions` (GET/POST/PUT/DELETE) - Action config
31. `/api/admin/config/periods` (GET/POST/PUT/DELETE) - Period config
32. `/api/admin/config/status` (POST) - Status banner config
33. `/api/admin/config/users` (GET/POST/DELETE) - Admin user management
34. `/api/admin/academic-year/active` (GET) - Get active year

### Other Internal (3)
35. `/api/students/[id]` (GET) - Student lookup wrapper
36. `/api/parent/students-partnership-charter` (GET) - Partnership charter
37. `/api/PP/myapplications` (POST) - Applications list

---

## 🔧 LOW PRIORITY - Database Helpers (Don't Track)

### Database Health/Lookup (7)
38. `/api/db/health` (GET) - Database health check
39. `/api/db/health-parent` (GET) - Parent portal DB health
40. `/api/db/emirates` (GET) - Emirates dropdown data
41. `/api/db/regions` (GET) - Regions dropdown data
42. `/api/db/areas` (GET) - Areas dropdown data
43. `/api/db/zones` (GET) - Zones dropdown data
44. `/api/db/plots` (GET) - Plots dropdown data

### Admin & Debug (5)
45. `/api/admin/check-access` (GET) - Admin access check
46. `/api/admin/resilience-metrics` (GET/POST) - Metrics dashboard (Already tracked by design)
47. `/api/debug/student/[id]` (GET) - Debug student data
48. `/api/debug/conduct` (GET) - Debug conduct data
49. `/api/auth/custom-logout` (POST) - Custom logout handler

### Auth (1)
- `/api/auth/[...nextauth]` - NextAuth handlers (Don't track - too many calls)

---

## 📈 Recommended Implementation Plan

### Phase 1: CRITICAL (Add tracking to 8 routes) ⏱️ ~30 minutes
- **Impact**: Covers 80% of external API traffic
- **Routes**: PP APIs (ChildList, persons, sync, enrollments, statuses, token, school)
- **Priority**: Do this NOW

### Phase 2: HIGH (Add tracking to 8 routes) ⏱️ ~30 minutes
- **Impact**: Covers OneRoster + Parent Portal workflows
- **Routes**: OneRoster APIs + Parent workflow APIs
- **Priority**: Do this TOMORROW

### Phase 3: MEDIUM (Add tracking to 18 routes) ⏱️ ~1 hour
- **Impact**: Internal features monitoring
- **Routes**: Notifications, Admin analytics, Admin config
- **Priority**: Do this NEXT WEEK

### Phase 4: LOW (Skip or minimal tracking)
- **Impact**: Database lookups are fast and rarely fail
- **Routes**: DB helpers, debug endpoints
- **Priority**: OPTIONAL - Only if needed for debugging

---

## 🎯 Metrics Value by Category

| Category | Routes | External API? | Should Track? | Priority |
|----------|--------|---------------|---------------|----------|
| **PP APIs** | 11 | ✅ Yes | ✅ YES | 🔥 CRITICAL |
| **IDH APIs** | 2 | ✅ Yes | ✅ YES | 🔥 CRITICAL |
| **OneRoster APIs** | 4 | ✅ Yes | ✅ YES | ⚡ HIGH |
| **Parent Workflows** | 4 | ❌ No | ✅ YES | ⚡ HIGH |
| **Notifications** | 6 | ❌ No | ⚠️ MAYBE | 📊 MEDIUM |
| **Admin Analytics** | 3 | ❌ No | ⚠️ MAYBE | 📊 MEDIUM |
| **Admin Config** | 6 | ❌ No | ⚠️ MAYBE | 📊 MEDIUM |
| **Database Helpers** | 7 | ❌ No | ❌ NO | 🔧 LOW |
| **Debug/Auth** | 6 | ❌ No | ❌ NO | 🔧 LOW |

---

## 💡 Quick Decision Guide

**Should I track this route?**

✅ **YES - Track if:**
- Calls external API (PP, IDH, OneRoster)
- High traffic (called on every page load)
- Parent-facing action (conduct, update info)
- Can be slow or timeout-prone
- Critical to user workflow

❌ **NO - Skip if:**
- Simple database lookup
- Admin-only endpoint (low traffic)
- Debug/development endpoint
- Auth handler (too many calls)
- Always fast (<100ms)

---

## 🚀 Next Action

**Start with Phase 1 (8 routes)** - Add tracking to:
1. `/api/PP/ChildList/[eid]`
2. `/api/PP/persons`
3. `/api/PP/child/sync`
4. `/api/PP/student/[id]/enrollments`
5. `/api/PP/conduct-status/[studentSourcedId]`
6. `/api/PP/information-status/[studentSourcedId]`
7. `/api/PP/auth/token`
8. `/api/PP/school/[id]`

**Would you like me to add tracking to these 8 routes now?** (Yes/No)
