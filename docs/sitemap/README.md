# DLS Parent Portal - Sitemap Documentation

This directory contains comprehensive documentation for every page in the DLS Parent Portal application. Each page has its own folder with a README explaining its business logic, API usage, data dependencies, and validation checks.

## 📁 Directory Structure

```
docs/sitemap/
├── README.md (this file)
├── 01-home/
├── 02-dashboard/
├── 03-login/
├── 04-profile/
├── 05-notifications/
├── 06-child-detail/
├── 07-child-update-info/
├── 08-child-parent-conduct/
├── 09-parent-applications/
├── 10-parent-summary/
├── 11-admin-eid/
└── 12-signout/
```

## 🗺️ Complete Site Navigation Map

### Public Routes
- **/** → [Home](./01-home/) - Landing page with automatic redirect to dashboard
- **/login** → [Login](./03-login/) - Authentication entry point
- **/signout** → [Sign Out](./12-signout/) - Logout page

### Authenticated Routes (Parent Portal)
- **/dashboard** → [Dashboard](./02-dashboard/) - Main parent dashboard with children overview
- **/profile** → [Profile](./04-profile/) - Parent profile information
- **/notifications** → [Notifications](./05-notifications/) - View and manage notifications
- **/parent/applications** → [My Applications](./09-parent-applications/) - Track student applications
- **/parent/summary** → [Summary](./10-parent-summary/) - Parent account summary

### Child-Specific Routes
- **/child/[id]** → [Child Detail](./06-child-detail/) - Student profile and information
- **/child/[id]/update-info** → [Update Info](./07-child-update-info/) - Update student information
- **/child/[id]/parent-conduct** → [Parent Conduct](./08-child-parent-conduct/) - Sign conduct agreements

### Admin Routes
- **/admin/eid** → [Admin Panel](./11-admin-eid/) - Administrative configuration and management

## 🔗 Navigation Flow

```
┌─────────────┐
│   Home (/)  │
└──────┬──────┘
       │ Auto-redirect
       ↓
┌─────────────────┐
│   Dashboard     │ ← Main hub
└────┬────────────┘
     │
     ├─→ Profile
     ├─→ Notifications
     ├─→ My Applications
     └─→ Child Detail ──┬─→ Update Info
                        ├─→ Parent Conduct
                        └─→ View Actions

┌──────────────┐
│ Admin Panel  │ ← Separate admin section
└──────────────┘
```

## 📊 Route Categories

### 1. **Entry Points** (3 routes)
- Home, Login, Sign Out

### 2. **Parent Dashboard** (4 routes)
- Dashboard, Profile, Notifications, Applications

### 3. **Child Management** (3 routes)
- Child Detail, Update Info, Parent Conduct

### 4. **Administrative** (1 route)
- Admin EID Panel

## 🔐 Authentication Requirements

| Route Pattern | Auth Required | Role | Emirates ID Required |
|---------------|--------------|------|---------------------|
| `/` | No | - | No |
| `/login` | No | - | No |
| `/signout` | No | - | No |
| `/dashboard` | Yes | Parent | Yes |
| `/profile` | Yes | Parent | Optional* |
| `/notifications` | Yes | Parent | Yes |
| `/child/*` | Yes | Parent | Yes |
| `/parent/*` | Yes | Parent | Yes |
| `/admin/*` | Yes | Admin | Yes |

*Profile page shows warning if Emirates ID is missing

## 📋 Page Documentation Index

Each page folder contains:
- **README.md** - Complete page documentation
  - Business purpose
  - User stories
  - API endpoints used
  - Data dependencies
  - Validation logic
  - State management
  - Error handling
  - Navigation flows

## 🔍 Quick Reference

### Most Used APIs
- `/api/PP/ChildList/:eid` - Get parent's children
- `/api/PP/student/:id` - Get student details
- `/api/PP/child/sync` - Sync student data
- `/api/notifications/*` - Notification management
- `/api/PP/persons` - Get person/parent details

### Common Data Dependencies
- **Session Data**: User authentication, Emirates ID
- **OneRoster API**: Student enrollment, grades, school info
- **Parent Portal API**: Applications, updates, conduct forms
- **Redis Cache**: Token storage, session management
- **Prisma Database**: Admin config, notifications, logs

### Key Features by Page
- **Dashboard**: Children overview, quick actions, recent notifications
- **Child Detail**: Student profile, grades, school info, conduct signing
- **Update Info**: File uploads, information updates, resubmission workflow
- **Applications**: Application tracking, status monitoring, resubmission
- **Admin**: User management, update periods, system configuration

## 📱 Responsive Design

All pages support:
- **Mobile-first** design approach
- **Tablet** optimized layouts
- **Desktop** full-featured views
- **RTL** (Arabic) and **LTR** (English) directions

## 🌐 Internationalization

All pages support:
- **English** (en)
- **Arabic** (ar)
- Dynamic text direction (LTR/RTL)
- Locale-aware date formatting
- Culturally appropriate UI patterns

## 🚀 Getting Started

To understand any page:
1. Navigate to the page's folder
2. Read the README.md for complete documentation
3. Check the "API Used" section for backend integration
4. Review "Business Logic" for feature requirements
5. See "Data Flow" for state management

## 📞 Support

For questions about specific pages, refer to the individual page documentation in their respective folders.
