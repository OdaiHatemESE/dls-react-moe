# Toast Notification System

A comprehensive toast notification system for user feedback across the application.

## Overview

The toast system provides elegant, accessible notifications for:
- Success messages
- Error messages
- Warnings
- Informational messages
- Loading states

## Components & Utilities

### 1. Core Hook: `use-toast-notifications.ts`

Enhanced hook with predefined styles for common use cases.

```typescript
import { useToastNotifications } from '@/lib/hooks/use-toast-notifications'

function MyComponent() {
  const toast = useToastNotifications()
  
  // Success notification
  toast.success('Success!', 'Your changes have been saved')
  
  // Error notification
  toast.error('Error!', 'Something went wrong')
  
  // Warning notification
  toast.warning('Warning!', 'This action cannot be undone')
  
  // Info notification
  toast.info('Info', 'New features are available')
  
  // Loading notification (won't auto-dismiss)
  const loadingToast = toast.loading('Processing...', 'Please wait')
  // Later dismiss it
  loadingToast.dismiss()
}
```

### 2. Global API Handler: `api-toast-handler.ts`

Server-side utilities for consistent API response handling.

```typescript
import { handleApiResponse, fetchWithToast } from '@/lib/api-toast-handler'

// Automatic error toasts
async function saveData() {
  const response = await fetch('/api/save', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  
  // Automatically shows error toast if response is not ok
  const result = await handleApiResponse(response, {
    successTitle: 'Saved!',
    successDescription: 'Your data has been saved',
    errorTitle: 'Save Failed',
  })
}

// Or use the wrapper
async function saveDataSimpler() {
  const result = await fetchWithToast('/api/save', {
    method: 'POST',
    body: JSON.stringify(data)
  }, {
    successTitle: 'Saved!',
    errorTitle: 'Save Failed'
  })
}
```

### 3. Standalone Toast Functions

For use in non-React contexts (API routes, utilities):

```typescript
import { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast,
  showInfoToast,
  showLoadingToast 
} from '@/lib/api-toast-handler'

showSuccessToast('Success!', 'Operation completed')
showErrorToast('Error!', 'Something went wrong')
showWarningToast('Warning!', 'Be careful')
showInfoToast('Info', 'Did you know?')

const loading = showLoadingToast('Processing...')
// Later...
loading.dismiss()
```

## Usage Patterns

### Pattern 1: Form Submission

```typescript
'use client'

import { useToastNotifications } from '@/lib/hooks/use-toast-notifications'

export default function MyForm() {
  const toast = useToastNotifications()
  
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    
    const loadingToast = toast.loading('Submitting...', 'Please wait')
    
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        throw new Error('Submission failed')
      }
      
      loadingToast.dismiss()
      toast.success('Success!', 'Form submitted successfully')
    } catch (error) {
      loadingToast.dismiss()
      toast.error('Error!', 'Failed to submit form')
    }
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

### Pattern 2: API Route with Toast Feedback

```typescript
'use client'

import { useToastNotifications } from '@/lib/hooks/use-toast-notifications'
import { useI18n } from '@/app/i18n/I18nProvider'

export default function UpdateButton() {
  const toast = useToastNotifications()
  const { locale } = useI18n()
  
  async function handleUpdate() {
    try {
      const response = await fetch('/api/PP/conduct-status/123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 1,
          isConductAgreementSigned: true
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        toast.error(
          locale === 'ar' ? 'خطأ' : 'Error',
          locale === 'ar' 
            ? 'فشل التحديث' 
            : 'Update failed'
        )
        return
      }
      
      toast.success(
        locale === 'ar' ? 'تم بنجاح' : 'Success',
        locale === 'ar'
          ? 'تم التحديث بنجاح'
          : 'Updated successfully'
      )
    } catch (error) {
      toast.error(
        locale === 'ar' ? 'خطأ' : 'Error',
        locale === 'ar'
          ? 'حدث خطأ غير متوقع'
          : 'An unexpected error occurred'
      )
    }
  }
  
  return <button onClick={handleUpdate}>Update</button>
}
```

### Pattern 3: Multiple System Updates

```typescript
async function syncMultipleSystems() {
  const toast = useToastNotifications()
  
  // Update local system
  try {
    await updateLocal()
    
    // Try to update PP system
    try {
      await updatePP()
      toast.success('Success!', 'Updated in all systems')
    } catch (ppError) {
      toast.warning(
        'Partial Success',
        'Saved locally, but central system update failed'
      )
    }
  } catch (error) {
    toast.error('Error!', 'Failed to save changes')
  }
}
```

## Internationalization (i18n)

Always provide localized messages:

```typescript
const toast = useToastNotifications()
const { locale } = useI18n()

toast.success(
  locale === 'ar' ? 'تم بنجاح' : 'Success',
  locale === 'ar'
    ? 'تم حفظ التغييرات'
    : 'Changes saved successfully'
)
```

## Best Practices

### ✅ DO

- Use appropriate toast types (success, error, warning, info)
- Provide clear, actionable messages
- Localize all toast messages
- Dismiss loading toasts when operations complete
- Use warnings for partial successes
- Keep messages concise but informative

### ❌ DON'T

- Don't show multiple toasts for the same action
- Don't use toasts for critical errors that need user action (use dialogs)
- Don't leave loading toasts running indefinitely
- Don't use generic error messages ("An error occurred")
- Don't show toasts for background operations users don't care about

## Toast Variants

### Success (Green)
```typescript
toast.success('Title', 'Description')
```
Use for: Successful operations, confirmations

### Error (Red)
```typescript
toast.error('Title', 'Description')
```
Use for: Failed operations, validation errors

### Warning (Yellow)
```typescript
toast.warning('Title', 'Description')
```
Use for: Partial successes, deprecation notices, cautionary messages

### Info (Blue)
```typescript
toast.info('Title', 'Description')
```
Use for: Informational messages, tips, feature announcements

### Loading (Gray)
```typescript
const loadingToast = toast.loading('Title', 'Description')
// Remember to dismiss it!
loadingToast.dismiss()
```
Use for: Long-running operations, async processes

## Configuration

Toast settings are configured in `lib/hooks/use-toast.ts`:

- `TOAST_LIMIT`: Maximum number of toasts shown at once (default: 1)
- `TOAST_REMOVE_DELAY`: Time before toast is removed from DOM (default: 1000000ms)

Auto-dismiss is handled by the Toast component itself with default duration.

## Styling

Toasts automatically adapt to:
- Light/dark theme
- RTL/LTR layout
- Mobile/desktop viewports

Custom classes can be added via the `className` property for special cases.

## Examples in Codebase

See implementations in:
- `/app/child/[id]/parent-conduct/page.tsx` - Conduct agreement signing
- `/lib/api-toast-handler.ts` - Server-side API handling
- `/lib/hooks/use-toast-notifications.ts` - Core notification logic

## Accessibility

The toast system is built on Radix UI primitives and includes:
- ARIA live regions for screen readers
- Keyboard navigation support
- Focus management
- Proper color contrast for all variants
