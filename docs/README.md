# Consolidated Documentation

**Last Updated:** December 15, 2025

This folder contains consolidated, comprehensive documentation for the DLS React MOE Parent Portal system. All documentation has been carefully consolidated from multiple source files, removing duplicates and organizing information logically.

---

## 📚 Documentation Structure

### Core Documentation (`/core`)

**[ARCHITECTURE.md](./core/ARCHITECTURE.md)** - System Architecture & Core Infrastructure
- Database architecture (shared SQL Server)
- API resilience patterns (timeouts, retries, circuit breakers)
- Student authorization security
- External service integration (OneRoster, PP API, IDH API)
- Token management and auth flows

**Key Topics:**
- Shared database between .NET and Next.js
- Timeout configurations for all APIs
- Circuit breaker patterns
- Queue management (IDH)
- Security authorization layers

---

### Features Documentation (`/features`)

**[CHILD_ACTIONS.md](./features/CHILD_ACTIONS.md)** - Student Actions System
- Status flow and lifecycle
- Action availability matrix
- Badge and banner display rules
- Configuration and setup
- Complete independence between Update Info and Conduct Signature

**Key Topics:**
- IDH status system (null, 1-5)
- Conduct signature system
- Action visibility rules
- Simplified configuration (no complex status filtering)
- Visual examples for all scenarios

---

**[NOTIFICATIONS.md](./features/NOTIFICATIONS.md)** - Notification System
- System architecture and data flow
- Setup and configuration
- Usage examples and patterns
- Integration with API routes
- Toast notifications for immediate feedback

**Key Topics:**
- Database-persisted notifications
- SWR hooks for data fetching
- 8 notification types with color coding
- Auto-refresh and optimistic updates
- Toast system for in-page feedback
- Bilingual support (Arabic/English)

---

**[ADMIN_PANEL.md](./features/ADMIN_PANEL.md)** - Admin Panel & Configuration
- Admin access control
- Update period management
- Student actions configuration
- Academic year management
- Admin analytics dashboard

**Key Topics:**
- Admin user management by Emirates ID
- Time-window configuration for updates
- Action availability by education type
- Active academic year selection
- Comprehensive analytics and reporting

---

## 🚀 Quick Start Guide

### For Developers

1. **Start with Architecture** - Read `core/ARCHITECTURE.md` to understand the system design
2. **Review Features** - Read relevant feature docs based on what you're working on
3. **Check API Patterns** - All API resilience patterns are documented in Architecture
4. **Security First** - Student authorization security is critical, review before API changes

### For Administrators

1. **Admin Panel** - Read `features/ADMIN_PANEL.md` for complete admin guide
2. **Academic Year** - Configure active year first
3. **Update Periods** - Set up time windows for parent updates
4. **Student Actions** - Configure available actions by education type
5. **Analytics** - Monitor system usage and student data

### For Integration

1. **Child Actions** - Read `features/CHILD_ACTIONS.md` for status flows
2. **Notifications** - Read `features/NOTIFICATIONS.md` for notification patterns
3. **API Resilience** - Check timeout and retry configurations in Architecture

---

## 🔑 Key Differences from Old Docs

### What's Changed

✅ **Removed Duplicates** - Information that appeared in multiple files is now in one place  
✅ **Organized Logically** - Related information grouped together  
✅ **Removed Outdated Content** - Only current, implemented features included  
✅ **Added Quick Starts** - Every document starts with quick start section  
✅ **Cross-Referenced** - Links between related documents  
✅ **Comprehensive Examples** - Real code examples from the codebase  

### What's Consolidated

**Architecture Document** combines:
- DATABASE_ARCHITECTURE_SHARED.md
- STUDENT_AUTHORIZATION_SECURITY.md
- API_RESILIENCE_AUDIT.md
- RESILIENCE_QUICK_REFERENCE.md

**Child Actions Document** combines:
- CHILD_ACTIONS_QUICK_REFERENCE.md
- ACTIONS_INDEPENDENCE.md
- ACTIONS_SIMPLIFIED.md
- CHILD_EDIT_FEATURE.md

**Notifications Document** combines:
- NOTIFICATION_ARCHITECTURE.md
- NOTIFICATION_README.md
- NOTIFICATION_QUICK_START.md
- NOTIFICATION_INTEGRATION_EXAMPLES.md
- TOAST_NOTIFICATION_SYSTEM.md
- TOAST_QUICK_REFERENCE.md

**Admin Panel Document** combines:
- ADMIN_CONFIG_SYSTEM.md
- ADMIN_CONFIG_QUICKSTART.md
- ADMIN_ACADEMIC_YEAR_CONFIG.md
- ADMIN_ANALYTICS.md
- ACADEMIC_YEAR_IMPLEMENTATION.md

---

## 📖 Document Conventions

### Structure

Each document follows this structure:
1. **Quick Start** - Get up and running quickly
2. **Overview** - High-level understanding
3. **Detailed Topics** - Deep dive into specifics
4. **Examples** - Real-world code examples
5. **Troubleshooting** - Common issues and solutions
6. **Related Docs** - Links to related documentation

### Code Examples

- All code examples are from actual implementation
- Examples show complete, working code (no placeholders)
- Includes error handling and edge cases
- Demonstrates best practices

### Visual Aids

- ASCII diagrams for system flows
- Tables for configuration references
- Checklists for processes
- Status matrices for rules

---

## 🔍 Finding Information

### By Topic

| Topic | Document | Section |
|-------|----------|---------|
| Database Schema | Architecture | Database Architecture |
| API Timeouts | Architecture | API Resilience |
| Circuit Breakers | Architecture | API Resilience |
| Authorization | Architecture | Student Authorization Security |
| Student Status | Child Actions | Status Flow |
| Action Badges | Child Actions | Badge Display Rules |
| Update Info vs Conduct | Child Actions | System Overview |
| Database Notifications | Notifications | System Architecture |
| Toast Messages | Notifications | Toast Notifications |
| Admin Users | Admin Panel | Admin Access Control |
| Update Windows | Admin Panel | Update Period Management |
| Academic Years | Admin Panel | Academic Year Management |
| System Stats | Admin Panel | Admin Analytics |

### By Use Case

| Use Case | Document | Section |
|----------|----------|---------|
| Adding API timeout | Architecture | API Resilience |
| Checking student access | Architecture | Student Authorization Security |
| Showing/hiding actions | Child Actions | Action Availability |
| Understanding status flow | Child Actions | Status Flow |
| Sending notifications | Notifications | Usage Examples |
| Toast feedback | Notifications | Toast Notifications |
| Creating admin users | Admin Panel | Admin Access Control |
| Setting update periods | Admin Panel | Update Period Management |
| Changing academic year | Admin Panel | Academic Year Management |

---

## 🛠️ Maintenance

### Updating Documentation

When making changes to the system:

1. **Update relevant consolidated doc** - Don't create new files
2. **Keep examples current** - Update code examples if implementation changes
3. **Update version date** - Change "Last Updated" date at top of document
4. **Cross-reference changes** - Update related documents if needed
5. **Test examples** - Verify code examples still work

### Adding New Features

For new features:

1. **Identify document** - Which consolidated doc should it go in?
2. **Add to TOC** - Update table of contents
3. **Add Quick Start entry** - If it's a major feature
4. **Update this README** - Add to finding information tables
5. **Cross-reference** - Link from related documents

---

## 📞 Support

For questions or clarifications:

1. Check the relevant consolidated document
2. Search for specific terms using your editor
3. Review code examples in the document
4. Check related documents (cross-references at bottom)
5. Review actual implementation in codebase

---

## ⚡ Quick Reference

### Important URLs

- Admin Panel: `/admin/eid`
- Notifications Page: `/notifications`
- Student Profile: `/child/[id]`
- Update Info: `/child/[id]/update-info`
- Conduct Agreement: `/child/[id]/parent-conduct`

### Important Files

- Auth Config: `lib/auth.ts`
- OneRoster: `lib/oneroster.ts`
- Admin Config: `lib/admin-config.ts`
- Notifications: `lib/notifications.ts`
- Child Actions: `lib/child-actions.ts`
- Prisma Schema: `prisma/parent-portal/schema.prisma`

### Key Commands

```bash
# Development
npm run dev

# Prisma
npm run prisma:pp:generate
npm run prisma:pp:push
npm run prisma:pp:studio

# Build
npm run build
npm start

# Lint
npm run lint
```

---

**Status:** ✅ Complete and Up-to-Date  
**Documents:** 4 Consolidated Files  
**Coverage:** All Implemented Features  

Maintained by the Development Team
