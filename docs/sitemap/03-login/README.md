# Login Page (/login)

**Route**: `/login`  
**File**: `app/login/page.tsx`  
**Access**: Public (no authentication required)

## 📋 Business Purpose

The login page serves as the **authentication entry point** for the Parent Portal. It automatically redirects users to the OIDC (OpenID Connect) authentication provider for secure login via UAE Pass or other configured identity providers.

This page ensures:
- Seamless integration with UAE Pass authentication
- Secure token exchange
- Automatic redirection flow
- User-friendly loading experience

## 🎯 User Stories

- As a **parent**, I want to securely log in using my UAE Pass credentials
- As a **parent**, I want to be automatically redirected to the authentication provider
- As a **parent**, I want to see a loading indicator while authentication is in progress
- As a **parent**, I want to return to my intended page after successful login

## 🔧 Technical Implementation

### Component Type
- **Client Component** (`"use client"`)
- Uses NextAuth's `signIn` function
- Automatic redirect on mount

### Key Features
1. **Automatic OIDC Redirect**: No manual button click needed
2. **Callback URL Handling**: Preserves intended destination
3. **Loading State**: Visual feedback during redirect
4. **Internationalized**: Multi-language support

### Code Flow
```
User lands on /login (or redirected from protected route)
    ↓
Extract callbackUrl from query params
    ↓
useEffect triggers on mount
    ↓
signIn('oidc', { callbackUrl })
    ↓
Redirect to OIDC provider (UAE Pass)
    ↓
Show loading UI
    ↓
[External] User authenticates
    ↓
[External] Redirect back to callback URL
```

## 🔌 API Endpoints Used

### NextAuth Internal Endpoints

1. **POST /api/auth/signin/oidc**
   - **Purpose**: Initiate OIDC authentication flow
   - **Triggered By**: `signIn('oidc', { callbackUrl })`
   - **Provider**: Configured in `lib/auth.ts`
   - **Response**: HTTP redirect to OIDC provider

2. **GET /api/auth/callback/oidc**
   - **Purpose**: Handle OIDC callback after authentication
   - **Automatic**: NextAuth handles this
   - **Actions**:
     - Validate OIDC tokens
     - Exchange for access token
     - Store in Redis
     - Create session
     - Redirect to callbackUrl

## 📊 Data Dependencies

### Query Parameters
```typescript
const params = new URLSearchParams(window.location.search);
const callbackUrl = params.get('callbackUrl') || '/';
```

- **callbackUrl**: Where to redirect after successful login
  - Default: `/` (home, which redirects to `/dashboard`)
  - Example: `/child/123` (if user tried accessing child page while logged out)

### Session Creation
After successful authentication, NextAuth creates session with:
```typescript
{
  user: {
    id: string,
    name: string,
    email: string,
    emiratesId: string,      // From UAE Pass
    // ... other profile data
  },
  accessToken: string,       // Stored in Redis via atKey
  expires: string
}
```

### OIDC Configuration
From `lib/auth.ts`:
```typescript
{
  id: "oidc",
  name: "UAE Pass",
  type: "oauth",
  wellKnown: process.env.AUTH0_ISSUER + "/.well-known/openid-configuration",
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  authorization: {
    params: {
      scope: "openid profile email",
    }
  },
  idToken: true,
  checks: ["state", "pkce"],
  profile(profile) {
    // Extract user data from OIDC profile
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      emiratesId: profile.emiratesId || profile.nationalId,
      // ...
    };
  }
}
```

## ✅ Validation & Checks

### No Client-Side Validation
This page performs no validation—it immediately redirects to the OIDC provider.

### Server-Side Checks (NextAuth)
1. **OIDC Configuration Validation**
   - Validates client ID and secret
   - Checks well-known configuration endpoint
   - Verifies redirect URIs

2. **Token Validation**
   - Validates ID token signature
   - Checks token expiration
   - Verifies issuer and audience

3. **Profile Validation**
   - Extracts required fields (Emirates ID)
   - Maps OIDC claims to user object
   - Stores in session

## 🔄 State Management

### No Local State
Component uses `useEffect` to trigger redirect immediately—no state needed.

### Effect Hook
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const callbackUrl = params.get('callbackUrl') || '/';
  signIn('oidc', { callbackUrl });
}, []);
```

- Runs once on mount
- Extracts callback URL
- Triggers OIDC signin

### Session State (After Login)
Managed by NextAuth:
- Stored in encrypted JWT cookie
- Access token stored in Redis
- Session accessible via `useSession()` hook

## 🎨 UI Components

### Layout Structure
```
┌─────────────────────────────────┐
│ Centered Container              │
│                                 │
│   ┌─────────────────────┐       │
│   │ Title               │       │
│   │ Subtitle            │       │
│   └─────────────────────┘       │
│                                 │
│   ┌─────────────────────┐       │
│   │ Card                │       │
│   │  - Spinner          │       │
│   │  - "Redirecting..." │       │
│   │  - Description      │       │
│   └─────────────────────┘       │
│                                 │
└─────────────────────────────────┘
```

### Custom Components
1. **Card / CardContent**
   - From: `@/components/ui/card`
   - Purpose: Container for loading state

### UI Elements
1. **Spinner**: Animated SVG circle
   ```typescript
   <svg className="animate-spin h-12 w-12 mx-auto text-aegold-600">
     <circle className="opacity-25" ... />
     <path className="opacity-75" ... />
   </svg>
   ```

2. **Title**: Page heading
   ```typescript
   <h1 className="text-3xl font-bold text-gray-900">
     {t.login.title}
   </h1>
   ```

3. **Description**: Explanation text
   ```typescript
   <p className="mt-2 text-gray-600">
     {t.login.subtitle}
   </p>
   ```

### Styling Classes
- **Background**: `bg-gray-50` with RTL support
- **Centered Layout**: `min-h-screen flex items-center justify-center`
- **Spacing**: `py-12 px-4 sm:px-6 lg:px-8`
- **Color Theme**: Uses `aegold-600` (brand color)

## 🌐 Internationalization

### Supported Languages
- **English** (en)
- **Arabic** (ar) with RTL layout

### Translation Keys
```typescript
t.login.title        // "Sign In" / "تسجيل الدخول"
t.login.subtitle     // "Please wait..." / "يرجى الانتظار..."
```

### RTL Handling
```typescript
className={clsx(
  "min-h-screen ...",
  locale === 'ar' && 'direction-rtl'
)}
```

## 📱 Responsive Design

### Mobile (< 640px)
- Full-width container with padding
- Compact card layout
- Standard text sizing

### Tablet & Desktop
- Centered card with max-width constraint
- Larger spinner
- More spacious layout

### Consistent Experience
All screen sizes show the same content—just spacing adjustments.

## 🚦 Navigation Flow

### Incoming Routes

1. **Direct Access**: User types `/login` in browser
   - Redirects to OIDC provider
   - After auth: redirects to `/`

2. **Middleware Redirect**: User tries accessing protected route while logged out
   - Example: User visits `/dashboard` → middleware redirects to `/login?callbackUrl=/dashboard`
   - After auth: redirects to `/dashboard`

3. **Manual Logout**: User logs out
   - Redirect to `/login`
   - No callbackUrl (goes to `/` after login)

### Outgoing Routes

1. **OIDC Provider**: External authentication page
   - UAE Pass login screen
   - Returns to `/api/auth/callback/oidc`

2. **Callback URL**: After successful authentication
   - Default: `/` (then auto-redirects to `/dashboard`)
   - Or: Preserved intended destination

### Navigation Diagram
```
Protected Route (e.g., /dashboard)
    ↓ (if not authenticated)
Middleware → /login?callbackUrl=/dashboard
    ↓
OIDC Provider (UAE Pass)
    ↓ (after authentication)
/api/auth/callback/oidc
    ↓
/dashboard (callbackUrl)
```

## ⚠️ Error Handling

### Client-Side Errors
- **signIn failure**: NextAuth handles errors
- **Network errors**: Browser will show standard error
- **No explicit error UI**: Loading state shown indefinitely

### Server-Side Errors (NextAuth)
Common error scenarios:

1. **Invalid OIDC Configuration**
   - Missing environment variables
   - Incorrect well-known endpoint
   - NextAuth shows error page

2. **Authentication Failure**
   - User cancels login
   - Invalid credentials
   - OIDC provider returns to callback with error

3. **Token Exchange Failure**
   - Can't retrieve access token
   - Redis connection issues
   - Session creation fails

### Error Pages
NextAuth automatically redirects to:
- `/api/auth/error?error=...` with error details
- Custom error page can be configured in `lib/auth.ts`

## 🔐 Security Considerations

### PKCE Flow
- **Proof Key for Code Exchange** enabled
- Prevents authorization code interception
- `checks: ["state", "pkce"]` in provider config

### State Parameter
- CSRF protection
- Validates callback originated from legitimate request

### Token Storage
- **Access Token**: Stored in Redis, referenced by `atKey` in JWT
- **Session Token**: Encrypted JWT cookie
- **Not in localStorage**: Prevents XSS attacks

### Secure Cookies
```typescript
cookies: {
  sessionToken: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  }
}
```

### Environment Security
- Client ID and secret in environment variables
- Never exposed to client
- Server-side only validation

## 🧪 Testing Considerations

### Test Scenarios
1. ✅ Page loads and shows loading state
2. ✅ Automatic redirect to OIDC provider
3. ✅ Callback URL is preserved
4. ✅ Successful authentication creates session
5. ✅ Failed authentication shows error
6. ✅ Localized text displays correctly

### Mock Testing
For testing without UAE Pass:
- Use Credentials provider (mobile token flow)
- Or mock OIDC provider
- Configured in `lib/auth.ts`

### Integration Testing
1. Test full OAuth flow
2. Verify token storage in Redis
3. Check session creation
4. Validate redirect behavior

## 🔗 Related Components

### NextAuth Configuration
- **File**: `lib/auth.ts`
- **Purpose**: Auth provider configuration
- **Key Settings**:
  - OIDC provider setup
  - Callbacks for JWT and session
  - Token storage in Redis

### API Routes
- **File**: `app/api/auth/[...nextauth]/route.ts`
- **Purpose**: NextAuth API handler
- **Exports**: GET and POST handlers

### Middleware
- **File**: `middleware.ts`
- **Purpose**: Protects routes, handles redirects
- **Logic**:
  ```typescript
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(`/login?callbackUrl=${url}`);
  }
  ```

## 📝 Configuration

### Required Environment Variables
```bash
# OIDC Provider (UAE Pass / Auth0)
AUTH0_ISSUER=https://your-auth-provider.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret

# NextAuth
NEXTAUTH_URL=https://your-app.com
NEXTAUTH_SECRET=your_secret_key

# Redis (for token storage)
REDIS_URL=redis://localhost:6379
```

### Provider Configuration
In `lib/auth.ts`:
```typescript
providers: [
  {
    id: "oidc",
    name: "UAE Pass",
    type: "oauth",
    wellKnown: process.env.AUTH0_ISSUER + "/.well-known/openid-configuration",
    // ... configuration
  }
]
```

## 🎯 Key Takeaways

1. **Automatic Redirect**: No user interaction needed
2. **OIDC/OAuth**: Industry-standard authentication
3. **UAE Pass Integration**: Primary authentication method
4. **Secure Token Handling**: Redis storage, encrypted sessions
5. **Callback Preservation**: Returns user to intended page
6. **Loading Experience**: Clear visual feedback
7. **Error Handling**: Managed by NextAuth
8. **Security-First**: PKCE, state validation, secure cookies

## 🔍 Code Location

```
app/
  └── login/
      └── page.tsx              ← This page
lib/
  └── auth.ts                   ← NextAuth config
  └── redis.ts                  ← Token storage
app/api/auth/
  └── [...nextauth]/
      └── route.ts              ← NextAuth API handler
middleware.ts                   ← Route protection
```

## 📚 Dependencies

- `next-auth` - Authentication library
- `next-auth/react` - React hooks (signIn)
- `@/app/i18n/I18nProvider` - Internationalization
- `@/components/ui/card` - UI component
- `clsx` - Conditional CSS classes
- Redis (server-side) - Token storage
- OIDC Provider (external) - UAE Pass
