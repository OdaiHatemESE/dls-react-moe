# Sign Out Page (/signout)

**Route**: `/signout` or `/(public)/signout`  
**File**: `app/(public)/signout/page.tsx`  
**Access**: Public

## 📋 Business Purpose

Handles user logout:
- Clears session tokens
- Removes Redis cached tokens
- Redirects to login page
- Shows confirmation message

## 🔌 API Endpoints Used

### NextAuth Internal
- **POST /api/auth/signout**
  - Triggered by: `signOut()` from next-auth/react
  - Actions:
    - Invalidate session cookie
    - Clear Redis tokens (via callback)
    - Destroy session

## 🔄 Sign Out Flow

```
User clicks sign out
    ↓
Navigate to /signout
    ↓
signOut() called
    ↓
Clear session cookie
    ↓
Remove Redis tokens
    ↓
Redirect to /login
    ↓
Show logout success message
```

## ✅ Cleanup Actions

1. **Session Cookie**: Cleared by NextAuth
2. **Redis Tokens**: Removed via atKey reference
3. **Client State**: SWR cache cleared
4. **Local Storage**: Cleared if used

## 🎨 UI

- Simple confirmation message
- Loading spinner during logout
- Automatic redirect
- Localized text

## 🎯 Key Features

- Complete session cleanup
- Token invalidation
- Graceful redirect
- No lingering credentials

## 🔐 Security

- Clears all authentication tokens
- Invalidates server-side session
- Prevents session reuse
- CSRF protection maintained
