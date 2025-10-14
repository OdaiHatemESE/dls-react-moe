# AddressFields Component

A reusable, theme-aware address input component for the Parent Portal that handles Emirates and Areas selection with dynamic data fetching.

## Features

✨ **Theme Integration**
- Full support for all 4 themes + dark mode
- Uses theme-aware colors (primary, destructive, etc.)
- Adapts to dark mode automatically

🌍 **i18n Support**
- Automatic RTL/LTR layout based on locale
- Arabic/English label support
- Displays area/emirate names in user's preferred language

📡 **Smart Data Fetching**
- Fetches Emirates from `/api/db/emirates`
- Dynamically loads Areas based on selected Emirate
- Handles Abu Dhabi special case with `isAbuDhabi` flag
- Uses SWR for efficient caching and revalidation

✅ **Form Validation**
- Optional required field validation
- Touch-based error display (only shows errors after user interaction)
- Visual feedback with error states and messages

♿ **Accessibility**
- Proper ARIA labels
- Keyboard navigation support
- Focus management
- Disabled states with visual feedback

## Installation

The component is already integrated into the project. Import it like this:

```tsx
import AddressFields, { AddressValue } from "@/app/components/forms/AddressFields";
```

## Basic Usage

```tsx
"use client";

import { useState } from "react";
import AddressFields, { AddressValue } from "@/app/components/forms/AddressFields";

export default function MyForm() {
  const [address, setAddress] = useState<AddressValue>({});

  return (
    <AddressFields
      value={address}
      onChange={setAddress}
    />
  );
}
```

## API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `AddressValue` | `undefined` | Current address values |
| `onChange` | `(value: AddressValue) => void` | `undefined` | Callback when any field changes |
| `disabled` | `boolean` | `false` | Disables all fields |
| `className` | `string` | `undefined` | Additional CSS classes for wrapper |
| `isAbuDhabi` | `boolean` | `false` | Special handling for Abu Dhabi areas |
| `abuDhabiZoneIdOverride` | `number` | `undefined` | Override zone ID for Abu Dhabi queries |
| `gradeCode` | `string` | `undefined` | Pass-through to areas API |
| `genderCode` | `string` | `undefined` | Pass-through to areas API |
| `labels` | `Partial<LabelsConfig>` | Arabic defaults | Custom labels |
| `required` | `Partial<RequiredConfig>` | All optional | Mark fields as required |
| `layout` | `"grid" \| "stack"` | `"grid"` | Layout style |

### Types

```typescript
type AddressValue = {
  emirateId?: number | null;
  areaId?: number | null;
  streetName?: string;
  houseNumber?: string;
};

type LabelsConfig = {
  emirate: string;
  area: string;
  streetName: string;
  houseNumber: string;
  requiredField: string;
};

type RequiredConfig = {
  emirate: boolean;
  area: boolean;
  streetName: boolean;
  houseNumber: boolean;
};
```

## Examples

### Required Fields

```tsx
<AddressFields
  value={address}
  onChange={setAddress}
  required={{
    emirate: true,
    area: true,
    streetName: true,
    houseNumber: true
  }}
/>
```

### Custom Labels

```tsx
<AddressFields
  value={address}
  onChange={setAddress}
  labels={{
    emirate: "اختر الإمارة",
    area: "اختر المنطقة",
    streetName: "اسم الشارع",
    houseNumber: "رقم البناية",
    requiredField: "هذا الحقل إلزامي"
  }}
/>
```

### Abu Dhabi Special Case

```tsx
<AddressFields
  value={address}
  onChange={setAddress}
  isAbuDhabi={true}
  abuDhabiZoneIdOverride={123}
/>
```

### Stack Layout

```tsx
<AddressFields
  value={address}
  onChange={setAddress}
  layout="stack"
/>
```

### With Form Validation

```tsx
"use client";

import { useState } from "react";
import AddressFields, { AddressValue } from "@/app/components/forms/AddressFields";
import { Button } from "@/components/ui/button";

export default function MyForm() {
  const [address, setAddress] = useState<AddressValue>({});
  const [submitted, setSubmitted] = useState(false);

  const isValid = address.emirateId && 
                  address.areaId && 
                  address.streetName && 
                  address.houseNumber;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      console.log("Submitting:", address);
      setSubmitted(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AddressFields
        value={address}
        onChange={setAddress}
        required={{
          emirate: true,
          area: true,
          streetName: true,
          houseNumber: true
        }}
      />
      <Button type="submit" disabled={!isValid || submitted}>
        {submitted ? "تم الحفظ" : "حفظ"}
      </Button>
    </form>
  );
}
```

## Demo

Visit the demo page to see the component in action:
- **URL**: `http://localhost:4200/debug/address-demo`
- **Features**: Live preview, theme switching, validation example

## Styling

The component uses:
- Tailwind CSS with theme-aware utilities
- CSS custom properties for theme colors
- Responsive grid layout (1 column mobile, 2 columns desktop)
- Smooth transitions and hover effects
- Dark mode support

### Theme Colors Used
- `primary` - Focus rings, hover borders
- `destructive` - Error states and messages
- `gray-*` - Borders, backgrounds, text
- Automatic dark mode variants

## Data Flow

1. **Emirates Loading**: On mount, fetches all active emirates
2. **Emirate Selection**: User selects an emirate
3. **Areas Loading**: Automatically fetches areas for selected emirate
4. **Area Selection**: User selects an area (dependent on emirate)
5. **Text Inputs**: User fills street name and house number
6. **Change Emission**: Each change triggers `onChange` with merged values

## API Endpoints

The component depends on these API routes:

### GET /api/db/emirates
Returns list of active emirates:
```json
{
  "data": [
    {
      "Id": 1,
      "TitleAr": "أبوظبي",
      "TitleEn": "Abu Dhabi",
      "IsActive": true
    }
  ]
}
```

### GET /api/db/areas
Query params:
- `zoneId` (required): Emirate or Zone ID
- `isAbuDhabi`: "1" for Abu Dhabi special handling
- `gradeCode`: Optional filter
- `genderCode`: Optional filter

Returns:
```json
{
  "data": [
    {
      "Id": 1,
      "TitleAr": "المنطقة الغربية",
      "TitleEn": "Western Region",
      "IsActive": true,
      "ZoneId": 1,
      "ManhalCode": null
    }
  ],
  "meta": {
    "zoneId": 1,
    "isAbuDhabi": false,
    "gradeCode": null,
    "genderCode": null,
    "count": 1
  }
}
```

## Troubleshooting

### Areas not loading
- Check that an emirate is selected first
- Verify the emirateId is a valid number
- Check network tab for API errors

### Wrong language displayed
- Ensure i18n provider is set up correctly
- Check locale in browser console
- Verify TitleAr/TitleEn exist in API data

### Validation not showing
- Errors only show after field is "touched" (blur event)
- Ensure `required` prop is set
- Check that field names match exactly

### Theme colors not applying
- Verify ThemeProvider is in parent tree
- Check CSS custom properties in browser devtools
- Ensure Tailwind classes are not purged

## Future Enhancements

Potential improvements:
- [ ] Add loading skeleton for better UX
- [ ] Support for multiple addresses (array mode)
- [ ] Integration with react-hook-form
- [ ] Zod schema export for validation
- [ ] Toast notifications for fetch errors
- [ ] Autocomplete for street names
- [ ] Map integration for address verification

## Contributing

When modifying this component:
1. Maintain RTL/LTR compatibility
2. Test all themes including dark mode
3. Preserve accessibility features
4. Update this README with changes
5. Test with real API endpoints
6. Verify error states work correctly

## Related Files

- Component: `app/components/forms/AddressFields.tsx`
- Demo: `app/debug/address-demo/page.tsx`
- APIs: 
  - `app/api/db/emirates/route.ts`
  - `app/api/db/areas/route.ts`
- Types: Defined inline in component
- Theme: `app/components/ThemeProvider.tsx`
- i18n: `app/i18n/I18nProvider.tsx`
