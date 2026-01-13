# DLS Parent Portal - Visual Sitemap

## 🗺️ Interactive Sitemap

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DLS PARENT PORTAL                               │
│                    Dubai Lighthouse School System                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
            ┌───────▼────────┐             ┌───────▼────────┐
            │  PUBLIC AREA   │             │  AUTH REQUIRED │
            └───────┬────────┘             └───────┬────────┘
                    │                               │
        ┌───────────┼───────────┐       ┌──────────┼──────────────────────┐
        │           │           │       │          │                      │
   ┌────▼────┐ ┌───▼─────┐ ┌──▼───┐ ┌──▼──────┐ ┌─▼────────┐ ┌──────────▼──┐
   │  HOME   │ │  LOGIN  │ │SIGNOUT│ │DASHBOARD│ │  PROFILE │ │NOTIFICATIONS│
   │    /    │ │ /login  │ │/signout│ │/dashboard│ │ /profile │ │/notifications│
   └────┬────┘ └─────────┘ └───────┘ └────┬────┘ └──────────┘ └─────────────┘
        │                                  │
        │ Auto-redirect                    │
        └──────────────────────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
            ┌───────▼─────────┐   ┌──────▼────────┐   ┌───────▼──────────┐
            │ PARENT SECTION  │   │ CHILD SECTION │   │  ADMIN SECTION   │
            └───────┬─────────┘   └──────┬────────┘   └───────┬──────────┘
                    │                    │                     │
        ┌───────────┼────────┐          │                     │
        │           │        │          │                     │
   ┌────▼─────┐ ┌──▼───┐ ┌──▼───┐     │               ┌─────▼──────┐
   │MY APPS   │ │SUMMARY│ │ ...  │     │               │ ADMIN EID  │
   │/parent/  │ │/parent│ │      │     │               │ /admin/eid │
   │applications│/summary│      │     │               └────────────┘
   └──────────┘ └───────┘ └──────┘     │
                                        │
                        ┌───────────────┼───────────────┐
                        │               │               │
                   ┌────▼──────┐  ┌────▼────────┐ ┌────▼────────┐
                   │CHILD DETAIL│  │UPDATE INFO  │ │PARENT CONDUCT│
                   │/child/[id] │  │/child/[id]/ │ │/child/[id]/ │
                   │            │  │update-info  │ │parent-conduct│
                   └────────────┘  └─────────────┘ └─────────────┘
```

## 📊 Page Hierarchy by Section

### 1. 🌐 Public Pages (No Auth)
```
├─ / (Home)
│  └─ Auto-redirects to /dashboard
├─ /login
│  └─ OIDC authentication entry
└─ /signout
   └─ Logout confirmation
```

### 2. 👨‍👩‍👧‍👦 Parent Dashboard (Auth Required)
```
/dashboard
├─ Children Overview
├─ Quick Actions
├─ Recent Notifications
├─ Sync Data Button
└─ Navigation to:
   ├─ /profile
   ├─ /notifications
   ├─ /parent/applications
   └─ /child/[id] (for each child)
```

### 3. 👤 Profile & Account
```
/profile
├─ Personal Information
├─ Contact Details
├─ Address Information
└─ Emirates ID Status
```

### 4. 🔔 Notifications
```
/notifications
├─ All Notifications List
├─ Filter by Status
├─ Filter by Type
├─ Mark as Read
└─ Pagination
```

### 5. 📝 Applications Management
```
/parent/applications
├─ Application Statistics
├─ Applications Table
│  ├─ Status Tracking
│  ├─ Comments
│  └─ Actions:
│     ├─ Resubmit (if returned)
│     └─ View Profile
└─ Multi-child Support
```

### 6. 🧒 Child Management
```
/child/[id]
├─ Student Profile
│  ├─ Personal Info
│  ├─ School Info
│  └─ Academic Data
├─ Actions:
│  ├─ Update Information
│  ├─ Sign Conduct
│  └─ View Grades
└─ Data Sync

/child/[id]/update-info
├─ Information Update Form
├─ File Uploads
├─ Validation
└─ Resubmission Flow

/child/[id]/parent-conduct
├─ Conduct Agreement Text
├─ Signature Canvas
├─ PDF Generation
└─ Download Signed Document
```

### 7. 🛡️ Admin Section
```
/admin/eid
├─ Analytics Dashboard
├─ Student Management
├─ Update Logs
├─ User Management
├─ Period Configuration
├─ Academic Year Settings
├─ Action Configuration
└─ System Resilience
```

## 🔗 Navigation Patterns

### Primary Navigation (Header)
```
┌──────────────────────────────────────────────────┐
│ Logo  [Dashboard] [Profile] [Notifications] [▼] │
└──────────────────────────────────────────────────┘
```

### Breadcrumb Navigation
```
Home > My Children > [Child Name]
  ↓         ↓             ↓
/dashboard  /dashboard  /child/[id]
```

### Action Flows

#### 1. Update Information Flow
```
Dashboard → Child Detail → Update Info → Submit → Back to Child Detail
```

#### 2. Sign Conduct Flow
```
Child Detail → Parent Conduct → Sign → Generate PDF → Download
```

#### 3. Resubmit Application Flow
```
My Applications → Resubmit → Update Info (mode=resubmit) → Submit → Applications
```

#### 4. Login Flow
```
Protected Route → Login → OIDC Provider → Callback → Original Route
```

## 📱 Mobile Navigation

### Bottom Navigation Bar (Mobile)
```
┌─────────┬─────────┬─────────┬─────────┐
│  Home   │Children │ Notify  │ Profile │
│   🏠    │   👨‍👩‍👧‍👦  │   🔔    │   👤    │
└─────────┴─────────┴─────────┴─────────┘
```

## 🎨 Page Types

| Icon | Type | Description | Count |
|------|------|-------------|-------|
| 🟢 | List | Data tables/grids | 3 |
| 🔵 | Detail | Individual item view | 4 |
| 🟡 | Form | Data entry/update | 2 |
| 🟣 | Dashboard | Overview/stats | 2 |
| ⚫ | Auth | Login/logout | 2 |
| 🔴 | Admin | Configuration | 1 |

## 🔐 Access Control Matrix

| Route | Public | Parent | Admin | Emirates ID |
|-------|--------|--------|-------|-------------|
| `/` | ✅ | ✅ | ✅ | ❌ |
| `/login` | ✅ | ✅ | ✅ | ❌ |
| `/signout` | ✅ | ✅ | ✅ | ❌ |
| `/dashboard` | ❌ | ✅ | ✅ | ✅ |
| `/profile` | ❌ | ✅ | ✅ | ⚠️ |
| `/notifications` | ❌ | ✅ | ✅ | ✅ |
| `/child/*` | ❌ | ✅ | ✅ | ✅ |
| `/parent/*` | ❌ | ✅ | ✅ | ✅ |
| `/admin/*` | ❌ | ❌ | ✅ | ✅ |

Legend:
- ✅ Allowed
- ❌ Denied
- ⚠️ Optional (shows warning if missing)

## 📍 URL Parameter Patterns

```
Dynamic Routes:
- /child/[id]                    → Student sourcedId (UUID)
- /child/[id]/update-info        → Student sourcedId
- /child/[id]/parent-conduct     → Student sourcedId

Query Parameters:
- /login?callbackUrl=:url        → Redirect after auth
- /child/[id]/update-info?mode=resubmit → Resubmission mode
- /notifications?type=:type&status=:status → Filtering
```

## 🌍 Internationalization

All pages support:
- **English** (en) - Default, LTR
- **Arabic** (ar) - RTL layout

### RTL Layout Changes
- Text direction: right-to-left
- Navigation: mirrored
- Icons: flipped where appropriate
- Forms: right-aligned labels

## 📊 Data Flow Diagram

```
┌──────────────┐
│  UAE Pass    │ (External OIDC)
└──────┬───────┘
       │
       ↓ Authentication
┌──────────────┐
│  NextAuth    │ (Session Management)
└──────┬───────┘
       │
       ↓ Token Storage
┌──────────────┐
│   Redis      │ (Access Tokens)
└──────┬───────┘
       │
       ↓ API Calls
┌──────────────┐
│ OneRoster API│ (Student Data)
└──────┬───────┘
       │
       ↓ Display
┌──────────────┐
│  React Pages │ (UI)
└──────────────┘
```

## 🎯 User Journey Examples

### Journey 1: First-Time Parent Login
```
1. Visit site (/) → Auto-redirect to /dashboard
2. Not authenticated → Redirect to /login
3. Login page → Redirect to UAE Pass
4. Complete UAE Pass → Callback to /dashboard
5. See children list → Click child card
6. View child detail → Sign conduct if needed
```

### Journey 2: Update Child Information
```
1. Dashboard → Select child
2. Child detail → Click "Update Info"
3. Update info page → Fill form
4. Upload documents → Submit
5. Confirmation → Return to child detail
6. View updated information
```

### Journey 3: Track Application Status
```
1. Dashboard → Navigate to "My Applications"
2. Applications page → View all applications
3. Filter by status → Find returned application
4. Click "Resubmit" → Update info page (resubmit mode)
5. Correct information → Resubmit
6. Return to applications → See updated status
```

### Journey 4: Admin Configuration
```
1. Login with admin Emirates ID
2. Access /admin/eid
3. Navigate to desired section
4. Make configuration changes
5. Save and verify
6. Return to parent portal
```
