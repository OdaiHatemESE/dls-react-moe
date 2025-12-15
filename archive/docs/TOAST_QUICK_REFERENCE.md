# Toast Notifications - Quick Reference

## Setup ✅ Complete

The toast system is already integrated and ready to use throughout the application.

## Basic Usage

### 1. Import the hook

```typescript
import { useToastNotifications } from '@/lib/hooks/use-toast-notifications'
```

### 2. Initialize in your component

```typescript
export default function MyComponent() {
  const toast = useToastNotifications()
  const { locale } = useI18n() // For i18n support
  
  // ... rest of component
}
```

### 3. Show toast notifications

```typescript
// Success (Green)
toast.success('Title', 'Description')

// Error (Red)
toast.error('Error', 'Something went wrong')

// Warning (Yellow)
toast.warning('Warning', 'Please be careful')

// Info (Blue)
toast.info('Info', 'New feature available')

// Loading (Gray - won't auto-dismiss)
const loading = toast.loading('Processing...', 'Please wait')
// Later dismiss it
loading.dismiss()
```

## Common Patterns

### API Call with Success/Error

```typescript
async function handleSubmit() {
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    
    if (!response.ok) throw new Error('Failed')
    
    toast.success(
      locale === 'ar' ? 'تم بنجاح' : 'Success',
      locale === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully'
    )
  } catch (error) {
    toast.error(
      locale === 'ar' ? 'خطأ' : 'Error',
      locale === 'ar' ? 'حدث خطأ' : 'An error occurred'
    )
  }
}
```

### Multi-System Update (Partial Success)

```typescript
async function updateSystems() {
  // Update local system
  await updateLocal()
  
  // Try to update PP system
  try {
    await updatePP()
    toast.success('Success', 'Updated in all systems')
  } catch (ppError) {
    // Show warning for partial success
    toast.warning(
      'Partial Success',
      'Saved locally, but central system update failed'
    )
  }
}
```

### Loading State

```typescript
async function longOperation() {
  const loadingToast = toast.loading(
    locale === 'ar' ? 'جارٍ المعالجة' : 'Processing',
    locale === 'ar' ? 'يرجى الانتظار' : 'Please wait'
  )
  
  try {
    await performLongTask()
    loadingToast.dismiss()
    toast.success('Done', 'Operation completed')
  } catch (error) {
    loadingToast.dismiss()
    toast.error('Error', 'Operation failed')
  }
}
```

## Bilingual Messages

Always provide both Arabic and English:

```typescript
toast.success(
  locale === 'ar' ? 'تم بنجاح' : 'Success',
  locale === 'ar' 
    ? 'تم حفظ التغييرات بنجاح' 
    : 'Changes saved successfully'
)
```

## Common Translation Pairs

| English | Arabic |
|---------|--------|
| Success | تم بنجاح |
| Error | خطأ |
| Warning | تحذير |
| Info | معلومات |
| Saved successfully | تم الحفظ بنجاح |
| Updated successfully | تم التحديث بنجاح |
| Deleted successfully | تم الحذف بنجاح |
| Something went wrong | حدث خطأ ما |
| Please try again | يرجى المحاولة مرة أخرى |
| Partial Success | تحديث جزئي |
| Processing | جارٍ المعالجة |
| Please wait | يرجى الانتظار |

## Real Examples in Codebase

### Parent Conduct Page
```typescript
// Success with multi-system
toast.success(
  locale === 'ar' ? 'تم بنجاح' : 'Success',
  locale === 'ar'
    ? 'تم توقيع الميثاق وحفظه بنجاح في جميع الأنظمة'
    : 'Charter signed and saved successfully across all systems'
)

// Warning for partial success
toast.warning(
  locale === 'ar' ? 'تحذير' : 'Warning',
  locale === 'ar' 
    ? 'تم حفظ الميثاق محلياً، لكن فشل التحديث في النظام المركزي'
    : 'Charter saved locally, but failed to update in central system'
)
```

### Update Info Page
```typescript
// Success
toast.success(
  locale === 'ar' ? 'تم بنجاح' : 'Success',
  locale === 'ar'
    ? 'تم تحديث المعلومات وحفظها في جميع الأنظمة بنجاح'
    : 'Information updated and saved successfully across all systems'
)

// Error with details
toast.error(
  locale === 'ar' ? 'خطأ' : 'Error',
  locale === 'ar'
    ? 'حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى.'
    : 'Something went wrong while saving. Please try again.'
)
```

## Best Practices

✅ **DO:**
- Always provide bilingual messages
- Use appropriate toast type (success, error, warning, info)
- Keep messages clear and actionable
- Dismiss loading toasts when done
- Use warnings for partial successes

❌ **DON'T:**
- Don't use `alert()` - use toast instead
- Don't show generic errors - provide context
- Don't leave loading toasts running forever
- Don't show toasts for silent background operations

## Migration from alert()

### Before:
```typescript
alert('Saved successfully!')
```

### After:
```typescript
toast.success(
  locale === 'ar' ? 'تم بنجاح' : 'Success',
  locale === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully'
)
```

## Files Already Updated

- ✅ `app/layout.tsx` - Toaster added
- ✅ `app/child/[id]/parent-conduct/page.tsx` - Full implementation
- ✅ `app/child/[id]/update-info/page.tsx` - Full implementation
- ✅ `app/profile/page.tsx` - alert() replaced
- ✅ `lib/hooks/use-toast-notifications.ts` - Helper hook created
- ✅ `lib/api-toast-handler.ts` - Server-side utilities
- ✅ `lib/hooks/use-toast.ts` - Updated limits (3 toasts, 5s delay)

## Need Help?

See full documentation in `docs/TOAST_NOTIFICATION_SYSTEM.md`
